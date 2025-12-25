import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useWindowStore } from '../store/windowStore'
import type { Customer, Product, Supplier, WarehouseLocation } from '@shared/types'
import TableSettingsModal from './TableSettingsModal'
import ConfirmDialog from './ConfirmDialog'
import InvoiceTable from './InvoiceTable'
import { InvoiceItem, ModalData, TableColumnConfig, FunctionSettings } from './InvoiceTypes'
import Products2 from '../pages/Products2'
import { productsAPI } from '../services/api'

// New Components & Hooks
import InvoiceHeader from './InvoiceHeader'
import InvoiceFooter from './InvoiceFooter'
import UniversalToolBar from './UniversalToolBar'
import BarcodeScanner from './BarcodeScanner'
import { useInvoiceLogic } from '../hooks/useInvoiceLogic'
import { useInvoiceShortcuts } from '../hooks/useInvoiceShortcuts'

// Re-export for consumers like Satis.tsx
export type { InvoiceItem, ModalData }

const TABLE_COLUMNS_STORAGE_KEY = 'invoice-modal-table-columns'
const FUNCTION_SETTINGS_STORAGE_KEY = 'invoice-modal-function-settings'

const BASE_TABLE_COLUMNS: TableColumnConfig[] = [
  { id: 'checkbox', label: 'Seçim', visible: true, width: 40, order: 0 },
  { id: 'number', label: '№', visible: true, width: 50, order: 1 },
  { id: 'product', label: 'Məhsul', visible: true, width: 200, order: 2 },
  { id: 'code', label: 'Kod', visible: true, width: 120, order: 3 },
  { id: 'barcode', label: 'Barkod', visible: true, width: 120, order: 4 },
  { id: 'unit', label: 'Vahid', visible: true, width: 80, order: 5 },
  { id: 'quantity', label: 'Miqdar', visible: true, width: 100, order: 6 },
  { id: 'unitPrice', label: 'Vahid qiymət', visible: true, width: 120, order: 7 },
  { id: 'discountAuto', label: 'Avto %', visible: true, width: 80, order: 8 },
  { id: 'discountManual', label: 'Manual %', visible: true, width: 80, order: 9 },
  { id: 'total', label: 'Cəm', visible: true, width: 120, order: 10 },
]

const normalizeColumns = (source?: Partial<TableColumnConfig>[]): TableColumnConfig[] => {
  if (!source || !Array.isArray(source)) {
    return BASE_TABLE_COLUMNS.map((col) => ({ ...col }))
  }
  const sourceMap = new Map(source.map((col) => [col?.id, col]))
  return BASE_TABLE_COLUMNS.map((baseCol) => {
    const stored = sourceMap.get(baseCol.id)
    return {
      ...baseCol,
      visible: typeof stored?.visible === 'boolean' ? stored.visible : baseCol.visible,
      width: typeof stored?.width === 'number' ? stored.width : baseCol.width,
      order: typeof stored?.order === 'number' ? stored.order : baseCol.order,
    }
  })
}

interface InvoiceModalProps {
  modal: ModalData
  customers?: Customer[]
  suppliers?: Supplier[]
  products: Product[]
  modalIndex: number
  isActive: boolean
  onClose: (modalId: string, force?: boolean) => void
  onUpdate: (modalId: string, updates: Partial<ModalData>) => void
  onSave: (modalId: string, modalData: ModalData['data']) => Promise<void>
  onSaveAndConfirm?: (modalId: string, modalData: ModalData['data']) => Promise<void>
  onActivate?: (modalId: string) => void
  windowId: string
  onPrint?: (modalId: string, modalData: ModalData['data']) => void
  isEmbedded?: boolean
  warehouses?: WarehouseLocation[]
  activeConfirmDialog?: any
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  modal,
  customers = [],
  suppliers = [],
  products,
  isActive,
  onClose,
  onUpdate,
  onSave,
  onSaveAndConfirm,
  onActivate,
  windowId,
  onPrint,
  isEmbedded = false,
  warehouses = [],
  activeConfirmDialog,
}) => {
  const invoiceType = modal.invoiceType || 'sale'
  const isPurchase = invoiceType === 'purchase'

  // --- Logic Hook ---
  const {
    localData,
    setLocalData,
    handleAddEmptyRow,
    handleTableUpdateItem,
    handleProductSelectInRow
  } = useInvoiceLogic({
    modal,
    products,
    customers,
    suppliers,
    onUpdate,
    isPurchase
  })

  // --- UI State ---
  const [activeTab, setActiveTab] = useState<'items' | 'functions'>('items')
  const [selectedItemIndices, setSelectedItemIndices] = useState<number[]>([])

  // Sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Window State
  const { windows, updateWindow, minimizeWindow } = useWindowStore()
  const windowInfo = windows.get(windowId)
  const isMinimized = windowInfo?.isMinimized || false
  const isVisible = windowInfo?.isVisible !== false

  const effectivePosition = useMemo(() => windowInfo?.position || modal.position, [windowInfo?.position, modal.position])
  const [localSize, setLocalSize] = useState<{ width: number, height: number } | null>(null)
  const effectiveSize = useMemo(() => {
    if (localSize) return localSize
    return windowInfo?.size || modal.size
  }, [localSize, windowInfo?.size, modal.size])

  // Drag & Resize State
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 })
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 })

  const navbarHeight = 40
  const taskbarHeight = 25

  // Table Settings
  const [tableColumns, setTableColumns] = useState<TableColumnConfig[]>(() => {
    if (typeof window === 'undefined') return normalizeColumns()
    try {
      const stored = window.localStorage.getItem(TABLE_COLUMNS_STORAGE_KEY)
      return stored ? normalizeColumns(JSON.parse(stored)) : normalizeColumns()
    } catch { return normalizeColumns() }
  })

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(TABLE_COLUMNS_STORAGE_KEY, JSON.stringify(tableColumns))
    } catch { }
  }, [tableColumns])

  const [functionSettings] = useState<FunctionSettings>(() => {
    try {
      const stored = localStorage.getItem(FUNCTION_SETTINGS_STORAGE_KEY)
      return stored ? JSON.parse(stored) : { enableColumnDrag: true, enableColumnResize: true }
    } catch { return { enableColumnDrag: true, enableColumnResize: true } }
  })

  useEffect(() => {
    localStorage.setItem(FUNCTION_SETTINGS_STORAGE_KEY, JSON.stringify(functionSettings))
  }, [functionSettings])


  // --- Helper Functions (Navigation & Helpers) ---

  const openProductsSelect = (index: number) => {
    const currentItem = localData.invoiceItems[index]
    const currentProductId = currentItem?.product_id || null

    useWindowStore.getState().openPageWindow(
      'products-page-select',
      'Məhsul Seçimi',
      '📦',
      <Products2
        initialSelectedProductId={currentProductId}
        onSelect={(product: Product) => {
          handleProductSelectInRow(index, product.id, product)
          useWindowStore.getState().closePageWindow('products-page-select')
        }}
      />,
      {
        width: Math.min(1000, window.innerWidth - 40),
        height: Math.min(700, window.innerHeight - 100)
      }
    )
  }

  const handleOpenProductDetails = async (productId: number, _productName: string) => {
    try {
      const product = await productsAPI.getById(productId.toString())
      useWindowStore.getState().openPageWindow(
        'products2-locate',
        'Məhsullar',
        '📦',
        <Products2
          initialSelectedProductId={productId}
          initialCategoryId={product.category_id || null}
          onSelect={() => useWindowStore.getState().closePageWindow('products2-locate')}
        />,
        { width: 850, height: 700 }
      )
    } catch (err) {
      console.error('[InvoiceModal] Failed to locate product:', err)
      alert('Məhsul məlumatları yüklənərkən xəta baş verdi.')
    }
  }

  const openTableSettings = () => {
    const windowId = `invoice-table-settings-${isPurchase ? 'purchase' : 'sale'}`
    useWindowStore.getState().openPageWindow(
      windowId,
      'Məhsul Cədvəli Ayarları',
      '⚙️',
      <TableSettingsModal
        columns={tableColumns}
        onColumnsChange={setTableColumns}
        onClose={() => useWindowStore.getState().closeWindow(windowId)}
        embedded={true}
        defaultColumns={BASE_TABLE_COLUMNS}
        functionSettings={functionSettings}
        onFunctionSettingsChange={(_) => {
          // If needed, update local settings state
        }}
        showFunctionsTab={true}
        onSaveAsDefault={() => {
          const settingsKey = `invoice-modal-settings-${isPurchase ? 'purchase' : 'sale'}`
          const settings = { tableColumns, enableColumnDrag: functionSettings.enableColumnDrag, timestamp: Date.now() }
          localStorage.setItem(settingsKey, JSON.stringify(settings))
          alert('Ayarlar varsayılan olaraq saxlanıldı!')
        }}
      />,
      { width: 700, height: 600 }
    )
  }

  // Async Search State
  const [autocompleteResults, setAutocompleteResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleAsyncSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setAutocompleteResults([])
      return
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Determine price type for optimization? API just returns products.
        // We limit to 20 items for dropdown
        const results = await productsAPI.getAll({
          search: term,
          limit: 20,
          page: 1
        })
        setAutocompleteResults(results)
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setIsSearching(false)
      }
    }, 300) // 300ms debounce
  }, [])

  // Wrapper for item updates to trigger search
  const handleItemUpdateWithSearch = (index: number, updates: Partial<InvoiceItem>) => {
    handleTableUpdateItem(index, updates)
    if (updates.searchTerm !== undefined) {
      handleAsyncSearch(updates.searchTerm)
    }
  }

  // Product Cache for existing items
  const [productCache, setProductCache] = useState<Map<number, Product>>(new Map())

  // Fetch details for items currently in invoice if missing from props/search
  useEffect(() => {
    const fetchMissingProducts = async () => {
      const currentIds = localData.invoiceItems
        .map(item => item.product_id)
        .filter((id): id is number => id !== null)

      // Check which IDs are missing from everywhere
      const missingIds = currentIds.filter(id => {
        const inProps = products.some(p => p.id === id)
        const inSearch = autocompleteResults.some(p => p.id === id)
        const inCache = productCache.has(id)
        return !inProps && !inSearch && !inCache
      })

      if (missingIds.length === 0) return

      try {
        // Deduplicate ids
        const uniqueIds = Array.from(new Set(missingIds))
        if (uniqueIds.length === 0) return

        console.log('Fetching missing products:', uniqueIds)
        const fetchedProducts = await productsAPI.getAll({ ids: uniqueIds.join(',') })

        if (fetchedProducts && fetchedProducts.length > 0) {
          setProductCache(prev => {
            const newCache = new Map(prev)
            fetchedProducts.forEach(p => newCache.set(p.id, p))
            return newCache
          })
        }
      } catch (err) {
        console.error("Failed to fetch missing products:", err)
      }
    }

    const timer = setTimeout(fetchMissingProducts, 500)
    return () => clearTimeout(timer)
  }, [localData.invoiceItems, products, autocompleteResults, productCache])

  const getProductInfo = (productId: number | null) => {
    if (!productId) return { code: '', barcode: '', unit: '' }
    // Look in all sources: 1. Props (if any), 2. Search Results, 3. Cache
    const product = products.find(p => p.id === productId)
      || autocompleteResults.find(p => p.id === productId)
      || productCache.get(productId)

    return {
      code: product?.code || '',
      barcode: product?.barcode || '',
      unit: product?.unit || ''
    }
  }

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnId)
      setSortDirection('asc')
    }
  }

  const isOKDisabled = useMemo(() => {
    if (isPurchase && !localData.selectedSupplierId) return true
    if (!isPurchase && !localData.selectedCustomerId) return true
    const validItems = localData.invoiceItems.filter(item => item.product_id !== null)
    if (validItems.length === 0) return true
    return false
  }, [localData, isPurchase])

  const handleDeleteRows = useCallback(() => {
    if (selectedItemIndices.length === 0) return

    const sortedIndices = [...selectedItemIndices].sort((a, b) => b - a)
    const minIndex = Math.min(...selectedItemIndices)
    const newItems = [...localData.invoiceItems]

    sortedIndices.forEach(idx => {
      if (idx >= 0 && idx < newItems.length) newItems.splice(idx, 1)
    })

    setLocalData({ ...localData, invoiceItems: newItems })

    // Selection & Focus Logic
    if (newItems.length > 0) {
      let nextIndex = minIndex - 1
      if (nextIndex < 0) nextIndex = 0
      if (nextIndex >= newItems.length) nextIndex = newItems.length - 1

      setSelectedItemIndices([nextIndex])

      // Focus
      setTimeout(() => {
        const selector = `input[data-row-index="${nextIndex}"][data-col-id="product"]`
        const el = document.querySelector(selector) as HTMLElement
        if (el) {
          el.focus()
          if (el instanceof HTMLInputElement) el.select()
        }
      }, 50)
    } else {
      setSelectedItemIndices([])
    }
  }, [selectedItemIndices, localData.invoiceItems, setLocalData, setSelectedItemIndices])

  const handleBarcode = useCallback(() => {
    useWindowStore.getState().openPageWindow(
      'barcode-scanner',
      'Barkod Skaner',
      '📱',
      <BarcodeScanner
        onScanSuccess={async (decodedText: string) => {
          const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
          try { audio.play().catch(() => { }); } catch (e) { }

          console.log(`Barkod oxundu: ${decodedText}`);
          try {
            // Use getAll with search param
            const products = await productsAPI.getAll({ search: decodedText });
            if (products && products.length > 0) {
              const product = products.find((p: any) => p.barcode === decodedText || p.barCode === decodedText) || products[0];

              setLocalData(prev => {
                const emptyRowIndex = prev.invoiceItems.findIndex(item => !item.product_id);
                let newItems = [...prev.invoiceItems];

                // Determine price based on purchase/sale
                // Note: Product type usually has sale_price and buying_price
                const p = product as any;
                const price = isPurchase ? (p.buying_price || p.purchase_price || 0) : (p.sale_price || p.price || 0);
                const qty = 1;
                const total = price * qty;

                const newItemData: InvoiceItem = {
                  product_id: product.id,
                  product_name: product.name,
                  quantity: qty,
                  unit_price: price,
                  total_price: total,
                  unit: product.unit || 'əd', // Assuming unit is a string or we default
                  searchTerm: product.name,
                  discount_auto: 0,
                  discount_manual: 0,
                  vat_rate: 0
                };

                if (emptyRowIndex !== -1) {
                  newItems[emptyRowIndex] = {
                    ...newItems[emptyRowIndex],
                    ...newItemData
                  };
                } else {
                  newItems.push(newItemData);
                }
                return { ...prev, invoiceItems: newItems };
              })
            } else {
              // alert('Məhsul tapılmadı: ' + decodedText);
            }
          } catch (error) {
            console.error('Scan error:', error);
          }
        }}
      />,
      { width: 400, height: 400 }
    )
  }, [setLocalData, isPurchase])


  // --- Shortcuts Hook ---
  useInvoiceShortcuts({
    isActive,
    isVisible,
    isMinimized,
    modalId: modal.id,
    localData,
    setLocalData,
    selectedItemIndices,
    onClose,
    onSave,
    onPrint,
    openProductsSelect,
    handleAddEmptyRow,
    onDeleteSelected: handleDeleteRows
  })

  // --- Window Drag & Resize Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('modal-header') || target.closest('.modal-header')) {
      if (target.tagName === 'BUTTON' || target.closest('button')) return
      setIsDragging(true)
      const currentPosition = windowInfo?.position || modal.position
      setDragStart({ x: e.clientX - currentPosition.x, y: e.clientY - currentPosition.y })
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    const currentSize = effectiveSize
    setResizeStart({ x: e.clientX, y: e.clientY })
    setResizeStartSize({ width: currentSize.width, height: currentSize.height })
    setLocalSize(null)
  }

  useEffect(() => {
    if (!isDragging && !isResizing) return
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !modal.isMaximized) {
        const currentSize = effectiveSize
        const newX = Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - currentSize.width))
        const newY = Math.max(0, Math.min(e.clientY - dragStart.y, window.innerHeight - currentSize.height))
        onUpdate(modal.id, { position: { x: newX, y: newY } })
        updateWindow(windowId, { position: { x: newX, y: newY } })
      }
      if (isResizing && !modal.isMaximized) {
        const currentPosition = effectivePosition
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        const newWidth = Math.max(500, Math.min(resizeStartSize.width + deltaX, window.innerWidth - currentPosition.x))
        const newHeight = Math.max(400, Math.min(resizeStartSize.height + deltaY, window.innerHeight - currentPosition.y))
        setLocalSize({ width: newWidth, height: newHeight })
      }
    }
    const handleMouseUp = () => {
      if (isResizing && localSize) {
        onUpdate(modal.id, { size: localSize })
        updateWindow(windowId, { size: localSize })
        setLocalSize(null)
      }
      setIsDragging(false)
      setIsResizing(false)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, dragStart, resizeStart, resizeStartSize, localSize, modal.id, modal.isMaximized, effectivePosition, effectiveSize, onUpdate, windowId, updateWindow])


  if (isMinimized || !isVisible) return null
  const modalZIndex = Math.min(Math.max(modal.zIndex, 1001), 9999)

  // --- Render ---
  const content = (
    <>
      {activeConfirmDialog && <ConfirmDialog {...activeConfirmDialog} />}

      <InvoiceHeader
        isPurchase={isPurchase}
        localData={localData}
        setLocalData={setLocalData}
        suppliers={suppliers}
        customers={customers}
        warehouses={warehouses}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2px', marginBottom: '0', borderBottom: '1px solid #e0e0e0' }}>
        <button
          onClick={() => setActiveTab('items')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'items' ? '#fff' : '#f8f9fa',
            border: '1px solid #e0e0e0',
            borderBottom: activeTab === 'items' ? '1px solid transparent' : '1px solid #dee2e6',
            marginBottom: '-1px',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'items' ? '600' : '400',
            color: activeTab === 'items' ? '#007bff' : '#6c757d',
            fontSize: '0.95rem'
          }}
        >
          Cədvəl
        </button>
        <button
          onClick={() => setActiveTab('functions')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'functions' ? '#fff' : '#f8f9fa',
            border: '1px solid #dee2e6',
            borderBottom: activeTab === 'functions' ? '1px solid transparent' : '1px solid #dee2e6',
            marginBottom: '-1px',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'functions' ? '600' : '400',
            color: activeTab === 'functions' ? '#007bff' : '#6c757d',
            fontSize: '0.95rem'
          }}
        >
          Funksiyalar
        </button>
      </div>

      {activeTab === 'items' ? (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Universal Toolbar */}
            <div style={{ borderBottom: '1px solid #ddd' }}>
              <UniversalToolBar
                initialTools={['add', 'delete', 'copy', 'barcode', 'settings']}
                onAdd={handleAddEmptyRow}
                onBarcode={handleBarcode}
                onDelete={selectedItemIndices.length > 0 ? handleDeleteRows : undefined}
                onCopy={selectedItemIndices.length > 0 ? () => {
                  const sortedIndices = [...selectedItemIndices].sort((a, b) => a - b)
                  const newItems = [...localData.invoiceItems]
                  const copiedItems = sortedIndices.map(index => ({ ...newItems[index] }))
                  setLocalData(prev => ({ ...prev, invoiceItems: [...newItems, ...copiedItems] }))
                } : undefined}
                onSettings={() => useWindowStore.getState().openPageWindow(
                  'table-settings',
                  'Cədvəl Ayarları',
                  '⚙️',
                  <TableSettingsModal
                    columns={tableColumns}
                    onColumnsChange={setTableColumns}
                    onClose={() => useWindowStore.getState().closePageWindow('table-settings')}
                    onSave={(newCols) => {
                      setTableColumns(newCols)
                      useWindowStore.getState().closePageWindow('table-settings')
                    }}
                  />,
                  { width: 400, height: 500 }
                )}
              />
            </div>

            <InvoiceTable
              items={localData.invoiceItems}
              columns={tableColumns}
              onColumnsChange={setTableColumns}
              selectedItemIndices={selectedItemIndices}
              onRowSelect={setSelectedItemIndices}
              functionSettings={functionSettings}
              onUpdateItem={handleItemUpdateWithSearch}
              onProductSelect={(idx, prod) => handleProductSelectInRow(idx, prod.id, prod)}
              onOpenProductSelect={openProductsSelect}
              onOpenProductDetails={handleOpenProductDetails}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              getProductInfo={getProductInfo}
              suggestions={autocompleteResults}
              isSearching={isSearching}
              isPurchase={isPurchase}
            />
            {/* Total Row */}
            <div style={{ padding: '7px 16px', borderTop: '1px solid #dee2e6', background: '#f8f9fa', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.5rem' }}>
              <span>Miqdar: {localData.invoiceItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
              <span style={{ fontWeight: 'bold' }}>Cəmi: {localData.invoiceItems.reduce((sum, item) => sum + (item.total_price || 0), 0).toFixed(2)} ₼</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '1.5rem', flex: 1 }}>
          <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1.5rem', border: '1px solid #dee2e6', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            <button onClick={openTableSettings} style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '2rem' }}>⚙️</span>
              Cədvəl Ayarları
            </button>
            <button onClick={() => onPrint && onPrint(modal.id, localData)} style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '2rem' }}>🖨️</span>
              Çap Et
            </button>
          </div>
        </div>
      )}

      <InvoiceFooter
        localData={localData}
        setLocalData={setLocalData}
        modalId={modal.id}
        isPurchase={isPurchase}
        onClose={(id, force) => {
          onClose(id, force)
        }}
        onSave={onSave}
        onSaveAndConfirm={onSaveAndConfirm}
        onPrint={onPrint}
        isOKDisabled={isOKDisabled}
      />
    </>
  )

  if (isEmbedded) {
    return <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '5px', position: 'relative' }}>{content}</div>
  }

  return (
    <div style={{ pointerEvents: 'auto', position: 'fixed', top: navbarHeight, left: 0, right: 0, bottom: taskbarHeight, background: 'rgba(0,0,0,0.3)', zIndex: modalZIndex }}
      onClick={(e) => { if (e.target === e.currentTarget && !isActive) onActivate?.(modal.id) }}>
      <div style={{
        position: 'absolute',
        left: effectivePosition.x, top: effectivePosition.y, width: effectiveSize.width, height: effectiveSize.height,
        background: 'white', borderRadius: modal.isMaximized ? 0 : '8px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)', overflow: 'hidden'
      }} onClick={(e) => { e.stopPropagation(); if (!isActive) onActivate?.(modal.id) }}>
        {/* Modal Header */}
        <div className="modal-header" onMouseDown={handleMouseDown} style={{ padding: '0.75rem 1rem', background: '#007bff', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isDragging ? 'grabbing' : 'grab' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>{modal.invoiceId ? `Qaimə #${modal.invoiceId}` : isPurchase ? 'Yeni Alış Qaiməsi' : 'Yeni Satış Qaiməsi'}</h2>
          <div>
            <button onClick={() => { minimizeWindow(windowId); onUpdate(modal.id, { isMaximized: false }) }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', marginRight: '5px' }}>_</button>
            <button onClick={() => {
              if (!modal.isMaximized) {
                const availableHeight = window.innerHeight - navbarHeight - taskbarHeight
                onUpdate(modal.id, { isMaximized: true, position: { x: 0, y: navbarHeight }, size: { width: window.innerWidth, height: availableHeight } })
              } else {
                const savedSize = JSON.parse(localStorage.getItem('satis-qaime-modal-size') || '{"width":900,"height":600}')
                onUpdate(modal.id, { isMaximized: false, size: savedSize, position: { x: (window.innerWidth - savedSize.width) / 2, y: (window.innerHeight - savedSize.height) / 2 } })
              }
            }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', marginRight: '5px' }}>{modal.isMaximized ? '❐' : '□'}</button>
            <button onClick={() => onClose(modal.id)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
        {content}

        {/* Resize Handle */}
        {!modal.isMaximized && (
          <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', bottom: 0, right: 0, width: '15px', height: '15px', cursor: 'nwse-resize', zIndex: 10 }} />
        )}
      </div>
    </div>
  )
}

export default InvoiceModal
