import React, { useState, useEffect, useMemo } from 'react'
import { useWindowStore } from '../store/windowStore'
import { formatDateInput, convertDisplayToRaw, formatDateToDisplay, parseSmartDate } from '../utils/dateUtils'
import type { Customer, Product, Supplier, WarehouseLocation, DiscountDocument } from '@shared/types'
import TableSettingsModal from './TableSettingsModal'
import ConfirmDialog from './ConfirmDialog'
import { purchaseInvoicesAPI, productDiscountsAPI } from '../services/api'
import SmartDateInput from './SmartDateInput'

import PartnerSelect from './PartnerSelect'
import InvoiceTable from './InvoiceTable'
import { InvoiceItem, ModalData, TableColumnConfig, FunctionSettings } from './InvoiceTypes'
import Products2 from '../pages/Products2'
import { productsAPI } from '../services/api'

// Re-export for consumers like Satis.tsx
export type { InvoiceItem, ModalData }

const COLUMN_DRAG_STORAGE_KEY = 'invoice-modal-column-drag-enabled'
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
  onClose: (modalId: string) => void
  onUpdate: (modalId: string, updates: Partial<ModalData>) => void
  onSave: (modalId: string, modalData: ModalData['data']) => Promise<void>
  onSaveAndConfirm?: (modalId: string, modalData: ModalData['data']) => Promise<void> // OK düyməsi üçün - yadda saxla və təsdiqlə
  onActivate?: (modalId: string) => void
  windowId: string
  onPrint?: (modalId: string, modalData: ModalData['data']) => void // Çap funksiyası
  isEmbedded?: boolean
  warehouses?: WarehouseLocation[]
  activeConfirmDialog?: any // ConfirmDialogProps, but imported implicitly or we use 'any' to avoid circular ref if types are mixed. Best to import component.
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
  // Products imported at top
  const invoiceType = modal.invoiceType || 'sale' // Default satış
  const isPurchase = invoiceType === 'purchase'
  /* ----------------------------------------------------------------------------------------------
   * STATE & INITIALIZATION
   * ---------------------------------------------------------------------------------------------- */


  // Product Selection Modal State


  const [localData, setLocalData] = useState(modal.data)

  // Sync state from props when parent updates it (e.g. after save)
  useEffect(() => {
    setLocalData(prev => ({
      ...prev,
      ...modal.data
    }))
  }, [modal.data])

  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 })
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 })
  const [localSize, setLocalSize] = useState<{ width: number, height: number } | null>(null)

  const navbarHeight = 40
  const taskbarHeight = 25

  // Window store
  const { windows, updateWindow, minimizeWindow } = useWindowStore()
  const windowInfo = windows.get(windowId)
  const isMinimized = windowInfo?.isMinimized || false
  const isVisible = windowInfo?.isVisible !== false

  // Window store-dan position və size al (tile windows üçün)
  const effectivePosition = React.useMemo(() => windowInfo?.position || modal.position, [windowInfo?.position, modal.position])
  // Resize sırasında local size kullan, yoksa window store veya modal size
  const effectiveSize = React.useMemo(() => {
    if (localSize) return localSize
    return windowInfo?.size || modal.size
  }, [localSize, windowInfo?.size, modal.size])

  // UI State
  const [activeTab, setActiveTab] = useState<'items' | 'functions'>('items')
  console.log(`[${new Date().toISOString()}] [InvoiceModal] RENDER CHECK. isActive:`, isActive)

  // Product Modal State removed

  // Form state-ləri

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null)

  // Search terms and dropdowns removed as now handled by PartnerSelect
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showInvoiceDatePicker, setShowInvoiceDatePicker] = useState(false)

  const [notesFocused, setNotesFocused] = useState(false)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [selectedItemIndices, setSelectedItemIndices] = useState<number[]>([])

  const [enableColumnDrag, setEnableColumnDrag] = useState(false)

  // Open table settings via UniversalWindow
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
        onFunctionSettingsChange={(settings) => {
          if (settings.enableColumnDrag !== undefined) {
            updateEnableColumnDrag(settings.enableColumnDrag)
          }
        }}
        showFunctionsTab={true}
        onSaveAsDefault={() => {
          try {
            const settingsKey = `invoice-modal-settings-${isPurchase ? 'purchase' : 'sale'}`
            const settings = {
              tableColumns,
              enableColumnDrag,
              timestamp: Date.now()
            }
            localStorage.setItem(settingsKey, JSON.stringify(settings))
            alert('Ayarlar varsayılan olaraq saxlanıldı!')
          } catch (err) {
            console.error('Ayarlar saxlanarkən xəta:', err)
            alert('Ayarlar saxlanarkən xəta baş verdi')
          }
        }}
      />,
      { width: 700, height: 600 }
    )
  }


  const [tableColumns, setTableColumns] = useState<TableColumnConfig[]>(() => {
    if (typeof window === 'undefined') {
      return normalizeColumns()
    }
    try {
      const stored = window.localStorage.getItem(TABLE_COLUMNS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return normalizeColumns(parsed)
      }
    } catch {
      // ignore parse errors
    }
    return normalizeColumns()
  })



  // Köhnə format üçün helper funksiyalar (backward compatibility)






  // Function Settings State
  const [functionSettings] = useState<FunctionSettings>(() => {
    try {
      const stored = localStorage.getItem(FUNCTION_SETTINGS_STORAGE_KEY)
      return stored ? JSON.parse(stored) : { enableColumnDrag: true, enableColumnResize: true }
    } catch {
      return { enableColumnDrag: true, enableColumnResize: true }
    }
  })

  useEffect(() => {
    localStorage.setItem(FUNCTION_SETTINGS_STORAGE_KEY, JSON.stringify(functionSettings))
  }, [functionSettings])

  // Sync legacy enableColumnDrag state with new object for backward compatibility if needed
  // or just use functionSettings.enableColumnDrag directly in the rest of the file
  // For now, let's keep enableColumnDrag specific state as derived or synced if used elsewhere
  useEffect(() => {
    setEnableColumnDrag(functionSettings.enableColumnDrag || false)
  }, [functionSettings.enableColumnDrag])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedValue = window.localStorage.getItem(COLUMN_DRAG_STORAGE_KEY)
        if (storedValue !== null) {
          // Legacy support: if exists, might want to respect it, but functionSettings should be source of truth now
        }
      }
    } catch {
      // ignore storage read errors
    }
  }, [])

  // Keyboard Event Listener for Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only listener if window is active and not editing an input
      if (!isActive) return

      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      let shouldDelete = false
      if (e.key === 'Delete' && selectedItemIndices.length > 0) {
        if (!isInput) {
          shouldDelete = true
        } else {
          // If input is empty, treat as row delete command
          const val = (target as HTMLInputElement).value
          // Careful: val might be undefined if not input
          if (!val) shouldDelete = true
        }
      }

      if (shouldDelete) {
        if (isInput) e.preventDefault()
        console.log('[DEBUG] Deleting rows:', selectedItemIndices)

        // Sort indices descending
        const sortedIndices = [...selectedItemIndices].sort((a, b) => b - a)
        const minIndex = Math.min(...selectedItemIndices)

        const newItems = [...localData.invoiceItems]
        sortedIndices.forEach(idx => {
          if (idx >= 0 && idx < newItems.length) newItems.splice(idx, 1)
        })

        setLocalData(prev => ({ ...prev, invoiceItems: newItems }))

        // AUTO-SELECT & FOCUS
        if (newItems.length > 0) {
          let nextIndex = minIndex - 1
          if (nextIndex < 0) nextIndex = 0
          if (nextIndex >= newItems.length) nextIndex = newItems.length - 1

          console.log('[DEBUG] Auto-selecting target index:', nextIndex)
          setSelectedItemIndices([nextIndex])

          // Robust Focus Attempt
          const attemptFocus = (retries = 3) => {
            const selector = `input[data-row-index="${nextIndex}"][data-col-id="product"]`
            const el = document.querySelector(selector) as HTMLElement

            if (el) {
              console.log('[DEBUG] Focus successful on:', selector)
              el.focus()
              if (el instanceof HTMLInputElement) el.select()
            } else if (retries > 0) {
              console.log('[DEBUG] Focus target not found, retrying...', retries)
              setTimeout(() => attemptFocus(retries - 1), 100)
            } else {
              console.warn('[DEBUG] Failed to focus on:', selector)
            }
          }

          // Wait for render
          setTimeout(() => attemptFocus(), 50)
        } else {
          setSelectedItemIndices([])
        }
      }

      // F4 key for Product/Supplier Selection
      if (e.key === 'F4') {
        e.preventDefault()

        // Check if supplier input is focused (for purchase invoices)


        // Case 1: Product input focused (check data-row-index)
        if (isInput) {
          const input = target as HTMLInputElement
          const rowIdxAttr = input.getAttribute('data-row-index')
          if (rowIdxAttr) {
            openProductsSelect(parseInt(rowIdxAttr))
            return
          }
        }

        // Case 2: Row selected (single row)
        if (selectedItemIndices.length === 1) {
          openProductsSelect(selectedItemIndices[0])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, selectedItemIndices, localData.invoiceItems])

  const updateEnableColumnDrag = React.useCallback((value: boolean) => {
    setEnableColumnDrag(value)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(COLUMN_DRAG_STORAGE_KEY, value ? 'true' : 'false')
      }
    } catch {
      // ignore storage write errors
    }
  }, [])

  // Column resize handler



  // Removed derived functionSettings to avoid conflict with state variable
  // const functionSettings: FunctionSettings = useMemo(() => ({
  //   enableColumnDrag
  // }), [enableColumnDrag])



  // functionTabContent removed - now using TableSettingsModal's built-in function settings

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(TABLE_COLUMNS_STORAGE_KEY, JSON.stringify(tableColumns))
      }
    } catch {
      // ignore storage write errors
    }
  }, [tableColumns])

  // Filtered lists






  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnId)
      setSortDirection('asc')
    }
  }

  const handleOpenProductDetails = async (productId: number, productName: string) => {
    console.log(`[${new Date().toISOString()}] [InvoiceModal] handleOpenProductDetails called`, productId, productName)

    try {
      // Fetch product to get category_id
      const product = await productsAPI.getById(productId.toString())

      // Open Products2 and navigate to product's location
      useWindowStore.getState().openPageWindow(
        'products2-locate',
        'Məhsullar',
        '📦',
        <Products2
          initialSelectedProductId={productId}
          initialCategoryId={product.category_id || null}
          onSelect={() => {
            // Close window when user clicks on product in locate mode
            useWindowStore.getState().closePageWindow('products2-locate')
          }}
        />,
        {
          width: 850,
          height: 700
        }
      )
    } catch (err) {
      console.error('[InvoiceModal] Failed to locate product:', err)
      alert('Məhsul məlumatları yüklənərkən xəta baş verdi.')
    }
  }





  // Custom date functions removed - now using SmartDateInput component

  // Modal açılanda tarixi avtomatik set et (yalnız yeni qaimələr üçün)
  useEffect(() => {
    if (!modal.data.invoiceDate && !localData.invoiceDate) {
      const now = new Date()
      const day = String(now.getDate()).padStart(2, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const year = now.getFullYear()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      setLocalData(prev => ({ ...prev, invoiceDate: formattedDate }))
    }
  }, [modal.data.invoiceDate]) // Yalnız modal açılanda və ya invoiceDate dəyişdikdə


  // Helper functions
  const handleAddEmptyRow = () => {
    const newItems = [...localData.invoiceItems, {
      product_id: null,
      product_name: '',
      quantity: 0,
      unit_price: 0,
      total_price: 0,
    }]
    setLocalData({ ...localData, invoiceItems: newItems })
  }



  const handleTableUpdateItem = (index: number, updates: Partial<InvoiceItem>) => {
    const updatedItems = [...localData.invoiceItems]
    const currentItem = updatedItems[index]
    const newItem = { ...currentItem, ...updates }

    // Recalc logic if needed
    if ('quantity' in updates || 'unit_price' in updates || 'discount_manual' in updates || 'discount_auto' in updates) {
      const qty = newItem.quantity || 0
      const price = newItem.unit_price || 0
      const totalDisc = (newItem.discount_auto || 0) + (newItem.discount_manual || 0)
      newItem.total_price = (qty * price) * (1 - totalDisc / 100)
    }

    updatedItems[index] = newItem
    setLocalData(prev => ({ ...prev, invoiceItems: updatedItems }))
  }







  // Hər sətir üçün məhsul axtarışı
  const getFilteredProductsForRow = (searchTerm: string) => {
    if (!searchTerm.trim()) return []
    const term = searchTerm.toLowerCase()
    return products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.code?.toLowerCase().includes(term) ||
      product.barcode?.toLowerCase().includes(term)
    ).slice(0, 10)
  }



  const handleProductSelectInRow = async (index: number, productId: number) => {
    console.log(`[DEBUG] handleProductSelectInRow started. Index: ${index}, ProductId: ${productId}`)
    const product = products.find(p => p.id === productId)

    if (!product) {
      console.error(`[DEBUG] Product not found in list. ProductId: ${productId}`)
      return
    }

    console.log(`[DEBUG] Found product: ${product.name}, Price: ${isPurchase ? product.purchase_price : product.sale_price}`)

    // 1. Optimistic Update (Immediate)
    // Set product details immediately so UI updates instantly and resists race conditions
    const price = isPurchase ? (product.purchase_price || 0) : (product.sale_price || 0)
    const vatRate = product.tax_rate || 0

    setLocalData(prev => {
      console.log('[DEBUG] Optimistic Update. Index:', index)
      const newItems = [...prev.invoiceItems]
      const currentItem = newItems[index]
      const currentQty = currentItem.quantity || 0
      const manualDisc = currentItem.discount_manual || 0
      // Auto disc 0 initially
      const totalDisc = Math.min(0 + manualDisc, 100)

      newItems[index] = {
        ...currentItem,
        product_id: productId,
        product_name: product.name,
        unit_price: price,
        discount_auto: 0, // Will update later
        vat_rate: vatRate,
        total_price: (currentQty * price) * (1 - totalDisc / 100),
        searchTerm: product.name
      }
      return { ...prev, invoiceItems: newItems }
    })


    // 2. Async Discount Calculation
    let autoDisc = 0

    if (isPurchase) {
      autoDisc = calculateAutoDiscount(productId)
    } else {
      // Sale Logic - Get customer from either selectedCustomer or by ID
      const customer = localData.selectedCustomer || customers.find(c => c.id === localData.selectedCustomerId)
      const customerPermanentDiscount = Number(customer?.permanent_discount || 0)

      console.log('[DEBUG] Product Select - Customer Info:', {
        selectedCustomerId: localData.selectedCustomerId,
        selectedCustomer: localData.selectedCustomer?.name,
        foundCustomer: customer?.name,
        permanentDiscount: customer?.permanent_discount,
        calculatedDiscount: customerPermanentDiscount
      })

      // Get customer temporary discount from discount documents
      let customerTempDiscount = 0
      try {
        if (customer?.id) {
          const { discountDocumentsAPI } = await import('../services/api')
          const customerDocs = await discountDocumentsAPI.getAllActive('CUSTOMER', customer.id)

          // Find active document for current date
          const now = new Date()
          const activeDoc = customerDocs.find(doc => {
            if (doc.start_date && now < new Date(doc.start_date)) return false
            if (doc.end_date && now > new Date(doc.end_date)) return false
            return true
          })

          if (activeDoc && activeDoc.items) {
            // Check for product-specific discount first
            const productItem = activeDoc.items.find((i: any) => i.product_id === productId)
            if (productItem) {
              customerTempDiscount = Number(productItem.discount_percent)
            } else {
              // Check for general discount
              const generalItem = activeDoc.items.find((i: any) => i.product_id === null)
              if (generalItem) {
                customerTempDiscount = Number(generalItem.discount_percent)
              }
            }
          }
        }
      } catch (e) {
        console.error('[DEBUG] Failed to load customer discount documents', e)
      }

      // Get product permanent discount (if exists in future)
      const productObj = products.find(p => p.id === productId)
      const productPermanentDiscount = Number((productObj as any)?.permanent_discount || 0)

      // Get product temporary discount from product discounts API
      let productTempDiscount = 0
      try {
        console.log('[DEBUG] Fetching product discounts for product:', productId)
        const discounts = await productDiscountsAPI.getAll(productId)
        const now = new Date()
        const activeDiscount = discounts.find((d: any) => {
          const start = new Date(d.start_date)
          const end = new Date(d.end_date)
          return now >= start && now <= end
        })

        if (activeDiscount) {
          productTempDiscount = Number(activeDiscount.percentage)
          console.log('[DEBUG] Found active product discount:', productTempDiscount)
        }
      } catch (e) {
        console.error('[DEBUG] Failed to load product discounts', e)
      }

      autoDisc = customerPermanentDiscount + customerTempDiscount + productPermanentDiscount + productTempDiscount
      console.log('[DEBUG] Sales Discount Breakdown:', {
        customerPermanent: customerPermanentDiscount,
        customerTemp: customerTempDiscount,
        productPermanent: productPermanentDiscount,
        productTemp: productTempDiscount,
        total: autoDisc
      })
    }

    // 3. Final Update with Discount
    console.log('[DEBUG] Final Update with Discount:', autoDisc)
    setLocalData(prev => {
      const newItems = [...prev.invoiceItems]
      // Check if item still has same product (user might have changed it while waiting)
      if (newItems[index].product_id !== productId) {
        console.warn('[DEBUG] Product changed during async op, discarding discount update')
        return prev
      }

      const currentItem = newItems[index]
      const manualDisc = currentItem.discount_manual || 0
      const totalDisc = Math.min(autoDisc + manualDisc, 100)

      newItems[index] = {
        ...currentItem,
        discount_auto: autoDisc,
        total_price: (currentItem.quantity * currentItem.unit_price) * (1 - totalDisc / 100)
      }
      return { ...prev, invoiceItems: newItems }
    })
  }

  const openProductsSelect = (index: number) => {
    // Get the currently selected product ID for this row
    const currentItem = localData.invoiceItems[index]
    const currentProductId = currentItem?.product_id || null

    console.log('[DEBUG] Opening selection window. Current Row Index:', index)

    useWindowStore.getState().openPageWindow(
      'products-page-select',
      'Məhsul Seçimi',
      '📦',
      <Products2
        initialSelectedProductId={currentProductId}
        onSelect={(product: Product) => {
          console.log('[DEBUG] Product selected from Anbar. ID:', product.id, 'Name:', product.name)
          handleProductSelectInRow(index, product.id)
          useWindowStore.getState().closePageWindow('products-page-select')
        }}
      />,
      {
        width: Math.min(1000, window.innerWidth - 40),
        height: Math.min(700, window.innerHeight - 100)
      }
    )
  }

  // Köhnə sütun funksiyaları silindi - yeni implementasiya sətir 365-460-da







  // Məhsul bilgilerini al
  const getProductInfo = (productId: number | null) => {
    if (!productId) return { code: '', barcode: '', unit: '' }
    const product = products.find(p => p.id === productId)
    return {
      code: product?.code || '',
      barcode: product?.barcode || '',
      unit: product?.unit || ''
    }
  }

  // Modal açılanda məlumatları yenilə
  // Modal açılanda məlumatları yenilə - Downward Sync
  const isSyncingFromProps = React.useRef(false)

  // Modal açılanda məlumatları yenilə - Downward Sync
  useEffect(() => {
    // Yalnız fərqli olduqda yenilə (Loop-un qarşısını almaq üçün)
    if (JSON.stringify(modal.data) !== JSON.stringify(localData)) {
      console.log('[DEBUG] Downward Sync triggered! This might be erasing your changes!')
      isSyncingFromProps.current = true
      setLocalData(modal.data)
    }


  }, [modal.data])

  // Local data dəyişdikdə parent-ə bildir - Upward Sync
  useEffect(() => {
    if (isSyncingFromProps.current) {
      isSyncingFromProps.current = false
      return
    }

    // Yalnız fərqli olduqda parent-i yenilə
    if (JSON.stringify(localData) !== JSON.stringify(modal.data)) {
      onUpdate(modal.id, { data: localData })
    }
  }, [localData, modal.data, modal.id, onUpdate])

  // Discount Document Logic
  const [supplierDiscountDocuments, setSupplierDiscountDocuments] = useState<DiscountDocument[]>([]) // Supplier Docs (All active)
  const [productDiscountDocuments, setProductDiscountDocuments] = useState<DiscountDocument[]>([]) // Product Docs

  // Fetch active discount document when supplier changes (for Purchase)
  useEffect(() => {
    const fetchDiscount = async () => {
      // Only for Purchase invoices
      if (!isPurchase) {
        setSupplierDiscountDocuments([])
        setProductDiscountDocuments([])
        return
      }

      console.log(`[DiscountEffect] Fetching Documents. SupplierId: ${localData.selectedSupplierId}`)

      try {
        const api = await import('../services/api').then(m => m.discountDocumentsAPI)

        // 1. Fetch Supplier Documents (All Active)
        if (localData.selectedSupplierId) {
          const docs = await api.getAllActive('SUPPLIER', localData.selectedSupplierId)
          console.log('[DiscountEffect] All Supplier Docs:', docs)
          setSupplierDiscountDocuments(docs)
        } else {
          setSupplierDiscountDocuments([])
        }

        // 2. Fetch Global Product Documents
        const prodDocs = await api.getAllActive('PRODUCT')
        console.log('[DiscountEffect] Active Product Docs:', prodDocs.length)
        setProductDiscountDocuments(prodDocs)

      } catch (err) {
        console.error('Failed to fetch discount documents:', err)
        setSupplierDiscountDocuments([])
      }
    }
    fetchDiscount()
  }, [isPurchase, localData.selectedSupplierId])

  // Helper to calculate auto discount based on active document and invoice date
  const calculateAutoDiscount = React.useCallback((productId: number): number => {
    // Parse Invoice Date
    let now = new Date()
    if (localData.invoiceDate) {
      const rawDate = convertDisplayToRaw(localData.invoiceDate)
      const parsed = new Date(rawDate)
      if (!isNaN(parsed.getTime())) {
        now = parsed
      }
    }

    // Get supplier's permanent discount
    const supplier = localData.selectedSupplier || suppliers.find(s => s.id === localData.selectedSupplierId)
    const supplierPermanentDiscount = Number(supplier?.permanent_discount || 0)

    console.log('[DEBUG] calculateAutoDiscount - Supplier:', supplier?.name, 'Permanent Discount:', supplierPermanentDiscount)

    // Determine Active Supplier Document based on this date
    // Sort by start_date desc to prioritize newer documents
    const validSupplierDocs = supplierDiscountDocuments.filter(doc => {
      if (doc.start_date && now < new Date(doc.start_date)) return false
      if (doc.end_date && now > new Date(doc.end_date)) return false
      return true
    }).sort((a, b) => {
      const dA = a.start_date ? new Date(a.start_date).getTime() : 0
      const dB = b.start_date ? new Date(b.start_date).getTime() : 0
      return dB - dA
    })

    const activeSupplierDoc = validSupplierDocs[0] || null

    // 1. Calculate Supplier Document Discount
    let supplierDocDiscount = 0
    if (activeSupplierDoc && activeSupplierDoc.items) {
      const item = activeSupplierDoc.items.find((i: any) => Number(i.product_id) === Number(productId))
      if (item) {
        supplierDocDiscount = Number(item.discount_percent)
      } else {
        const general = activeSupplierDoc.items.find((i: any) => i.product_id === null)
        if (general) {
          supplierDocDiscount = Number(general.discount_percent)
        }
      }
    }
    // 2. Calculate Product Discount (Layered: Newest Valid Overrides Oldest)
    let productDiscount = 0

    // Ensure docs are sorted Newest -> Oldest
    const validProductDocs = productDiscountDocuments.filter(doc => {
      if (!doc.items) return false
      if (doc.start_date && now < new Date(doc.start_date)) return false
      if (doc.end_date && now > new Date(doc.end_date)) return false
      return true
    }).sort((a, b) => {
      const dA = a.start_date ? new Date(a.start_date).getTime() : 0
      const dB = b.start_date ? new Date(b.start_date).getTime() : 0
      return dB - dA
    })

    // Strategy 1: Find Specific Product Match (Newest Wins)
    for (const doc of validProductDocs) {
      const item = doc.items?.find((i: any) => i.product_id === productId)
      if (item) {
        productDiscount = Number(item.discount_percent)
        break
      }
    }

    // Strategy 2: If no specific match found, look for General Match (Newest Wins)
    if (productDiscount === 0) {
      for (const doc of validProductDocs) {
        const general = doc.items?.find((i: any) => i.product_id === null)
        if (general) {
          productDiscount = Number(general.discount_percent)
          break
        }
      }
    }

    const totalDiscount = supplierPermanentDiscount + supplierDocDiscount + productDiscount
    console.log('[DEBUG] Total Discount Breakdown:', {
      supplierPermanent: supplierPermanentDiscount,
      supplierDoc: supplierDocDiscount,
      product: productDiscount,
      total: totalDiscount
    })

    return totalDiscount
  }, [supplierDiscountDocuments, productDiscountDocuments, localData.invoiceDate, localData.selectedSupplier, localData.selectedSupplierId, suppliers])

  // Recalculate discounts when date changes
  const initialDateRef = React.useRef<string | null>(null)

  // Set initial date ref
  useEffect(() => {
    if (modal.data.invoiceDate && !initialDateRef.current) {
      initialDateRef.current = modal.data.invoiceDate
    }
  }, []) // On mount

  useEffect(() => {
    // Skip if empty or invalid
    if (!localData.invoiceItems.length) return
    if (!localData.invoiceDate || localData.invoiceDate.length < 10) return

    // Compare with initial date
    // If same as initial (and initial exists), it means we are just loading, so NO recalc.
    if (initialDateRef.current && localData.invoiceDate === initialDateRef.current) {
      return
    }

    console.log('[DiscountRecalc] Date changed. Recalculating auto discounts based on new date:', localData.invoiceDate)

    setLocalData(prev => {
      const newItems = prev.invoiceItems.map(item => {
        if (!item.product_id) return item

        let autoDisc = 0
        if (isPurchase) {
          autoDisc = calculateAutoDiscount(item.product_id)
        } else {
          return item // Skip sales for now
        }

        // Only update if autoDisc changed
        if (item.discount_auto === autoDisc) return item

        const manualDisc = item.discount_manual || 0
        const totalDisc = Math.min(autoDisc + manualDisc, 100)

        return {
          ...item,
          discount_auto: autoDisc,
          total_price: (item.quantity * item.unit_price) * (1 - totalDisc / 100)
        }
      })

      return {
        ...prev,
        invoiceItems: newItems
      }
    })

  }, [localData.invoiceDate, calculateAutoDiscount, isPurchase])

  // Recalculate discounts when Customer changes (Sales only)
  useEffect(() => {
    if (isPurchase) return
    if (!localData.invoiceItems || localData.invoiceItems.length === 0) {
      console.log('[DiscountCalc] No items to calculate discounts for')
      return
    }

    const recalculateSalesDiscounts = async () => {
      const customer = localData.selectedCustomer || customers.find(c => c.id === localData.selectedCustomerId)
      const customerDiscount = Number(customer?.permanent_discount || 0)

      console.log('[DiscountCalc] Customer changed. Customer:', customer?.name, 'Discount:', customerDiscount, 'Items:', localData.invoiceItems.length)

      const updatedItems = await Promise.all(localData.invoiceItems.map(async (item) => {
        if (!item.product_id) return item

        let productDiscount = 0
        try {
          const discounts = await productDiscountsAPI.getAll(item.product_id)
          const now = new Date()
          const activeDiscount = discounts.find((d: any) => {
            const start = new Date(d.start_date)
            const end = new Date(d.end_date)
            return now >= start && now <= end
          })
          if (activeDiscount) {
            productDiscount = Number(activeDiscount.percentage)
          }
        } catch (e) {
          console.error('Failed to load product discounts', e)
        }

        const autoDisc = customerDiscount + productDiscount

        console.log(`[DiscountCalc] Product: ${item.product_name}, Customer Disc: ${customerDiscount}%, Product Disc: ${productDiscount}%, Total Auto: ${autoDisc}%`)

        // Only update if changed
        if (item.discount_auto === autoDisc) return item

        const startPrice = item.unit_price || 0
        const qty = item.quantity || 0
        const manualDisc = item.discount_manual || 0
        const totalDisc = Math.min(autoDisc + manualDisc, 100)

        return {
          ...item,
          discount_auto: autoDisc,
          total_price: (qty * startPrice) * (1 - totalDisc / 100)
        }
      }))

      // Check if any item actually changed
      const hasChanges = updatedItems.some((item, index) => {
        const oldItem = localData.invoiceItems[index]
        return item.discount_auto !== oldItem.discount_auto || item.total_price !== oldItem.total_price
      })

      if (hasChanges) {
        console.log('[DiscountCalc] Updating items with new discounts')
        setLocalData(prev => ({ ...prev, invoiceItems: updatedItems }))
      } else {
        console.log('[DiscountCalc] No changes detected, skipping update')
      }
    }

    recalculateSalesDiscounts()
  }, [localData.selectedCustomerId, localData.invoiceItems.length, isPurchase, customers])

  // handleResizeStart artıq sətir 370-380-da implement edilib



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
    setResizeStart({
      x: e.clientX,
      y: e.clientY
    })
    setResizeStartSize({ width: currentSize.width, height: currentSize.height })
    setLocalSize(null) // Reset local size
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
        // Sadece görsel güncelleme - local state kullan
        setLocalSize({ width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      if (isResizing && localSize) {
        // Mouse bırakıldığında gerçek state'i güncelle
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

  const handleMaximize = () => {
    if (!modal.isMaximized) {
      // Navbar və taskbar yüksəklikləri
      // Navbar'ın gerçek yüksekliğini DOM'dan al
      const navbar = document.querySelector('nav')
      const navbarHeight = navbar ? navbar.offsetHeight : 60
      const taskbarHeight = 25 // Taskbar yüksəkliyi
      const availableHeight = window.innerHeight - navbarHeight - taskbarHeight

      onUpdate(modal.id, {
        isMaximized: true,
        position: { x: 0, y: navbarHeight },
        size: { width: window.innerWidth, height: availableHeight }
      })
    } else {
      const savedSize = localStorage.getItem('satis-qaime-modal-size')
      const defaultSize = savedSize ? JSON.parse(savedSize) : { width: 900, height: 600 }
      onUpdate(modal.id, {
        isMaximized: false,
        size: defaultSize,
        position: {
          x: (window.innerWidth - defaultSize.width) / 2,
          y: (window.innerHeight - defaultSize.height) / 2
        }
      })
    }
  }

  // Yadda Saxla düyməsi funksiyası - yadda saxla, amma təsdiqləmə və modal açıq qalır
  const handleSave = async () => {
    console.log('[InvoiceModal] ========== handleSave FUNKSİYASI ÇAĞIRILDI ==========')
    console.log('[InvoiceModal] handleSave çağırıldı', {
      modalId: modal.id,
      modalInvoiceId: modal.invoiceId,
      localData,
      modalObject: modal
    })
    console.log('[InvoiceModal] onSave prop-u mövcuddur:', !!onSave)
    console.log('[InvoiceModal] onSave prop-u tipi:', typeof onSave)
    console.log('[InvoiceModal] onSave prop-u funksiyadır:', typeof onSave === 'function')

    if (!onSave) {
      console.error('[InvoiceModal] XƏTA: onSave prop-u mövcud deyil!')
      return
    }

    if (typeof onSave !== 'function') {
      console.error('[InvoiceModal] XƏTA: onSave prop-u funksiya deyil!', { type: typeof onSave, value: onSave })
      return
    }

    try {
      console.log('[InvoiceModal] onSave çağırılır...', {
        modalId: modal.id,
        localDataKeys: Object.keys(localData),
        invoiceItemsCount: localData.invoiceItems?.length || 0,
        invoiceItems: localData.invoiceItems,
        validItems: localData.invoiceItems?.filter(item => item.product_id !== null) || []
      })
      await onSave(modal.id, localData)
      console.log('[InvoiceModal] onSave uğurla tamamlandı')
      // Uğurlu saxlanıldıqdan sonra modal açıq qalır (istifadəçi davam edə bilər)
    } catch (error) {
      // Xəta baş verərsə, modal açıq qalır (xəta mesajı onSave içində göstərilir)
      console.error('[InvoiceModal] Qaimə yadda saxlanılarkən xəta:', error)
      console.error('[InvoiceModal] Xəta detalları:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      })
    }
  }

  // OK düyməsi funksiyası - yadda saxla, təsdiqlə və bağla
  const handleOK = async () => {
    console.log('[InvoiceModal] ========== handleOK FUNKSİYASI ÇAĞIRILDI ==========')
    console.log('[InvoiceModal] handleOK çağırıldı', {
      modalId: modal.id,
      modalInvoiceId: modal.invoiceId,
      localData,
      hasOnSaveAndConfirm: !!onSaveAndConfirm,
      modalObject: modal
    })
    console.log('[InvoiceModal] onSave prop-u mövcuddur:', !!onSave)
    console.log('[InvoiceModal] onSave prop-u tipi:', typeof onSave)
    console.log('[InvoiceModal] onSave prop-u funksiyadır:', typeof onSave === 'function')
    console.log('[InvoiceModal] onSaveAndConfirm prop-u mövcuddur:', !!onSaveAndConfirm)
    console.log('[InvoiceModal] onSaveAndConfirm prop-u tipi:', typeof onSaveAndConfirm)
    console.log('[InvoiceModal] onSaveAndConfirm prop-u funksiyadır:', typeof onSaveAndConfirm === 'function')

    // OK düyməsi üçün validasiya - təchizatçı və məhsul seçilməlidir
    if (isPurchase) {
      // Alış qaiməsi üçün təchizatçı seçilməlidir
      if (!localData.selectedSupplierId) {
        alert('Təchizatçı seçilməlidir')
        return
      }
    } else {
      // Satış qaiməsi üçün müştəri seçilməlidir
      if (!localData.selectedCustomerId) {
        alert('Müştəri seçilməlidir')
        return
      }
    }

    // Ən azı bir məhsul seçilməlidir
    const validItems = localData.invoiceItems.filter(item => item.product_id !== null)
    if (validItems.length === 0) {
      alert('Məhsul seçilməyib')
      return
    }

    try {
      if (onSaveAndConfirm) {
        // OK düyməsi - yadda saxla və təsdiqlə
        console.log('[InvoiceModal] onSaveAndConfirm çağırılır...', {
          modalId: modal.id,
          localDataKeys: Object.keys(localData),
          invoiceItemsCount: localData.invoiceItems?.length || 0,
          invoiceItems: localData.invoiceItems,
          validItems: localData.invoiceItems?.filter(item => item.product_id !== null) || []
        })
        await onSaveAndConfirm(modal.id, localData)
        console.log('[InvoiceModal] onSaveAndConfirm uğurla tamamlandı')
      } else {
        // Əgər onSaveAndConfirm yoxdursa, sadəcə yadda saxla
        if (!onSave) {
          console.error('[InvoiceModal] XƏTA: onSave prop-u mövcud deyil!')
          return
        }
        console.log('[InvoiceModal] onSave çağırılır (onSaveAndConfirm yoxdur)...', { modalId: modal.id, localDataKeys: Object.keys(localData) })
        await onSave(modal.id, localData)
        console.log('[InvoiceModal] onSave uğurla tamamlandı')
      }
      // Uğurla yadda saxlanıldıqdan sonra modalı bağla
      console.log('[InvoiceModal] Modal bağlanır...', { modalId: modal.id })
      onClose(modal.id)
      console.log('[InvoiceModal] Modal bağlandı')
    } catch (error) {
      // Xəta baş verərsə, modal açıq qalır (xəta mesajı onSave içində göstərilir)
      console.error('[InvoiceModal] Qaimə yadda saxlanılarkən xəta:', error)
      console.error('[InvoiceModal] Xəta detalları:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      })
    }
  }

  // Prop validation - onSave və onSaveAndConfirm prop-larının mövcudluğunu yoxla


  // OK düyməsi üçün disabled vəziyyəti - təchizatçı və məhsul seçilməlidir
  const isOKDisabled = useMemo(() => {
    if (isPurchase) {
      // Alış qaiməsi üçün təchizatçı seçilməlidir
      if (!localData.selectedSupplierId) {
        return true
      }
    } else {
      // Satış qaiməsi üçün müştəri seçilməlidir
      if (!localData.selectedCustomerId) {
        return true
      }
    }

    // Ən azı bir məhsul seçilməlidir
    const validItems = localData.invoiceItems.filter(item => item.product_id !== null)
    if (validItems.length === 0) {
      return true
    }

    return false
  }, [localData, isPurchase])

  // Modal içində qısa yollar
  useEffect(() => {
    if (!isVisible || isMinimized || !isActive) {
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {

      // ESC: Modalı bağla (hər yerdə işləsin, ən əvvəl yoxla)
      // ESC key-in müxtəlif formatlarını yoxla
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27 || e.code === 'Escape') {
        console.log('[InvoiceModal] ESC detected - closing modal:', modal.id)
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        console.log('[InvoiceModal] Calling onClose with modal.id:', modal.id)
        onClose(modal.id)
        console.log('[InvoiceModal] onClose called')
        return
      }

      // Input və textarea elementlərində qısa yolları deaktiv et (Ctrl+S, Ctrl+P istisna)
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Ctrl+S: Yadda Saxla (hər yerdə işləsin)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        onSave(modal.id, localData)
        return
      }

      // Ctrl+P: Çap et (hər yerdə işləsin, əgər onPrint varsa)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        if (onPrint) {
          onPrint(modal.id, localData)
        }
        return
      }



      // Input içində digər qısa yollar işləməsin
      if (isInput) {
        return
      }

      // Insert: Yeni sətir əlavə et
      if (e.key === 'Insert') {
        e.preventDefault()
        handleAddEmptyRow()
        return
      }

      // Delete: Seçilmiş sətirləri sil
      if (e.key === 'Delete') {
        e.preventDefault()
        if (selectedItemIndices.length > 0) {
          const sortedIndices = [...selectedItemIndices].sort((a, b) => b - a)
          const newItems = [...localData.invoiceItems]
          sortedIndices.forEach(index => {
            newItems.splice(index, 1)
          })
          setLocalData({ ...localData, invoiceItems: newItems })
          setSelectedItemIndices([])
        }
        return
      }

      // F9: Seçilmiş sətirləri kopyala
      if (e.key === 'F9') {
        e.preventDefault()
        if (selectedItemIndices.length > 0) {
          const sortedIndices = [...selectedItemIndices].sort((a, b) => a - b)
          const newItems = [...localData.invoiceItems]
          const copiedItems = sortedIndices.map(index => ({ ...newItems[index] }))
          setLocalData({ ...localData, invoiceItems: [...newItems, ...copiedItems] })
        }
        return
      }
    }

    // Capture fazasında da dinlə (başqa listener-lardan əvvəl işləsin)
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isVisible, isMinimized, modal.id, onClose, onSave, onPrint, localData, selectedItemIndices, handleAddEmptyRow, isPurchase, isActive])

  // Minimize olunmuşsa göstərmə
  if (isMinimized || !isVisible) {
    return null
  }

  // Modal z-index navbar (1000) və taskbar (10000) arasında olmalı
  const modalZIndex = Math.min(Math.max(modal.zIndex, 1001), 9999)



  // State for tabs in embedded mode


  // Embedded mode (Universal Window) render
  if (isEmbedded) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '5px 5px 1px 5px',
          position: 'relative',
          // border: '4px solid red' // DEBUG BORDER
        }}
      >
        {activeConfirmDialog && (
          <ConfirmDialog {...activeConfirmDialog} />
        )}
        {/* Header Form - Compact Layout */}
        {/* Header Form - Split Layout */}
        <div style={{
          display: 'flex',
          gap: '0',
          alignItems: 'stretch',
          padding: '0 2px',
          // border: '4px solid blue' // DEBUG BORDER
        }}>
          {/* Section 1: Təchizatçı & Anbar */}
          <div style={{
            flex: '1.5',
            paddingRight: '15px',
            borderRight: '1px solid #dee2e6',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* 1. Təchizatçı OR Müştəri */}
            {isPurchase ? (
              <PartnerSelect
                partners={suppliers}
                value={localData.selectedSupplier || null}
                onChange={(supplier) => {
                  setLocalData(prev => ({
                    ...prev,
                    selectedSupplierId: supplier?.id || null,
                    selectedSupplier: supplier as Supplier | null
                  }))
                }}
                placeholder="Seçin..."
                filterType="SUPPLIER"
                label="Təchizatçı:"
              />
            ) : (
              <PartnerSelect
                partners={customers}
                value={localData.selectedCustomer || null}
                onChange={(customer) => {
                  setLocalData(prev => ({
                    ...prev,
                    selectedCustomerId: customer?.id || null,
                    selectedCustomer: customer as Customer | null
                  }))
                }}
                placeholder="Seçin..."
                filterType="BUYER"
                label="Müştəri:"
              />
            )}

            {/* 4. Anbar */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '90px', fontWeight: '500', fontSize: '0.9rem', color: '#495057', flexShrink: 0 }}>
                Anbar:
              </label>
              <select
                value={selectedWarehouseId || ''}
                onChange={(e) => setSelectedWarehouseId(Number(e.target.value) || null)}
                style={{
                  flex: 1,
                  padding: '2px 8px',
                  border: '1px solid #e0e0e0',
                  outline: 'none',
                  boxShadow: 'none',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  height: '24px',
                  background: 'white',
                  minWidth: 0
                }}
              >
                <option value="">Seçin...</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Qaimə № & Son Öd. */}
          <div style={{
            flex: '1',
            paddingLeft: '15px',
            paddingRight: '15px',
            borderRight: '1px solid #dee2e6',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* 2. Qaimə № */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '80px', fontWeight: '500', fontSize: '0.9rem', color: '#495057', flexShrink: 0 }}>
                Qaimə №:
              </label>
              <input
                type="text"
                placeholder="Avtomatik"
                value={localData.invoiceNumber || ''}
                readOnly
                style={{
                  flex: 1,
                  padding: '2px 8px',
                  border: '1px solid #e0e0e0',
                  outline: 'none',
                  boxShadow: 'none',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  height: '24px',
                  background: '#f8f9fa',
                  color: '#6c757d',
                  minWidth: 0
                }}
              />
            </div>

            {/* 5. Son Ödəniş Tarixi */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '80px', fontWeight: '500', fontSize: '0.9rem', color: '#495057', flexShrink: 0, whiteSpace: 'nowrap' }}>
                Son Öd.:
              </label>
              <div style={{ flex: 1, position: 'relative' }}>
                <SmartDateInput
                  value={localData.paymentDate || new Date().toISOString()}
                  onDateChange={(isoDate) => setLocalData({ ...localData, paymentDate: isoDate })}
                  style={{
                    width: '100%',
                    padding: '2px 8px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    height: '24px',
                    background: 'white',
                    color: '#495057'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Tarix */}
          <div style={{
            flex: '1.2',
            paddingLeft: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* 3. Tarix */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ width: '60px', fontWeight: '500', fontSize: '0.9rem', color: '#495057', flexShrink: 0 }}>
                Tarix:
              </label>
              <div style={{ flex: 1, position: 'relative' }}>
                <SmartDateInput
                  value={localData.invoiceDate || new Date().toISOString()}
                  onDateChange={(isoDate) => setLocalData({ ...localData, invoiceDate: isoDate })}
                  style={{
                    width: '100%',
                    padding: '2px 28px 2px 8px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    height: '24px',
                    color: '#495057'
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowInvoiceDatePicker(!showInvoiceDatePicker) }}
                  style={{
                    position: 'absolute',
                    right: '4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#6c757d',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '24px'
                  }}
                  title="Kalendar"
                >
                  📅
                </button>
                {showInvoiceDatePicker && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '2px',
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '5px',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }} onMouseDown={e => e.preventDefault()}>
                    <input
                      type="date"
                      value={localData.invoiceDate ? localData.invoiceDate.split(' ')[0] : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          const time = localData.invoiceDate?.split(' ')[1] || '00:00:00';
                          setLocalData({ ...localData, invoiceDate: `${e.target.value} ${time}` });
                        }
                        setShowInvoiceDatePicker(false)
                      }}
                      style={{ border: '1px solid #ddd', borderRadius: '3px', padding: '2px' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2px', marginBottom: '0', borderBottom: '1px solid #e0e0e0', /* border: '4px solid purple' */ }}>
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


            {/* Main Table */}
            <div style={{ flex: 1, border: '1px solid #ddd', /* border: '4px solid green', */ borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Table Content - Re-using the logic from below but flattened */}
              {/* Since moving existing table content here is complex due to size, 
                   I will render a simplified wrapper that uses the existing table logic 
                   or just replicate the required parts. 
                   Ideally, I'd extract table to a sub-component, but for this refactor 
                   I will keep inline structure. */}

              {/* Warning: The bulk of the table rendering logic was in the returned JSX below. 
                   I am effectively replacing the entire return block for isEmbedded.
                   I need to make sure I include the table rendering here.
               */}
              {/* Toolbar */}
              <div style={{ background: '#f8f9fa', padding: '0.5rem', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  {/* Add icon */}
                  <button
                    onClick={handleAddEmptyRow}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e9ecef'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                    style={{
                      padding: '0.5rem',
                      background: 'transparent',
                      color: '#28a745',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      transition: 'background-color 0.2s ease'
                    }}
                    title="Əlavə et (Insert)"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Delete icon */}
                  <button
                    onClick={() => {
                      const sortedIndices = [...selectedItemIndices].sort((a, b) => b - a)
                      const newItems = [...localData.invoiceItems]
                      sortedIndices.forEach(index => {
                        newItems.splice(index, 1)
                      })
                      setLocalData({ ...localData, invoiceItems: newItems })
                      setSelectedItemIndices([])
                    }}
                    disabled={selectedItemIndices.length === 0}
                    onMouseEnter={(e) => {
                      if (selectedItemIndices.length > 0) {
                        e.currentTarget.style.background = '#e9ecef'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = selectedItemIndices.length === 0 ? '#e9ecef' : 'transparent'
                    }}
                    style={{
                      padding: '0.5rem',
                      background: selectedItemIndices.length === 0 ? '#e9ecef' : 'transparent',
                      color: selectedItemIndices.length === 0 ? '#adb5bd' : '#dc3545',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedItemIndices.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      transition: 'background-color 0.2s ease'
                    }}
                    title="Sil (Delete)"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 4H13M6 4V3C6 2.44772 6.44772 2 7 2H9C9.55228 2 10 2.44772 10 3V4M6 7.5V11.5M10 7.5V11.5M4 4L4.5 13C4.5 13.5523 4.94772 14 5.5 14H10.5C11.0523 14 11.5 13.5523 11.5 13L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Copy icon */}
                  <button
                    onClick={() => {
                      if (selectedItemIndices.length > 0) {
                        const sortedIndices = [...selectedItemIndices].sort((a, b) => a - b)
                        const newItems = [...localData.invoiceItems]
                        const copiedItems = sortedIndices.map(index => ({ ...newItems[index] }))
                        setLocalData({ ...localData, invoiceItems: [...newItems, ...copiedItems] })
                      }
                    }}
                    disabled={selectedItemIndices.length === 0}
                    onMouseEnter={(e) => {
                      if (selectedItemIndices.length > 0) {
                        e.currentTarget.style.background = '#e9ecef'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = selectedItemIndices.length === 0 ? '#e9ecef' : 'transparent'
                    }}
                    style={{
                      padding: '0.5rem',
                      background: selectedItemIndices.length === 0 ? '#e9ecef' : 'transparent',
                      color: selectedItemIndices.length === 0 ? '#adb5bd' : '#495057',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedItemIndices.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      transition: 'background-color 0.2s ease'
                    }}
                    title="Kopyala (F9)"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 2C4 0.895431 4.89543 0 6 0H10C11.1046 0 12 0.895431 12 2V6C12 7.10457 11.1046 8 10 8H6C4.89543 8 4 7.10457 4 6V2Z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M4 6H2C0.895431 6 0 6.89543 0 8V12C0 13.1046 0.895431 14 2 14H6C7.10457 14 8 13.1046 8 12V10" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>

                  {/* Move up icon */}
                  <button
                    onClick={() => {
                      if (selectedItemIndices.length === 1) {
                        const index = selectedItemIndices[0]
                        if (index > 0) {
                          const newItems = [...localData.invoiceItems]
                          const temp = newItems[index]
                          newItems[index] = newItems[index - 1]
                          newItems[index - 1] = temp
                          setLocalData({ ...localData, invoiceItems: newItems })
                          setSelectedItemIndices([index - 1])
                        }
                      }
                    }}
                    disabled={selectedItemIndices.length !== 1 || selectedItemIndices[0] === 0}
                    onMouseEnter={(e) => {
                      if (selectedItemIndices.length === 1 && selectedItemIndices[0] > 0) {
                        e.currentTarget.style.background = '#e9ecef'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = (selectedItemIndices.length !== 1 || selectedItemIndices[0] === 0) ? '#e9ecef' : 'transparent'
                    }}
                    style={{
                      padding: '0.5rem',
                      background: (selectedItemIndices.length !== 1 || selectedItemIndices[0] === 0) ? '#e9ecef' : 'transparent',
                      color: (selectedItemIndices.length !== 1 || selectedItemIndices[0] === 0) ? '#adb5bd' : '#495057',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: (selectedItemIndices.length !== 1 || selectedItemIndices[0] === 0) ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      transition: 'background-color 0.2s ease'
                    }}
                    title="Yuxarı"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Move down icon */}
                  <button
                    onClick={() => {
                      if (selectedItemIndices.length === 1) {
                        const index = selectedItemIndices[0]
                        if (index < localData.invoiceItems.length - 1) {
                          const newItems = [...localData.invoiceItems]
                          const temp = newItems[index]
                          newItems[index] = newItems[index + 1]
                          newItems[index + 1] = temp
                          setLocalData({ ...localData, invoiceItems: newItems })
                          setSelectedItemIndices([index + 1])
                        }
                      }
                    }}
                    disabled={selectedItemIndices.length !== 1 || selectedItemIndices[0] === localData.invoiceItems.length - 1}
                    onMouseEnter={(e) => {
                      if (selectedItemIndices.length === 1 && selectedItemIndices[0] < localData.invoiceItems.length - 1) {
                        e.currentTarget.style.background = '#e9ecef'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = (selectedItemIndices.length !== 1 || selectedItemIndices[0] === localData.invoiceItems.length - 1) ? '#e9ecef' : 'transparent'
                    }}
                    style={{
                      padding: '0.5rem',
                      background: (selectedItemIndices.length !== 1 || selectedItemIndices[0] === localData.invoiceItems.length - 1) ? '#e9ecef' : 'transparent',
                      color: (selectedItemIndices.length !== 1 || selectedItemIndices[0] === localData.invoiceItems.length - 1) ? '#adb5bd' : '#495057',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: (selectedItemIndices.length !== 1 || selectedItemIndices[0] === localData.invoiceItems.length - 1) ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      transition: 'background-color 0.2s ease'
                    }}
                    title="Aşağı"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 4V12M8 12L4 8M8 12L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Barcode icon */}
                  <button
                    onClick={() => {
                      // Barkod funksiyası
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e9ecef'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                    style={{
                      padding: '0.5rem',
                      background: 'transparent',
                      color: '#495057',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      transition: 'background-color 0.2s ease'
                    }}
                    title="Barkod"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 4H2M1 8H2M1 12H2M4 4H5M4 8H5M4 12H5M7 4H8M7 8H8M7 12H8M10 4H11M10 8H11M10 12H11M13 4H14M13 8H14M13 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Folder icon */}
                  <button
                    onClick={() => {
                      // Papka funksiyası
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e9ecef'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                    style={{
                      padding: '0.5rem',
                      background: 'transparent',
                      color: '#495057',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      transition: 'background-color 0.2s ease'
                    }}
                    title="Papka"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 3C2 2.44772 2.44772 2 3 2H6.58579C6.851 2 7.10536 2.10536 7.29289 2.29289L8.70711 3.70711C8.89464 3.89464 9.149 4 9.41421 4H13C13.5523 4 14 4.44772 14 5V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3Z" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>

                  {/* Settings icon */}
                  <button
                    onClick={() => {
                      openTableSettings()
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e9ecef'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                    style={{
                      padding: '0.5rem',
                      background: 'transparent',
                      color: '#495057',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      transition: 'background-color 0.2s ease'
                    }}
                    title="Ayarlar"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M12.5 8C12.5 7.5 12.7 7 12.9 6.6L13.8 5.1C14 4.7 13.9 4.2 13.5 3.9L12.1 2.9C11.7 2.6 11.2 2.6 10.8 2.9L9.8 3.5C9.4 3.3 9 3.1 8.5 3.1H7.5C7 3.1 6.6 3.3 6.2 3.5L5.2 2.9C4.8 2.6 4.3 2.6 3.9 2.9L2.5 3.9C2.1 4.2 2 4.7 2.2 5.1L3.1 6.6C3.3 7 3.1 7.5 3.1 8C3.1 8.5 3.3 9 3.1 9.4L2.2 10.9C2 11.3 2.1 11.8 2.5 12.1L3.9 13.1C4.3 13.4 4.8 13.4 5.2 13.1L6.2 12.5C6.6 12.7 7 12.9 7.5 12.9H8.5C9 12.9 9.4 12.7 9.8 12.5L10.8 13.1C11.2 13.4 11.7 13.4 12.1 13.1L13.5 12.1C13.9 11.8 14 11.3 13.8 10.9L12.9 9.4C12.7 9 12.5 8.5 12.5 8Z" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>

                  {/* Inactive document icon - bright when not active, dim when active */}
                  {modal.invoiceId && (
                    <button
                      onClick={async () => {
                        if (modal.invoiceId && modal.isActive) {
                          try {
                            await purchaseInvoicesAPI.updateStatus(modal.invoiceId.toString(), false)
                            onUpdate(modal.id, { isActive: false })
                            alert('Qaimə ləğv edildi')
                          } catch (err: any) {
                            alert(err.response?.data?.message || 'Xəta baş verdi')
                          }
                        }
                      }}
                      disabled={!modal.isActive}
                      onMouseEnter={(e) => {
                        if (modal.isActive) {
                          e.currentTarget.style.background = '#f8d7da'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                      style={{
                        padding: '0.5rem',
                        background: 'transparent',
                        color: '#6c757d',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: modal.isActive ? 'pointer' : 'default',
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        transition: 'background-color 0.2s ease',
                        opacity: modal.isActive ? 0.5 : 1
                      }}
                      title={modal.isActive ? "Təsdiqlənmiş (ləğv etmək üçün klik edin)" : "Təsdiqlənməmiş"}
                    >
                      📄
                    </button>
                  )}

                  {/* Active document icon - bright when active, dim when not active */}
                  {modal.invoiceId && (
                    <button
                      onClick={async () => {
                        if (modal.invoiceId && !modal.isActive) {
                          try {
                            await purchaseInvoicesAPI.updateStatus(modal.invoiceId.toString(), true)
                            onUpdate(modal.id, { isActive: true })
                            alert('Qaimə təsdiq edildi')
                          } catch (err: any) {
                            alert(err.response?.data?.message || 'Xəta baş verdi')
                          }
                        }
                      }}
                      disabled={modal.isActive}
                      onMouseEnter={(e) => {
                        if (!modal.isActive) {
                          e.currentTarget.style.background = '#d4edda'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                      style={{
                        padding: '0.5rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: !modal.isActive ? 'pointer' : 'default',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        transition: 'background-color 0.2s ease',
                        opacity: modal.isActive ? 1 : 0.5,
                        position: 'relative'
                      }}
                      title={modal.isActive ? "Təsdiqlənmiş" : "Təsdiq et (klik edin)"}
                    >
                      <span style={{ position: 'relative', display: 'inline-block', fontSize: '1.2rem' }}>
                        📄
                        <span style={{
                          position: 'absolute',
                          top: '-2px',
                          right: '-2px',
                          color: '#28a745',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          width: '14px',
                          height: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: '1'
                        }}>✓</span>
                      </span>
                    </button>
                  )}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Məhsullar ({localData.invoiceItems.length})</div>
              </div>
              <InvoiceTable
                items={localData.invoiceItems}
                columns={tableColumns}
                onColumnsChange={setTableColumns}
                selectedItemIndices={selectedItemIndices}
                onRowSelect={setSelectedItemIndices}
                functionSettings={functionSettings}
                onUpdateItem={handleTableUpdateItem}
                onProductSelect={(idx, prod) => handleProductSelectInRow(idx, prod.id)}
                onOpenProductSelect={openProductsSelect}
                onOpenProductDetails={handleOpenProductDetails}

                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}

                getProductInfo={getProductInfo}
                getFilteredProductsForRow={getFilteredProductsForRow}
                isPurchase={isPurchase}
              />
              {/* Fixed Total Row */}
              <div style={{ padding: '7px 16px', borderTop: '1px solid #dee2e6', background: '#f8f9fa', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#495057' }}>
                    {localData.invoiceItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                  </span>

                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.95rem' }}>EDV:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#495057' }}>
                    {localData.invoiceItems.reduce((sum, item) => sum + (item.total_price * (item.vat_rate || 0) / 100), 0).toFixed(2)} ₼
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontWeight: '600', color: '#495057', fontSize: '1.05rem' }}>Cəmi:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#212529' }}>
                    {localData.invoiceItems.reduce((sum, item) => sum + (item.total_price || 0), 0).toFixed(2)} ₼
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '1.5rem' }}>
            {/* Functions Tab Content */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '1.5rem',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>Əlavə Funksiyalar</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                <button
                  onClick={openTableSettings}
                  style={{
                    padding: '1rem',
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>⚙️</span>
                  <span>Cədvəl Ayarları</span>
                </button>
                <button
                  onClick={() => onPrint && onPrint(modal.id, localData)}
                  style={{
                    padding: '1rem',
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>🖨️</span>
                  <span>Çap Et</span>
                </button>
              </div>
            </div>
          </div>
        )
        }
        {/* Footer */}
        <div style={{ padding: '5px 10px', marginBottom: '1px', borderTop: '1px solid #dee2e6', /* border: '4px solid orange', */ background: '#f8f9fa', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Notes */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <textarea
              value={localData.notes}
              onChange={(e) => setLocalData({ ...localData, notes: e.target.value })}
              onFocus={() => setNotesFocused(true)}
              onBlur={() => {
                if (!localData.notes) setNotesFocused(false)
              }}
              placeholder="Qeydlər..."
              style={{
                width: '100%',
                padding: '5px 8px', // Reduced vertical padding
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '0.875rem',
                resize: 'none',
                height: '35px',
                fontFamily: 'inherit',
                overflow: 'hidden',
                margin: 0,
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => onClose(modal.id)}
              style={{
                padding: '0 16px',
                height: '35px', // Match textarea
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                margin: 0,
                boxSizing: 'border-box'
              }}
            >
              Bağla
            </button>
            <button
              onClick={(e) => {
                console.log('[InvoiceModal] Yadda Saxla düyməsi klik olundu (embedded)', {
                  event: e,
                  handleSaveType: typeof handleSave,
                  handleSaveUndefined: handleSave === undefined,
                  modalId: modal.id
                })
                if (handleSave) {
                  handleSave()
                } else {
                  console.error('[InvoiceModal] handleSave funksiyası undefined-dır!')
                }
              }}
              style={{
                padding: '0 16px',
                height: '35px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                margin: 0,
                boxSizing: 'border-box'
              }}
              title="Yadda Saxla (Ctrl+S)"
            >
              Yadda Saxla
            </button>
            <button
              onClick={(e) => {
                console.log('[InvoiceModal] OK düyməsi klik olundu (embedded)', {
                  event: e,
                  handleOKType: typeof handleOK,
                  handleOKUndefined: handleOK === undefined,
                  modalId: modal.id,
                  isOKDisabled
                })
                if (isOKDisabled) {
                  return
                }
                if (handleOK) {
                  handleOK()
                } else {
                  console.error('[InvoiceModal] handleOK funksiyası undefined-dır!')
                }
              }}
              disabled={isOKDisabled}
              style={{
                padding: '0 16px',
                height: '35px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isOKDisabled ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isOKDisabled ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: isOKDisabled ? 0.6 : 1,
                margin: 0,
                boxSizing: 'border-box'
              }}
              title={isOKDisabled ? (isPurchase ? 'Təchizatçı və məhsul seçilməlidir' : 'Müştəri və məhsul seçilməlidir') : 'Yadda saxla və təsdiqlə'}
            >
              OK
            </button>
            <button
              onClick={() => onPrint && onPrint(modal.id, localData)}
              disabled={!onPrint}
              style={{
                padding: '0 16px',
                height: '35px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: onPrint ? '#6f42c1' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: onPrint ? 'pointer' : 'not-allowed',
                fontWeight: '500',
                opacity: onPrint ? 1 : 0.6,
                margin: 0,
                boxSizing: 'border-box'
              }}
              title={onPrint ? "Çap et (Ctrl+P)" : "Çap funksiyası mövcud deyil"}
            >
              Çap
            </button>
          </div>
        </div>
      </div >
    )
  }

  return (
    <div
      style={{
        position: isEmbedded ? 'relative' : 'fixed',
        top: isEmbedded ? 0 : `${navbarHeight}px`, // Navbar altından başla
        left: 0,
        right: 0,
        bottom: isEmbedded ? 0 : `${taskbarHeight}px`, // Taskbar üstündə bitir
        background: isEmbedded ? 'transparent' : 'rgba(0, 0, 0, 0.3)',
        zIndex: isEmbedded ? 'auto' : modalZIndex,
        pointerEvents: 'auto', // Overlay-ə klikləmək üçün
        height: isEmbedded ? '100%' : 'auto',
        width: isEmbedded ? '100%' : 'auto',
      }}
      onClick={(e) => {
        // Yalnız overlay-ə klikləndikdə (pəncərənin özünə deyil)
        if (e.target === e.currentTarget) {
          if (!isActive) {
            onActivate?.(modal.id)
          }
        }
      }}
    >
      <div
        style={{
          position: isEmbedded ? 'relative' : 'absolute',
          left: isEmbedded ? 0 : `${effectivePosition.x}px`,
          top: isEmbedded ? 0 : `${effectivePosition.y}px`,
          width: isEmbedded ? '100%' : `${effectiveSize.width}px`,
          height: isEmbedded ? '100%' : `${effectiveSize.height}px`,
          background: 'white',
          borderRadius: (modal.isMaximized || isEmbedded) ? '0' : '8px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isEmbedded ? 'none' : '0 4px 20px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          pointerEvents: 'auto',
          // border: '4px solid red' // DEBUG BORDER
        }}
        data-modal-container
        onClick={(e) => {
          e.stopPropagation()
          // Yalnız aktiv deyilsə aktivləşdir
          if (!isActive) {
            onActivate?.(modal.id)
          }
        }}
      >
        {/* Modal başlığı */}
        {!isEmbedded && (
          <div
            className="modal-header"
            onMouseDown={handleMouseDown}
            style={{
              padding: '0.75rem 1rem',
              borderBottom: 'none',
              cursor: isDragging ? 'grabbing' : 'grab',
              background: '#007bff',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              userSelect: 'none',
              flexShrink: 0,
              border: '4px solid blue' // DEBUG BORDER
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '500', flex: 1, color: 'white' }}>
              {modal.invoiceId
                ? `Qaimə #${modal.invoiceId}`
                : modal.invoiceType === 'purchase'
                  ? 'Yeni Alış Qaiməsi'
                  : 'Yeni Satış Qaiməsi'}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
              <button
                onClick={() => {
                  minimizeWindow(windowId)
                  onUpdate(modal.id, { isMaximized: false })
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '0',
                  color: 'white',
                  width: '46px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e5e5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                title="Aşağı göndər"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect y="5" width="12" height="1" fill="currentColor" />
                </svg>
              </button>
              <button
                onClick={handleMaximize}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '0',
                  color: '#666',
                  width: '46px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e5e5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                title={modal.isMaximized ? "Bərpa et" : "Böyüt"}
              >
                {modal.isMaximized ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="none" />
                    <rect x="4" y="4" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="none" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1" fill="none" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => onClose(modal.id)}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '0',
                  color: '#666',
                  width: '46px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                  lineHeight: '1',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e81123'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#666'
                }}
                title="Bağla"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div >
        )}

        {/* Modal məzmunu */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '1rem', minHeight: 0, display: 'flex', flexDirection: 'column', border: '4px solid green' /* DEBUG BORDER */ }}>
          {/* Qaimə nömrəsi və tarixi */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Qaimə nömrəsi
              </label>
              <input
                type="text"
                placeholder="Qaimə nömrəsi"
                value={localData.invoiceNumber || ''}
                onChange={(e) => {
                  setLocalData({ ...localData, invoiceNumber: e.target.value })
                }}
                style={{
                  width: '100%',
                  padding: '0.35rem 0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Qaimə tarixi
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={formatDateToDisplay(localData.invoiceDate)}
                  onChange={(e) => {
                    // Yalnız rəqəmlər, nöqtələr, boşluq və iki nöqtəyə icazə ver
                    const value = e.target.value.replace(/[^\d. :]/g, '')
                    // Birbaşa yazılan dəyəri saxla (display formatında)
                    setLocalData({ ...localData, invoiceDate: value })
                  }}
                  onFocus={(e) => {

                    setShowInvoiceDatePicker(false)
                    // Əgər localData.invoiceDate boşdursa, cari tarixi təyin et
                    if (!localData.invoiceDate) {
                      const displayValue = formatDateToDisplay(null)
                      const rawValue = convertDisplayToRaw(displayValue)
                      setLocalData({ ...localData, invoiceDate: rawValue })
                    }
                    // Bütün mətn seç (yalnız birinci focus-da, cursor yoxdursa)
                    const input = e.target as HTMLInputElement
                    setTimeout(() => {
                      // Əgər cursor yoxdursa (yəni yeni focus), bütün mətn seç
                      if (input.selectionStart === input.selectionEnd && input.selectionStart === 0) {
                        input.select()
                      }
                    }, 0)
                  }}
                  onMouseDown={(e) => {
                    // İkinci kliklə seçimi ləğv et (cursor qoymağa icazə ver)
                    const input = e.currentTarget
                    if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
                      // Əgər bütün mətn seçilmişdirsə, seçimi ləğv et və cursor qoy
                      e.preventDefault()
                      const rect = input.getBoundingClientRect()
                      const clickPosition = e.clientX - rect.left
                      const textWidth = input.scrollWidth
                      const charWidth = textWidth / input.value.length
                      const charIndex = Math.max(0, Math.min(input.value.length, Math.floor(clickPosition / charWidth)))
                      setTimeout(() => {
                        input.setSelectionRange(charIndex, charIndex)
                        input.focus()
                      }, 0)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const displayValue = e.currentTarget.value
                      const parsed = parseSmartDate(displayValue)
                      // Əgər parse uğurlu oldusa, raw formata çevir
                      const rawValue = convertDisplayToRaw(parsed)
                      setLocalData({ ...localData, invoiceDate: rawValue || parsed })

                    }
                    // Rəqəm yazıldıqda seçilmiş mətn dəyişir (default davranış)
                  }}
                  onBlur={(e) => {
                    // Focus itirdikdə parse et və raw formata çevir
                    const displayValue = e.target.value
                    const parsed = parseSmartDate(displayValue)
                    // Əgər parse uğurlu oldusa, raw formata çevir
                    const rawValue = convertDisplayToRaw(parsed)
                    setLocalData({ ...localData, invoiceDate: rawValue || parsed })

                    // Date picker bağlanması üçün kiçik gecikmə
                    setTimeout(() => setShowInvoiceDatePicker(false), 200)
                  }}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.5rem',
                    paddingRight: '30px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}
                  placeholder={localData.invoiceDate ? '' : 'DD.MM.YYYY HH:MM:SS'}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowInvoiceDatePicker(!showInvoiceDatePicker)

                  }}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#6c757d',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Kalendar"
                >
                  📅
                </button>
                {showInvoiceDatePicker && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '0.25rem',
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '0.5rem',
                      zIndex: 1000,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <input
                      type="date"
                      value={localData.invoiceDate ? localData.invoiceDate.split(' ')[0] : ''}
                      onChange={(e) => {
                        const dateValue = e.target.value
                        if (dateValue) {
                          const timePart = localData.invoiceDate?.split(' ')[1] || '00:00:00'
                          setLocalData({ ...localData, invoiceDate: `${dateValue} ${timePart}` })
                        } else {
                          const now = new Date()
                          const day = String(now.getDate()).padStart(2, '0')
                          const month = String(now.getMonth() + 1).padStart(2, '0')
                          const year = now.getFullYear()
                          const hours = String(now.getHours()).padStart(2, '0')
                          const minutes = String(now.getMinutes()).padStart(2, '0')
                          const seconds = String(now.getSeconds()).padStart(2, '0')
                          setLocalData({ ...localData, invoiceDate: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}` })
                        }
                        setShowInvoiceDatePicker(false)
                      }}
                      style={{
                        padding: '0.25rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Müştəri və Son ödəniş tarixi - yan-yana */}
          {!isPurchase ? (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {/* Müştəri */}
              <div style={{ flex: 1 }}>
                <PartnerSelect
                  partners={customers}
                  value={localData.selectedCustomer || null}
                  onChange={(customer) => {
                    setLocalData(prev => ({
                      ...prev,
                      selectedCustomerId: customer?.id || null,
                      selectedCustomer: customer as Customer | null
                    }))
                  }}
                  placeholder="Müştəri adını yazın..."
                  filterType="BUYER"
                  label="Müştəri"
                  style={{ marginBottom: 0 }}
                />
              </div>

              {/* Son ödəniş tarixi */}
              {localData.paymentDate !== undefined && (
                <div style={{ flex: 1, position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Son ödəniş tarixi
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="15, 15.11 və ya 15.11.2025 formatında daxil edin..."
                      value={localData.paymentDate || ''}
                      onChange={(e) => {
                        setLocalData({ ...localData, paymentDate: e.target.value })
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const value = e.currentTarget.value.trim()
                          if (value) {
                            const formatted = formatDateInput(value)
                            if (formatted) {
                              setLocalData({ ...localData, paymentDate: formatted })
                            }
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value.trim()
                        if (value) {
                          const formatted = formatDateInput(value)
                          if (formatted) {
                            setLocalData({ ...localData, paymentDate: formatted })
                          }
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '0.35rem 0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      style={{
                        padding: '0.35rem 0.5rem',
                        background: '#f8f9fa',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                      title="Tarix seç"
                    >
                      рџ“…
                    </button>
                    {showDatePicker && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.25rem',
                        background: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '0.5rem',
                        zIndex: 1000,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <input
                          type="date"
                          value={localData.paymentDate ? localData.paymentDate.split(' ')[0] : ''}
                          onChange={(e) => {
                            const dateValue = e.target.value
                            if (dateValue) {
                              const timePart = localData.paymentDate?.split(' ')[1] || '00:00:00'
                              setLocalData({ ...localData, paymentDate: `${dateValue} ${timePart}` })
                            } else {
                              setLocalData({ ...localData, paymentDate: '' })
                            }
                            setShowDatePicker(false)
                          }}
                          style={{
                            padding: '0.25rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: '0.75rem' }}>
              <PartnerSelect
                partners={suppliers}
                value={localData.selectedSupplier || null}
                onChange={(supplier) => {
                  setLocalData(prev => ({
                    ...prev,
                    selectedSupplierId: supplier?.id || null,
                    selectedSupplier: supplier as Supplier | null
                  }))
                }}
                placeholder="Təchizatçı adını yazın..."
                filterType="SUPPLIER"
                label="Təchizatçı"
              />
            </div>
          )}
          {/* Məhsul siyahısı */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden', minHeight: 0 }}>
            {/* Toolbar */}
            <div style={{ background: '#f8f9fa', padding: '0.5rem', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Məhsullar ({localData.invoiceItems.length})</div>
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                {/* Add icon */}
                <button
                  onClick={handleAddEmptyRow}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e9ecef'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    color: '#28a745',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    transition: 'background-color 0.2s ease'
                  }}
                  title="Əlavə et (Insert)"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>

                {/* Delete icon */}
                <button
                  onClick={() => {
                    const sortedIndices = [...selectedItemIndices].sort((a, b) => b - a)
                    const newItems = [...localData.invoiceItems]
                    sortedIndices.forEach(index => {
                      newItems.splice(index, 1)
                    })
                    setLocalData({ ...localData, invoiceItems: newItems })
                    setSelectedItemIndices([])
                  }}
                  disabled={selectedItemIndices.length === 0}
                  onMouseEnter={(e) => {
                    if (selectedItemIndices.length > 0) {
                      e.currentTarget.style.background = '#e9ecef'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = selectedItemIndices.length === 0 ? '#e9ecef' : 'transparent'
                  }}
                  style={{
                    padding: '0.5rem',
                    background: selectedItemIndices.length === 0 ? '#e9ecef' : 'transparent',
                    color: selectedItemIndices.length === 0 ? '#adb5bd' : '#dc3545',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedItemIndices.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    transition: 'background-color 0.2s ease'
                  }}
                  title="Sil (Delete)"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 4H13M6 4V3C6 2.44772 6.44772 2 7 2H9C9.55228 2 10 2.44772 10 3V4M6 7.5V11.5M10 7.5V11.5M4 4L4.5 13C4.5 13.5523 4.94772 14 5.5 14H10.5C11.0523 14 11.5 13.5523 11.5 13L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>

                {/* Copy icon */}
                <button
                  onClick={() => {
                    if (selectedItemIndices.length > 0) {
                      const sortedIndices = [...selectedItemIndices].sort((a, b) => a - b)
                      const newItems = [...localData.invoiceItems]
                      const copiedItems = sortedIndices.map(index => ({ ...newItems[index] }))
                      setLocalData({ ...localData, invoiceItems: [...newItems, ...copiedItems] })
                    }
                  }}
                  disabled={selectedItemIndices.length === 0}
                  onMouseEnter={(e) => {
                    if (selectedItemIndices.length > 0) {
                      e.currentTarget.style.background = '#e9ecef'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = selectedItemIndices.length === 0 ? '#e9ecef' : 'transparent'
                  }}
                  style={{
                    padding: '0.5rem',
                    background: selectedItemIndices.length === 0 ? '#e9ecef' : 'transparent',
                    color: selectedItemIndices.length === 0 ? '#adb5bd' : '#495057',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedItemIndices.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    transition: 'background-color 0.2s ease'
                  }}
                  title="Kopyala (F9)"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 2C4 0.895431 4.89543 0 6 0H10C11.1046 0 12 0.895431 12 2V6C12 7.10457 11.1046 8 10 8H6C4.89543 8 4 7.10457 4 6V2Z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M4 6H2C0.895431 6 0 6.89543 0 8V12C0 13.1046 0.895431 14 2 14H6C7.10457 14 8 13.1046 8 12V10" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>

                {/* Move up icon */}
                <button
                  onClick={() => {
                    if (selectedItemIndices.length === 1) {
                      const index = selectedItemIndices[0]
                      if (index > 0) {
                        const newItems = [...localData.invoiceItems]
                        const temp = newItems[index]
                        newItems[index] = newItems[index - 1]
                        newItems[index - 1] = temp
                        setLocalData({ ...localData, invoiceItems: newItems })
                        setSelectedItemIndices([index - 1])
                      }
                    }
                  }}
                  disabled={selectedItemIndices.length !== 1 || selectedItemIndices[0] === 0}
                  onMouseEnter={(e) => {
                    if (selectedItemIndices.length === 1 && selectedItemIndices[0] > 0) {
                      e.currentTarget.style.background = '#e9ecef'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = (selectedItemIndices.length !== 1 || selectedItemIndices[0] === 0) ? '#e9ecef' : 'transparent'
                  }}
                  style={{
                    padding: '0.5rem',
                    background: (selectedItemIndices.length !== 1 || selectedItemIndices[0] === 0) ? '#e9ecef' : 'transparent',
                    color: (selectedItemIndices.length !== 1 || selectedItemIndices[0] === 0) ? '#adb5bd' : '#495057',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (selectedItemIndices.length !== 1 || selectedItemIndices[0] === 0) ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    transition: 'background-color 0.2s ease'
                  }}
                  title="Yuxarı"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Move down icon */}
                <button
                  onClick={() => {
                    if (selectedItemIndices.length === 1) {
                      const index = selectedItemIndices[0]
                      if (index < localData.invoiceItems.length - 1) {
                        const newItems = [...localData.invoiceItems]
                        const temp = newItems[index]
                        newItems[index] = newItems[index + 1]
                        newItems[index + 1] = temp
                        setLocalData({ ...localData, invoiceItems: newItems })
                        setSelectedItemIndices([index + 1])
                      }
                    }
                  }}
                  disabled={selectedItemIndices.length !== 1 || selectedItemIndices[0] === localData.invoiceItems.length - 1}
                  onMouseEnter={(e) => {
                    if (selectedItemIndices.length === 1 && selectedItemIndices[0] < localData.invoiceItems.length - 1) {
                      e.currentTarget.style.background = '#e9ecef'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = (selectedItemIndices.length !== 1 || selectedItemIndices[0] === localData.invoiceItems.length - 1) ? '#e9ecef' : 'transparent'
                  }}
                  style={{
                    padding: '0.5rem',
                    background: (selectedItemIndices.length !== 1 || selectedItemIndices[0] === localData.invoiceItems.length - 1) ? '#e9ecef' : 'transparent',
                    color: (selectedItemIndices.length !== 1 || selectedItemIndices[0] === localData.invoiceItems.length - 1) ? '#adb5bd' : '#495057',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (selectedItemIndices.length !== 1 || selectedItemIndices[0] === localData.invoiceItems.length - 1) ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    transition: 'background-color 0.2s ease'
                  }}
                  title="Aşağı"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 4V12M8 12L4 8M8 12L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Barcode icon */}
                <button
                  onClick={() => {
                    // Barkod funksiyası
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e9ecef'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    color: '#495057',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    transition: 'background-color 0.2s ease'
                  }}
                  title="Barkod"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4H2M1 8H2M1 12H2M4 4H5M4 8H5M4 12H5M7 4H8M7 8H8M7 12H8M10 4H11M10 8H11M10 12H11M13 4H14M13 8H14M13 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>

                {/* Folder icon */}
                <button
                  onClick={() => {
                    // Papka funksiyası
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e9ecef'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    color: '#495057',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    transition: 'background-color 0.2s ease'
                  }}
                  title="Papka"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 3C2 2.44772 2.44772 2 3 2H6.58579C6.851 2 7.10536 2.10536 7.29289 2.29289L8.70711 3.70711C8.89464 3.89464 9.149 4 9.41421 4H13C13.5523 4 14 4.44772 14 5V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3Z" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>

                {/* Settings icon */}
                <button
                  onClick={() => {
                    openTableSettings()
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e9ecef'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    color: '#495057',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    transition: 'background-color 0.2s ease'
                  }}
                  title="Ayarlar"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12.5 8C12.5 7.5 12.7 7 12.9 6.6L13.8 5.1C14 4.7 13.9 4.2 13.5 3.9L12.1 2.9C11.7 2.6 11.2 2.6 10.8 2.9L9.8 3.5C9.4 3.3 9 3.1 8.5 3.1H7.5C7 3.1 6.6 3.3 6.2 3.5L5.2 2.9C4.8 2.6 4.3 2.6 3.9 2.9L2.5 3.9C2.1 4.2 2 4.7 2.2 5.1L3.1 6.6C3.3 7 3.1 7.5 3.1 8C3.1 8.5 3.3 9 3.1 9.4L2.2 10.9C2 11.3 2.1 11.8 2.5 12.1L3.9 13.1C4.3 13.4 4.8 13.4 5.2 13.1L6.2 12.5C6.6 12.7 7 12.9 7.5 12.9H8.5C9 12.9 9.4 12.7 9.8 12.5L10.8 13.1C11.2 13.4 11.7 13.4 12.1 13.1L13.5 12.1C13.9 11.8 14 11.3 13.8 10.9L12.9 9.4C12.7 9 12.5 8.5 12.5 8Z" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </div>
            </div>
            <InvoiceTable
              items={localData.invoiceItems}
              columns={tableColumns}
              onColumnsChange={setTableColumns}
              selectedItemIndices={selectedItemIndices}
              onRowSelect={setSelectedItemIndices}
              functionSettings={functionSettings}
              onUpdateItem={handleTableUpdateItem}
              onProductSelect={(idx, prod) => {
                if (typeof handleProductSelectInRow === 'function') {
                  handleProductSelectInRow(idx, prod.id)
                }
              }}
              onOpenProductSelect={openProductsSelect}
              onOpenProductDetails={handleOpenProductDetails}

              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}

              getProductInfo={getProductInfo}
              getFilteredProductsForRow={getFilteredProductsForRow}
              isPurchase={isPurchase}
            />
          </div>

        </div>


        {/* Düymələr */}
        <div style={{ padding: '1rem', borderTop: '1px solid #ddd', display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0, border: '4px solid orange' /* DEBUG BORDER */ }}>
          {/* Qeydlər */}
          <div style={{ flex: 1 }}>
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: '#f8f9fa',
              padding: '0.35rem 0.5rem',
              display: 'flex',
              alignItems: 'center',
              height: '36px',
              boxSizing: 'border-box'
            }}>
              <textarea
                value={localData.notes}
                onChange={(e) => setLocalData({ ...localData, notes: e.target.value })}
                onFocus={() => setNotesFocused(true)}
                onBlur={() => {
                  if (!localData.notes) {
                    setNotesFocused(false)
                  }
                }}
                placeholder={notesFocused || localData.notes ? '' : 'Qeydlər'}
                style={{
                  width: '100%',
                  padding: '0',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  resize: 'none',
                  background: 'transparent',
                  outline: 'none',
                  height: '100%',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                  overflow: 'hidden'
                }}
              />
            </div>
          </div>

          {/* Düymələr */}
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            {onPrint && (
              <button
                onClick={() => onPrint(modal.id, localData)}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
                title="Çap et (Ctrl+P)"
              >
                🖨️ Çap et
              </button>
            )}

            <button
              onClick={() => onClose(modal.id)}
              style={{
                padding: '0.5rem 1.5rem',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
              title="Bağla (ESC)"
            >
              Bağla
            </button>
            <button
              onClick={(e) => {
                console.log('[InvoiceModal] Yadda Saxla düyməsi klik olundu (normal)', {
                  event: e,
                  handleSaveType: typeof handleSave,
                  handleSaveUndefined: handleSave === undefined,
                  modalId: modal.id
                })
                if (handleSave) {
                  handleSave()
                } else {
                  console.error('[InvoiceModal] handleSave funksiyası undefined-dır!')
                }
              }}
              style={{
                padding: '0.5rem 1.5rem',
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
              title="Yadda Saxla (Ctrl+S)"
            >
              Yadda Saxla
            </button>
            <button
              onClick={(e) => {
                console.log('[InvoiceModal] OK düyməsi klik olundu (normal)', {
                  event: e,
                  handleOKType: typeof handleOK,
                  handleOKUndefined: handleOK === undefined,
                  modalId: modal.id
                })
                if (handleOK) {
                  handleOK()
                } else {
                  console.error('[InvoiceModal] handleOK funksiyası undefined-dır!')
                }
              }}
              style={{
                padding: '0.5rem 1.5rem',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              OK
            </button>
            <button
              onClick={() => onPrint && onPrint(modal.id, localData)}
              disabled={!onPrint}
              style={{
                padding: '0.5rem 1.5rem',
                background: onPrint ? '#6f42c1' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: onPrint ? 'pointer' : 'not-allowed',
                fontSize: '0.875rem',
                fontWeight: '500',
                opacity: onPrint ? 1 : 0.6
              }}
              title={onPrint ? "Çap et (Ctrl+P)" : "Çap funksiyası mövcud deyil"}
            >
              Çap
            </button>
          </div>
        </div>

        {/* Resize handle */}
        {
          !isEmbedded && !modal.isMaximized && (
            <div
              onMouseDown={handleResizeMouseDown}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '20px',
                height: '20px',
                cursor: 'nwse-resize',
                background: 'linear-gradient(135deg, transparent 0%, transparent 40%, #999 40%, #999 60%, transparent 60%)',
              }}
            />
          )
        }

        {/* Təsdiq Dialoqu - Qaimə daxilində render olunur */}
        {
          activeConfirmDialog && (
            <ConfirmDialog {...activeConfirmDialog} />
          )
        }

        {/* Product Edit Modal Removed - rendered via Universal Window */}
      </div >
    </div >
  )
}

export default InvoiceModal
