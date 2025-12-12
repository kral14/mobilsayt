import { useState, useEffect, useCallback, useRef } from 'react'

import DataTable, { ColumnConfig } from '../../components/DataTable'
import InvoiceModal, { type ModalData, type InvoiceItem } from '../../components/InvoiceModal'
import { purchaseInvoicesAPI, productsAPI, suppliersAPI, warehousesAPI } from '../../services/api'
import type { PurchaseInvoice, Product, Supplier, WarehouseLocation } from '@shared/types'
import { useWindowStore } from '../../store/windowStore'

// Development rejimində console.log üçün helper
const devLog = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(...args)
  }
}

// CSS animasiya üçün style tag
const notificationStyles = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

const defaultColumns: ColumnConfig[] = [
  { id: 'checkbox', label: '', visible: true, width: 50, order: 0 },
  {
    id: 'is_active_status',
    label: '',
    visible: true,
    width: 50,
    order: 1,
    align: 'center',
    render: (value: any) => {
      if (value === '✓') {
        return (
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
        )
      }
      return <span style={{ fontSize: '1.2rem' }}>📄</span>
    }
  },
  { id: 'id', label: 'ID', visible: true, width: 80, order: 2 },
  { id: 'invoice_number', label: 'Faktura №', visible: true, width: 150, order: 3 },
  { id: 'supplier_name', label: 'Təchizatçı', visible: true, width: 200, order: 4 },
  { id: 'invoice_date', label: 'Tarix', visible: true, width: 120, order: 5 },
  { id: 'total_amount', label: 'Ümumi məbləğ', visible: true, width: 150, order: 6, align: 'right' },
  { id: 'notes', label: 'Qeydlər', visible: true, width: 200, order: 7 },
  { id: 'created_at', label: 'Yaradılma tarixi', visible: false, width: 150, order: 8 },
]

export default function AlisQaimeleri() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredInvoices, setFilteredInvoices] = useState<PurchaseInvoice[]>([])
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<(number | string)[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Bildiriş göstər funksiyası
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }, [])

  // Çoxlu modal state - Windows benzeri sistem
  const [openModals, setOpenModals] = useState<Map<string, ModalData>>(new Map())
  const openModalsRef = useRef<Map<string, ModalData>>(new Map())
  const [activeModalId, setActiveModalId] = useState<string | null>(null)
  const [baseZIndex, setBaseZIndex] = useState(1000)
  
  // openModals state-i dəyişdikdə ref-i yenilə
  useEffect(() => {
    openModalsRef.current = openModals
  }, [openModals])

  // Global window store
  const { addWindow, removeWindow, updateWindow } = useWindowStore()

  // Data state
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([])

  // Köhnə modal state (artıq istifadə olunmur - silinə bilər)
  // const [showModal, setShowModal] = useState(false)
  // const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showItemSettingsModal, setShowItemSettingsModal] = useState(false)

  // Modal yönetim fonksiyonları - useEffect-dən əvvəl təyin etmək lazımdır
  const handleModalUpdate = useCallback((modalId: string, updates: Partial<ModalData>) => {
    setOpenModals(prev => {
      const newMap = new Map(prev)
      const currentModal = newMap.get(modalId)
      if (currentModal) {
        newMap.set(modalId, { ...currentModal, ...updates })
      }
      return newMap
    })
  }, [])

  const handleModalClose = useCallback((modalId: string) => {
    setOpenModals(prev => {
      const newMap = new Map(prev)
      newMap.delete(modalId)
      
      // activeModalId-ni yenilə
      if (activeModalId === modalId) {
        const remainingModals = Array.from(newMap.values())
        if (remainingModals.length > 0) {
          const topModal = remainingModals.reduce((prev, curr) =>
            curr.zIndex > prev.zIndex ? curr : prev
          )
          setActiveModalId(topModal.id)
        } else {
          setActiveModalId(null)
        }
      }
      
      return newMap
    })
    
    const windowId = `purchase-invoice-modal-${modalId}`
    removeWindow(windowId)
  }, [activeModalId, removeWindow])

  const handleModalActivate = useCallback((modalId: string) => {
    const newZIndex = baseZIndex + 1
    setBaseZIndex(newZIndex)
    setActiveModalId(modalId)
    setOpenModals(prev => {
      const newMap = new Map(prev)
      const currentModal = newMap.get(modalId)
      if (currentModal) {
        newMap.set(modalId, { ...currentModal, zIndex: newZIndex })
      }
      return newMap
    })
    const windowId = `purchase-invoice-modal-${modalId}`
    useWindowStore.getState().updateWindow(windowId, { zIndex: newZIndex, isVisible: true, isMinimized: false })
  }, [baseZIndex])

  const handleModalPrint = useCallback(async (modalId: string, _modalData: ModalData['data']) => {
    const modal = openModals.get(modalId)
    if (!modal || !modal.invoiceId) {
      alert('Yalnız mövcud qaimələr çap edilə bilər')
      return
    }

    try {
      const fullInvoice = await purchaseInvoicesAPI.getById(modal.invoiceId.toString())
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const invoiceDate = fullInvoice.invoice_date ? new Date(fullInvoice.invoice_date).toLocaleDateString('az-AZ') : '-'
        const items = fullInvoice.purchase_invoice_items || []
        const totalAmount = fullInvoice.total_amount ? Number(fullInvoice.total_amount) : 0

        const htmlContent = `
          <html>
            <head>
              <title>Alış Qaiməsi</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .invoice-header { text-align: center; margin-bottom: 20px; }
                .invoice-header h2 { margin: 0; }
                .invoice-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .invoice-info div { flex: 1; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total-row { font-weight: bold; background-color: #f9f9f9; }
                .text-right { text-align: right; }
              </style>
            </head>
            <body>
              <div class="invoice">
                <div class="invoice-header">
                  <h2>ALIŞ QAIMƏSİ</h2>
                </div>
                <div class="invoice-info">
                  <div>
                    <p><strong>Faktura №:</strong> ${fullInvoice.invoice_number || ''}</p>
                    <p><strong>Tarix:</strong> ${invoiceDate}</p>
                  </div>
                  <div>
                    <p><strong>Təchizatçı:</strong> ${fullInvoice.suppliers?.name || '-'}</p>
                    ${fullInvoice.suppliers?.phone ? `<p><strong>Telefon:</strong> ${fullInvoice.suppliers.phone}</p>` : ''}
                    ${fullInvoice.suppliers?.address ? `<p><strong>Ünvan:</strong> ${fullInvoice.suppliers.address}</p>` : ''}
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Məhsul</th>
                      <th class="text-right">Miqdar</th>
                      <th class="text-right">Vahid qiymət</th>
                      <th class="text-right">Cəmi</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map((item: any, idx: number) => `
                      <tr>
                        <td>${idx + 1}</td>
                        <td>${item.products?.name || 'Naməlum məhsul'}</td>
                        <td class="text-right">${Number(item.quantity).toFixed(2)}</td>
                        <td class="text-right">${Number(item.unit_price).toFixed(2)} ₼</td>
                        <td class="text-right">${Number(item.total_price).toFixed(2)} ₼</td>
                      </tr>
                    `).join('')}
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td colspan="4" class="text-right"><strong>Ümumi məbləğ:</strong></td>
                      <td class="text-right"><strong>${totalAmount.toFixed(2)} ₼</strong></td>
                    </tr>
                  </tfoot>
                </table>
                ${fullInvoice.notes ? `<p style="margin-top: 20px;"><strong>Qeydlər:</strong> ${fullInvoice.notes}</p>` : ''}
              </div>
            </body>
          </html>
        `
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.print()
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Qaimə çap edilərkən xəta baş verdi')
    }
  }, [openModals])

  // loadInvoices funksiyasını useEffect-dən əvvəl təyin et (handleModalSave-dən əvvəl lazımdır)
  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await purchaseInvoicesAPI.getAll()
      setInvoices(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Qaimələr yüklənərkən xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }, [])

  // Pəncərələri izlə və global store-a əlavə et
  useEffect(() => {
    // Qaimə modalları - global store-a əlavə et
    devLog('[Alis.tsx] useEffect - Modallar yoxlanılır:', {
      modalsCount: openModals.size,
      modalIds: Array.from(openModals.keys())
    })
    
    // Silinmiş modalları store-dan sil
    const store = useWindowStore.getState()
    const currentModalIds = new Set(Array.from(openModals.keys()))
    
    // Köhnə window-ları təmizlə
    Array.from(store.windows.values())
      .filter(w => w.id.startsWith('purchase-invoice-modal-'))
      .forEach(window => {
        const modalId = window.id.replace('purchase-invoice-modal-', '')
        if (!currentModalIds.has(modalId)) {
          // Window-u sil (handleModalClose artıq bunu edir, amma burada da təmizlik üçün)
          store.closeWindow(window.id)
        }
      })
    
    // Sonra mövcud modalları yarad və ya yenilə
    Array.from(openModals.values()).forEach((modal, index) => {
      const windowId = `purchase-invoice-modal-${modal.id}`
      const store = useWindowStore.getState()
      const existingWindow = store.windows.get(windowId)

      devLog(`[Alis.tsx] useEffect - Modal ${index + 1}/${openModals.size}:`, {
        modalId: modal.id,
        invoiceId: modal.invoiceId,
        windowId,
        existingWindow: !!existingWindow
      })

      if (!existingWindow) {
        devLog(`[Alis.tsx] useEffect - Yeni window yaradılır:`, {
          windowId,
          modalId: modal.id,
          invoiceId: modal.invoiceId,
          zIndex: modal.zIndex,
          position: modal.position,
          size: modal.size,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          positionX: modal.position.x,
          positionY: modal.position.y,
          sizeWidth: modal.size.width,
          sizeHeight: modal.size.height,
          isMaximized: modal.isMaximized
        })
        addWindow({
          id: windowId,
          title: modal.invoiceId ? `Qaimə #${modal.invoiceId}` : 'Yeni Alış Qaiməsi',
          type: 'modal',
          modalType: 'invoice-edit',
          pageId: 'purchase-invoice-modal',
          isVisible: true,
          isMinimized: false,
          zIndex: modal.zIndex,
          position: modal.position,
          size: modal.size,
          isMaximized: modal.isMaximized,
          content: (
            <InvoiceModal
              modal={modal}
              suppliers={suppliers}
              products={products}
              modalIndex={Array.from(openModals.values()).indexOf(modal)}
              isActive={activeModalId === modal.id}
              onClose={handleModalClose}
              onUpdate={handleModalUpdate}
              onSave={handleModalSave}
              onSaveAndConfirm={handleModalSaveAndConfirm}
              onActivate={handleModalActivate}
              onPrint={handleModalPrint}
              windowId={windowId}
              isEmbedded={true}
              warehouses={warehouses}
            />
          ),
          onRestore: () => {
            setActiveModalId(modal.id)
            setOpenModals(prev => {
              const newMap = new Map(prev)
              const currentModal = newMap.get(modal.id)
              if (currentModal) {
                newMap.set(modal.id, { ...currentModal, isMaximized: false })
              }
              return newMap
            })
          },
          onClose: () => {
            // handleModalClose funksiyasını çağır (duplicate logic-i aradan qaldırır)
            handleModalClose(modal.id)
          }
        })
        
        // Window yaradıldıqdan sonra yoxla
        setTimeout(() => {
          const checkStore = useWindowStore.getState()
          const createdWindow = checkStore.windows.get(windowId)
          devLog(`[Alis.tsx] useEffect - Window yaradıldıqdan sonra yoxlama:`, {
            windowId,
            created: !!createdWindow,
            isVisible: createdWindow?.isVisible,
            isMinimized: createdWindow?.isMinimized,
            hasContent: !!createdWindow?.content
          })
        }, 100)
      } else {
        const storeWindow = existingWindow
        const storeIsMinimized = storeWindow.isMinimized || false
        
        devLog(`[Alis.tsx] useEffect - Mövcud window yenilənir:`, {
          windowId,
          isVisible: storeWindow.isVisible,
          isMinimized: storeIsMinimized
        })
        
        // Content-i həmişə yenilə ki, prop-lar düzgün ötürülsün (modal data, suppliers, products və s. dəyişə bilər)
        // Əmin ol ki, window görünürdür (isVisible: true)
        updateWindow(windowId, {
          isVisible: true, // Həmişə görünür olmalıdır (minimize edilməmişdirsə)
          isMinimized: storeIsMinimized,
          zIndex: modal.zIndex,
          position: modal.position,
          size: modal.size,
          isMaximized: modal.isMaximized,
          content: (
            <InvoiceModal
              modal={modal}
              suppliers={suppliers}
              products={products}
              modalIndex={Array.from(openModals.values()).indexOf(modal)}
              isActive={activeModalId === modal.id}
              onClose={handleModalClose}
              onUpdate={handleModalUpdate}
              onSave={handleModalSave}
              onSaveAndConfirm={handleModalSaveAndConfirm}
              onActivate={handleModalActivate}
              onPrint={handleModalPrint}
              windowId={windowId}
              isEmbedded={true}
              warehouses={warehouses}
            />
          ),
          onClose: () => {
            // handleModalClose funksiyasını çağır (duplicate logic-i aradan qaldırır)
            handleModalClose(modal.id)
          }
        })
      }
    })


    // Köhnə modal sistemi silindi - yeni sistem istifadə olunur (openModals Map)


    // Təchizatçı modalı
    const existingSupplierWindow = useWindowStore.getState().windows.get('supplier-modal')
    if (showSupplierModal) {
      if (!existingSupplierWindow) {
        addWindow({
          id: 'supplier-modal',
          title: 'Təchizatçı seçin',
          type: 'modal',
          modalType: 'supplier',
          isVisible: showSupplierModal,
          isMinimized: false,
          zIndex: 2000,
          onActivate: () => {
            setShowSupplierModal(true)
          },
          onClose: () => {
            setShowSupplierModal(false)
            removeWindow('supplier-modal')
          }
        })
      } else {
        useWindowStore.getState().updateWindow('supplier-modal', { isVisible: showSupplierModal })
      }
    } else {
      if (existingSupplierWindow) {
        useWindowStore.getState().updateWindow('supplier-modal', { isVisible: false })
      }
    }

    // Məhsul modalı
    const existingProductWindow = useWindowStore.getState().windows.get('product-modal')
    if (showProductModal) {
      if (!existingProductWindow) {
        addWindow({
          id: 'product-modal',
          title: 'Məhsul seçin',
          type: 'modal',
          modalType: 'product',
          isVisible: showProductModal,
          isMinimized: false,
          zIndex: 2000,
          onActivate: () => {
            setShowProductModal(true)
          },
          onClose: () => {
            setShowProductModal(false)
            removeWindow('product-modal')
          }
        })
      } else {
        useWindowStore.getState().updateWindow('product-modal', { isVisible: showProductModal })
      }
    } else {
      if (existingProductWindow) {
        useWindowStore.getState().updateWindow('product-modal', { isVisible: false })
      }
    }

    // Cədvəl ayarları modalı
    const existingSettingsWindow = useWindowStore.getState().windows.get('item-settings-modal')
    if (showItemSettingsModal) {
      if (!existingSettingsWindow) {
        addWindow({
          id: 'item-settings-modal',
          title: 'Cədvəl ayarları',
          type: 'modal',
          modalType: 'settings',
          isVisible: showItemSettingsModal,
          isMinimized: false,
          zIndex: 2000,
          onActivate: () => {
            setShowItemSettingsModal(true)
          },
          onClose: () => {
            setShowItemSettingsModal(false)
            removeWindow('item-settings-modal')
          }
        })
      } else {
        useWindowStore.getState().updateWindow('item-settings-modal', { isVisible: showItemSettingsModal })
      }
    } else {
      if (existingSettingsWindow) {
        useWindowStore.getState().updateWindow('item-settings-modal', { isVisible: false })
      }
    }
  }, [openModals, activeModalId, showSupplierModal, showProductModal, showItemSettingsModal, suppliers, products, warehouses, handleModalClose, handleModalUpdate, handleModalActivate, handleModalPrint])

  useEffect(() => {
    loadInvoices()
    loadSuppliers()
    loadProducts()
    loadWarehouses()
  }, [loadInvoices])

  useEffect(() => {
    filterInvoices()
  }, [searchTerm, invoices])

  const loadSuppliers = async () => {
    try {
      const data = await suppliersAPI.getAll()
      setSuppliers(data)
    } catch (err: any) {
      console.error('Təchizatçılar yüklənərkən xəta:', err)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await productsAPI.getAll()
      setProducts(data)
    } catch (err: any) {
      console.error('Məhsullar yüklənərkən xəta:', err)
    }
  }

  const loadWarehouses = async () => {
    try {
      const data = await warehousesAPI.getAll()
      setWarehouses(data)
    } catch (err: any) {
      console.error('Anbarlar yüklənərkən xəta:', err)
    }
  }

  const filterInvoices = () => {
    if (!searchTerm.trim()) {
      setFilteredInvoices(invoices)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = invoices.filter(invoice => {
      return (
        invoice.invoice_number?.toLowerCase().includes(term) ||
        invoice.suppliers?.name?.toLowerCase().includes(term) ||
        invoice.notes?.toLowerCase().includes(term) ||
        invoice.total_amount?.toString().includes(term)
      )
    })
    setFilteredInvoices(filtered)
  }

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  // Çoxlu modal açmaq üçün funksiya
  const openModalForInvoice = async (invoiceId: number | null = null) => {
    try {
      // Əgər invoiceId varsa, eyni qaimə artıq açıqdırsa, onu fokusla
      if (invoiceId) {
        const existingModal = Array.from(openModalsRef.current.values()).find(
          modal => modal.invoiceId === invoiceId
        )
        
        if (existingModal) {
          devLog('[Alis.tsx] Eyni qaimə artıq açıqdır, fokuslanır:', invoiceId)
          const windowId = `purchase-invoice-modal-${existingModal.id}`
          const store = useWindowStore.getState()
          const windowInfo = store.windows.get(windowId)
          
          // Əgər minimize edilmişdirsə, restore et
          if (windowInfo?.isMinimized) {
            store.restoreWindow(windowId)
          }
          
          // Fokusla (z-index artır və aktiv et)
          store.activateWindow(windowId)
          setActiveModalId(existingModal.id)
          
          showNotification('Qaimə artıq açıqdır', 'info')
          return
        }
      }

      // Load invoice data FIRST if editing
      let fullInvoice: PurchaseInvoice | null = null
      if (invoiceId) {
        fullInvoice = await purchaseInvoicesAPI.getById(invoiceId.toString())
      }

      // Eyni invoice üçün eyni modal ID istifadə et (fokuslanma üçün)
      const modalId = invoiceId ? `modal-${invoiceId}` : `modal-new-${Date.now()}`

      // Saxlanılan ayarları yüklə
      let savedPrefs: any = null
      try {
        const stored = localStorage.getItem('window-pref-purchase-invoice-modal')
        if (stored) {
          savedPrefs = JSON.parse(stored)
          devLog('[Alis] Saxlanılan ayarlar yükləndi:', savedPrefs)
        }
      } catch (e) {
        console.error('[Alis] Ayarları yükləmək uğursuz oldu:', e)
      }

      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      
      // Əgər saxlanılan ayarlar varsa, onları istifadə et
      const modalWidth = savedPrefs?.size?.width || Math.min(900, Math.floor((screenWidth - 60) / 2))
      const modalHeight = savedPrefs?.size?.height || Math.min(700, screenHeight - 80)

      // Yeni modalın pozisiyasını hesabla (yan-yana yerləşdirmək üçün)
      // Mövcud açıq modalların sayını hesabla (yeni modal daxil olmadan)
      const visibleModalsCount = Array.from(openModals.values()).filter(m => {
        const windowId = `purchase-invoice-modal-${m.id}`
        const store = useWindowStore.getState()
        const windowInfo = store.windows.get(windowId)
        return !windowInfo?.isMinimized
      }).length

      // Yeni modal üçün say (mövcud modallar + yeni modal)
      const modalCount = visibleModalsCount
      
      devLog('[Alis.tsx] Position hesablaması:', {
        visibleModalsCount,
        modalCount,
        screenWidth,
        screenHeight,
        modalHeight,
        calculatedX: modalCount % 2 === 0 ? 20 : Math.floor(screenWidth / 2) + 10,
        calculatedY: Math.floor(modalCount / 2) * (modalHeight + 20) + 50
      })

      // Invoice date formatla - saat, dəqiqə, saniyə ilə
      let invoiceDateStr = ''
      if (fullInvoice?.invoice_date) {
        const date = new Date(fullInvoice.invoice_date)
        invoiceDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
      }

      // Invoice items formatla
      const invoiceItemsData = fullInvoice ? (fullInvoice.purchase_invoice_items || []) : []
      const items: InvoiceItem[] = invoiceItemsData.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.products?.name || 'Naməlum məhsul',
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
      }))

      const newZIndex = baseZIndex + 1

      // Create modal with loaded data
      const newModal: ModalData = {
        id: modalId,
        invoiceId: invoiceId,
        position: {
          x: modalCount % 2 === 0 ? 20 : Math.floor(screenWidth / 2) + 10,
          y: Math.floor(modalCount / 2) * (modalHeight + 20) + 50
        },
        size: {
          width: modalWidth,
          height: modalHeight
        },
        isMaximized: savedPrefs?.isMaximized || false,
        zIndex: newZIndex,
        invoiceType: 'purchase',
        isActive: fullInvoice ? fullInvoice.is_active || false : undefined,
        data: {
          selectedSupplierId: fullInvoice?.supplier_id || null,
          selectedSupplier: fullInvoice?.suppliers || null,
          invoiceItems: items,
          notes: fullInvoice?.notes || '',
          invoiceNumber: fullInvoice?.invoice_number || '',
          invoiceDate: invoiceDateStr
        }
      } as any // normalState type error-ını aradan qaldırmaq üçün

      setBaseZIndex(newZIndex)
      devLog('[Alis.tsx] openModalForInvoice - Modal yaradılır:', { modalId, newModal })
      setOpenModals(prev => {
        const newMap = new Map(prev)
        newMap.set(modalId, newModal)
        devLog('[Alis.tsx] openModalForInvoice - openModals yeniləndi:', { 
          modalId, 
          mapSize: newMap.size,
          mapKeys: Array.from(newMap.keys())
        })
        return newMap
      })
      setActiveModalId(modalId)
      devLog('[Alis.tsx] openModalForInvoice - Modal yaradıldı və state yeniləndi:', modalId)
      // Window useEffect-də avtomatik yaradılacaq
    } catch (err: any) {
      console.error('Modal açılarkən xəta:', err)
      alert('Modal açılarkən xəta baş verdi')
    }
  }

  const handleEdit = async (selectedIds: (number | string)[]) => {
    if (selectedIds.length === 1) {
      const invoiceId = parseInt(selectedIds[0].toString())
      await openModalForInvoice(invoiceId)
    }
  }

  const handleDelete = async (selectedIds: (number | string)[]) => {
    if (confirm(`${selectedIds.length} qaimə silinsin?`)) {
      try {
        await Promise.all(selectedIds.map(id => purchaseInvoicesAPI.delete(id.toString())))
        await loadInvoices()
        alert('Qaimələr silindi')
      } catch (err: any) {
        alert(err.response?.data?.message || 'Silinərkən xəta baş verdi')
      }
    }
  }

  const handleCopy = (_selectedIds: (number | string)[]) => {
    // TODO: Kopyalama funksiyası
    alert('Kopyalama funksiyası hazırlanır...')
  }

  // F4 qısayolu üçün useEffect (yalnız modal açıq deyilsə)
  useEffect(() => {
    // Modal açıq olduqda qısa yolları deaktiv et
    const hasOpenModals = openModals.size > 0
    if (hasOpenModals) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // F4 basıldıqda
      if (e.key === 'F4') {
        // Aktiv element yoxla
        const activeElement = document.activeElement as HTMLElement

        // Təchizatçı input-undadırsa
        if (activeElement && activeElement.getAttribute('data-supplier-input') === 'true') {
          e.preventDefault()
          setShowSupplierModal(true)
        }

        // Məhsul input-undadırsa (modal içində)
        if (activeElement && activeElement.getAttribute('data-product-input') === 'true') {
          e.preventDefault()
          setShowProductModal(true)
        }

        // Cədvəldəki məhsul input-undadırsa
        if (activeElement && activeElement.getAttribute('data-product-row-input') === 'true') {
          e.preventDefault()
          const rowIndex = activeElement.getAttribute('data-row-index')
          if (rowIndex !== null) {
            setShowProductModal(true)
            // Seçilmiş sətiri yadda saxla ki, modal bağlandıqdan sonra o sətirə məhsul əlavə edə bilək
            sessionStorage.setItem('selectedProductRowIndex', rowIndex)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openModals])


  const handleModalSave = useCallback(async (modalId: string, modalData: ModalData['data']) => {
    devLog('[Alis.tsx] ========== handleModalSave FUNKSİYASI ÇAĞIRILDI ==========')
    devLog('[Alis.tsx] handleModalSave çağırıldı', { 
      modalId, 
      modalData,
      modalDataKeys: Object.keys(modalData),
      invoiceItemsCount: modalData.invoiceItems?.length || 0
    })
    
    // Promise istifadə edirik ki, callback-dəki modal-ı callback-dən sonra istifadə edə bilək
    const modalPromise = new Promise<ModalData | undefined>((resolve) => {
      setOpenModals(currentModals => {
        devLog('[Alis.tsx] handleModalSave - setOpenModals callback çağırıldı')
        devLog('[Alis.tsx] handleModalSave - openModals Map-dəki ID-lər:', Array.from(currentModals.keys()))
        devLog('[Alis.tsx] handleModalSave - openModals Map ölçüsü:', currentModals.size)
        devLog('[Alis.tsx] handleModalSave - Axtarılan modalId:', modalId)
        devLog('[Alis.tsx] handleModalSave - Modal ID uyğunluğu:', {
          searchedId: modalId,
          mapKeys: Array.from(currentModals.keys()),
          exactMatch: currentModals.has(modalId),
          allEntries: Array.from(currentModals.entries()).map(([id, m]) => ({
            id,
            invoiceId: m.invoiceId,
            idType: typeof id,
            searchedIdType: typeof modalId,
            idsMatch: id === modalId
          }))
        })
        const foundModal = currentModals.get(modalId)
        if (!foundModal) {
          console.error('[Alis.tsx] handleModalSave - XƏTA: Modal tapılmadı!', modalId)
          devLog('[Alis.tsx] handleModalSave - Mövcud modallar:', Array.from(currentModals.entries()).map(([id, m]) => ({ id, invoiceId: m.invoiceId })))
          resolve(undefined)
        } else {
          devLog('[Alis.tsx] handleModalSave - Modal tapıldı:', { id: foundModal.id, invoiceId: foundModal.invoiceId })
          // Modal-ı dərin kopyalayırıq və Promise-də qaytarırıq
          const modalCopy = JSON.parse(JSON.stringify(foundModal))
          devLog('[Alis.tsx] handleModalSave - Modal kopyalandı:', { id: modalCopy.id, invoiceId: modalCopy.invoiceId })
          resolve(modalCopy)
        }
        return currentModals // State-i dəyişdirmirik, sadəcə oxuyuruq
      })
    })
    
    // Promise-dən modal-ı alırıq
    const modal = await modalPromise
    devLog('[Alis.tsx] handleModalSave - Promise-dən modal alındı:', modal)
    
    if (!modal) {
      console.error('[Alis.tsx] handleModalSave - XƏTA: Modal tapılmadı, funksiya dayandırılır')
      return
    }
    
    devLog('[Alis.tsx] handleModalSave - Modal istifadəyə hazırdır:', { id: modal.id, invoiceId: modal.invoiceId })
    devLog('[Alis.tsx] handleModalSave - modalData:', modalData)
    devLog('[Alis.tsx] handleModalSave - modalData.invoiceItems:', modalData.invoiceItems)
    devLog('[Alis.tsx] handleModalSave - modalData.invoiceItems length:', modalData.invoiceItems?.length || 0)
    
    const validItems = modalData.invoiceItems.filter(item => item.product_id !== null)
    devLog('[Alis.tsx] handleModalSave - Valid items:', validItems.length)
    devLog('[Alis.tsx] handleModalSave - Valid items details:', validItems)
    devLog('[Alis.tsx] handleModalSave - All items:', modalData.invoiceItems.map(item => ({ product_id: item.product_id, product_name: item.product_name })))
    
    // Yadda saxla düyməsi üçün validasiya yoxdur - boş qaimə yarada bilər
    // Validasiya yalnız OK düyməsi üçün InvoiceModal komponentindədir

    try {
      const items = validItems.map(item => ({
        product_id: item.product_id!,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }))
      
      devLog('[Alis.tsx] handleModalSave - Items hazırlandı:', items)
      devLog('[Alis.tsx] handleModalSave - Modal invoiceId:', modal.invoiceId)

      if (modal.invoiceId) {
        // Mövcud qaimə - yenilə
        console.log('[Alis.tsx] ========== MÖVCUD QAIMƏ YENİLƏNİR ==========')
        console.log('[Alis.tsx] Mövcud qaimə yenilənir:', modal.invoiceId)
        console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.update')
        console.log('[Alis.tsx] Request data:', {
          supplier_id: modalData.selectedSupplierId || undefined,
          items,
          notes: modalData.notes || undefined,
        })
        
        const updateResult = await purchaseInvoicesAPI.update(modal.invoiceId.toString(), {
          supplier_id: modalData.selectedSupplierId || undefined,
          items,
          notes: modalData.notes || undefined,
        })
        
        console.log('[Alis.tsx] API cavabı (update):', updateResult)
        
        // Vəziyyəti dəyişdirmə - mövcud vəziyyəti saxla
        if (modal.isActive !== undefined) {
          console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.updateStatus')
          console.log('[Alis.tsx] Status update:', { id: modal.invoiceId, isActive: modal.isActive })
          const statusResult = await purchaseInvoicesAPI.updateStatus(modal.invoiceId.toString(), modal.isActive)
          console.log('[Alis.tsx] API cavabı (updateStatus):', statusResult)
        }
        console.log('[Alis.tsx] Qaimə yeniləndi')
        showNotification('Qaimə uğurla yeniləndi', 'success')
      } else {
        // Yeni qaimə - yarad, amma tesdiqsiz saxla
        console.log('[Alis.tsx] ========== YENİ QAIMƏ YARADILIR ==========')
        console.log('[Alis.tsx] Yeni qaimə yaradılır (təsdiqsiz)...')
        console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.create')
        console.log('[Alis.tsx] Request data:', {
          supplier_id: modalData.selectedSupplierId || undefined,
          items,
          notes: modalData.notes || undefined,
        })
        
        const newInvoice = await purchaseInvoicesAPI.create({
          supplier_id: modalData.selectedSupplierId || undefined,
          items,
          notes: modalData.notes || undefined,
        })
        
        console.log('[Alis.tsx] API cavabı (create):', newInvoice)
        console.log('[Alis.tsx] Yeni qaimə ID:', newInvoice.id)
        
        // Tesdiqsiz saxla (default olaraq tesdiqsizdir, amma açıq şəkildə təyin edək)
        if (newInvoice.id) {
          console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.updateStatus (false)')
          const statusResult = await purchaseInvoicesAPI.updateStatus(newInvoice.id.toString(), false)
          console.log('[Alis.tsx] API cavabı (updateStatus):', statusResult)
        }

        // Qaimə tarixini formatla (saat, dəqiqə, saniyə ilə)
        let invoiceDateStr = ''
        if (newInvoice.invoice_date) {
          const date = new Date(newInvoice.invoice_date)
          invoiceDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
        }

        // Modalı yenilə - qaimə nömrəsi və tarixi əlavə et
        setOpenModals(prev => {
          const newMap = new Map(prev)
          const currentModal = newMap.get(modalId)
          if (currentModal) {
            newMap.set(modalId, {
              ...currentModal,
              invoiceId: newInvoice.id,
              isActive: false,
              data: {
                ...currentModal.data,
                invoiceNumber: newInvoice.invoice_number || '',
                invoiceDate: invoiceDateStr
              }
            })
          }
          return newMap
        })

        console.log('[Alis.tsx] Yeni qaimə yaradıldı:', newInvoice.id)
        showNotification('Qaimə uğurla yaradıldı (təsdiqsiz)', 'success')
      }

      console.log('[Alis.tsx] ========== CƏDVƏL YENİLƏNİR ==========')
      console.log('[Alis.tsx] Cədvəl yenilənir (loadInvoices)...')
      await loadInvoices()
      console.log('[Alis.tsx] Cədvəl yeniləndi')
      devLog('[Alis.tsx] ========== handleModalSave TAMAMLANDI ==========')
    } catch (err: any) {
      console.error('[Alis.tsx] ========== XƏTA BAŞ VERDİ ==========')
      console.error('[Alis.tsx] Xəta:', err)
      console.error('[Alis.tsx] Xəta mesajı:', err.message)
      console.error('[Alis.tsx] Xəta response:', err.response)
      console.error('[Alis.tsx] Xəta response data:', err.response?.data)
      console.error('[Alis.tsx] Xəta response status:', err.response?.status)
      alert(err.response?.data?.message || 'Qaimə yadda saxlanılarkən xəta baş verdi')
      throw err // Xətanı yuxarı at ki, modal bağlanmasın
    }
  }, [showNotification, loadInvoices])

  const handleModalSaveAndConfirm = useCallback(async (modalId: string, modalData: ModalData['data']) => {
    console.log('[Alis.tsx] ========== handleModalSaveAndConfirm FUNKSİYASI ÇAĞIRILDI ==========')
    devLog('[Alis.tsx] handleModalSaveAndConfirm çağırıldı', { 
      modalId, 
      modalData,
      modalDataKeys: Object.keys(modalData),
      invoiceItemsCount: modalData.invoiceItems?.length || 0
    })
    
    // Promise istifadə edirik ki, callback-dəki modal-ı callback-dən sonra istifadə edə bilək
    const modalPromise = new Promise<ModalData | undefined>((resolve) => {
      setOpenModals(currentModals => {
        devLog('[Alis.tsx] handleModalSaveAndConfirm - setOpenModals callback çağırıldı')
        devLog('[Alis.tsx] handleModalSaveAndConfirm - openModals Map-dəki ID-lər:', Array.from(currentModals.keys()))
        devLog('[Alis.tsx] handleModalSaveAndConfirm - openModals Map ölçüsü:', currentModals.size)
        devLog('[Alis.tsx] handleModalSaveAndConfirm - Axtarılan modalId:', modalId)
        devLog('[Alis.tsx] handleModalSaveAndConfirm - Modal ID uyğunluğu:', {
          searchedId: modalId,
          mapKeys: Array.from(currentModals.keys()),
          exactMatch: currentModals.has(modalId),
          allEntries: Array.from(currentModals.entries()).map(([id, m]) => ({
            id,
            invoiceId: m.invoiceId,
            idType: typeof id,
            searchedIdType: typeof modalId,
            idsMatch: id === modalId
          }))
        })
        const foundModal = currentModals.get(modalId)
        if (!foundModal) {
          console.error('[Alis.tsx] handleModalSaveAndConfirm - XƏTA: Modal tapılmadı!', modalId)
          devLog('[Alis.tsx] handleModalSaveAndConfirm - Mövcud modallar:', Array.from(currentModals.entries()).map(([id, m]) => ({ id, invoiceId: m.invoiceId })))
          resolve(undefined)
        } else {
          devLog('[Alis.tsx] handleModalSaveAndConfirm - Modal tapıldı:', { id: foundModal.id, invoiceId: foundModal.invoiceId })
          // Modal-ı dərin kopyalayırıq və Promise-də qaytarırıq
          const modalCopy = JSON.parse(JSON.stringify(foundModal))
          devLog('[Alis.tsx] handleModalSaveAndConfirm - Modal kopyalandı:', { id: modalCopy.id, invoiceId: modalCopy.invoiceId })
          resolve(modalCopy)
        }
        return currentModals // State-i dəyişdirmirik, sadəcə oxuyuruq
      })
    })
    
    // Promise-dən modal-ı alırıq
    const modal = await modalPromise
    devLog('[Alis.tsx] handleModalSaveAndConfirm - Promise-dən modal alındı:', modal)
    
    if (!modal) {
      console.error('[Alis.tsx] handleModalSaveAndConfirm - XƏTA: Modal tapılmadı, funksiya dayandırılır')
      return
    }
    
    devLog('[Alis.tsx] handleModalSaveAndConfirm - Modal istifadəyə hazırdır:', { id: modal.id, invoiceId: modal.invoiceId })
    devLog('[Alis.tsx] handleModalSaveAndConfirm - modalData:', modalData)
    devLog('[Alis.tsx] handleModalSaveAndConfirm - modalData.invoiceItems:', modalData.invoiceItems)
    devLog('[Alis.tsx] handleModalSaveAndConfirm - modalData.invoiceItems length:', modalData.invoiceItems?.length || 0)
    
    const validItems = modalData.invoiceItems.filter(item => item.product_id !== null)
    devLog('[Alis.tsx] handleModalSaveAndConfirm - Valid items:', validItems.length)
    devLog('[Alis.tsx] handleModalSaveAndConfirm - Valid items details:', validItems)
    devLog('[Alis.tsx] handleModalSaveAndConfirm - All items:', modalData.invoiceItems.map(item => ({ product_id: item.product_id, product_name: item.product_name })))
    
    if (validItems.length === 0) {
      console.log('[Alis.tsx] Validasiya xətası: məhsul seçilməyib')
      showNotification('Ən azı bir məhsul seçilməlidir', 'warning')
      return
    }

    try {
      const items = validItems.map(item => ({
        product_id: item.product_id!,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }))
      
      devLog('[Alis.tsx] handleModalSaveAndConfirm - Items hazırlandı:', items)
      devLog('[Alis.tsx] handleModalSaveAndConfirm - Modal invoiceId:', modal.invoiceId)

      if (modal.invoiceId) {
        // Mövcud qaimə - yenilə və təsdiqlə
        console.log('[Alis.tsx] ========== MÖVCUD QAIMƏ YENİLƏNİR VƏ TƏSDİQLƏNİR ==========')
        console.log('[Alis.tsx] Mövcud qaimə yenilənir və təsdiqlənir:', modal.invoiceId)
        console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.update')
        console.log('[Alis.tsx] Request data:', {
          supplier_id: modalData.selectedSupplierId || undefined,
          items,
          notes: modalData.notes || undefined,
        })
        
        const updateResult = await purchaseInvoicesAPI.update(modal.invoiceId.toString(), {
          supplier_id: modalData.selectedSupplierId || undefined,
          items,
          notes: modalData.notes || undefined,
        })
        
        console.log('[Alis.tsx] API cavabı (update):', updateResult)
        
        // Təsdiqlə
        console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.updateStatus (true)')
        const statusResult = await purchaseInvoicesAPI.updateStatus(modal.invoiceId.toString(), true)
        console.log('[Alis.tsx] API cavabı (updateStatus):', statusResult)
        
        console.log('[Alis.tsx] Qaimə yeniləndi və təsdiq edildi')
        showNotification('Qaimə uğurla yeniləndi və təsdiq edildi', 'success')
      } else {
        // Yeni qaimə - yarad və təsdiqlə
        console.log('[Alis.tsx] ========== YENİ QAIMƏ YARADILIR VƏ TƏSDİQLƏNİR ==========')
        console.log('[Alis.tsx] Yeni qaimə yaradılır və təsdiqlənir...')
        console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.create')
        console.log('[Alis.tsx] Request data:', {
          supplier_id: modalData.selectedSupplierId || undefined,
          items,
          notes: modalData.notes || undefined,
        })
        
        const newInvoice = await purchaseInvoicesAPI.create({
          supplier_id: modalData.selectedSupplierId || undefined,
          items,
          notes: modalData.notes || undefined,
        })
        
        console.log('[Alis.tsx] API cavabı (create):', newInvoice)
        console.log('[Alis.tsx] Yeni qaimə ID:', newInvoice.id)
        
        // Təsdiqlə
        if (newInvoice.id) {
          console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.updateStatus (true)')
          const statusResult = await purchaseInvoicesAPI.updateStatus(newInvoice.id.toString(), true)
          console.log('[Alis.tsx] API cavabı (updateStatus):', statusResult)
        }

        // Qaimə tarixini formatla (saat, dəqiqə, saniyə ilə)
        let invoiceDateStr = ''
        if (newInvoice.invoice_date) {
          const date = new Date(newInvoice.invoice_date)
          invoiceDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
        }

        // Modalı yenilə - qaimə nömrəsi və tarixi əlavə et
        setOpenModals(prev => {
          const newMap = new Map(prev)
          const currentModal = newMap.get(modalId)
          if (currentModal) {
            newMap.set(modalId, {
              ...currentModal,
              invoiceId: newInvoice.id,
              isActive: true,
              data: {
                ...currentModal.data,
                invoiceNumber: newInvoice.invoice_number || '',
                invoiceDate: invoiceDateStr
              }
            })
          }
          return newMap
        })

        console.log('[Alis.tsx] Yeni qaimə yaradıldı və təsdiq edildi:', newInvoice.id)
        showNotification('Qaimə uğurla yaradıldı və təsdiq edildi', 'success')
      }

      console.log('[Alis.tsx] ========== CƏDVƏL YENİLƏNİR ==========')
      console.log('[Alis.tsx] Cədvəl yenilənir (loadInvoices)...')
      await loadInvoices()
      console.log('[Alis.tsx] Cədvəl yeniləndi')
      devLog('[Alis.tsx] ========== handleModalSaveAndConfirm TAMAMLANDI ==========')
    } catch (err: any) {
      console.error('[Alis.tsx] ========== XƏTA BAŞ VERDİ ==========')
      console.error('[Alis.tsx] Xəta:', err)
      console.error('[Alis.tsx] Xəta mesajı:', err.message)
      console.error('[Alis.tsx] Xəta response:', err.response)
      console.error('[Alis.tsx] Xəta response data:', err.response?.data)
      console.error('[Alis.tsx] Xəta response status:', err.response?.status)
      alert(err.response?.data?.message || 'Qaimə yadda saxlanılarkən xəta baş verdi')
      throw err // Xətanı yuxarı at ki, modal bağlanmasın
    }
  }, [showNotification, loadInvoices])


  const handlePrint = async () => {
    // Seçilmiş sənədləri al
    const invoicesToPrint = selectedInvoiceIds.length > 0
      ? invoices.filter(inv => selectedInvoiceIds.includes(inv.id))
      : []

    if (invoicesToPrint.length === 0) {
      alert('Çap üçün sənəd seçilməyib')
      return
    }

    // Hər sənədi tam məlumatla yüklə
    const fullInvoices = await Promise.all(
      invoicesToPrint.map(async (inv) => {
        try {
          const fullInvoice = await purchaseInvoicesAPI.getById(inv.id.toString())
          return fullInvoice
        } catch (err) {
          console.error(`Sənəd ${inv.id} yüklənərkən xəta:`, err)
          return inv
        }
      })
    )

    // Sənədləri çap et
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      let htmlContent = `
        <html>
          <head>
            <title>Alış Qaimələri</title>
            <style>
              @media print {
                .invoice-break { page-break-after: always; }
              }
              body { font-family: Arial, sans-serif; padding: 20px; }
              .invoice { margin-bottom: 40px; border: 1px solid #ddd; padding: 20px; }
              .invoice-header { text-align: center; margin-bottom: 20px; }
              .invoice-header h2 { margin: 0; }
              .invoice-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .invoice-info div { flex: 1; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .total-row { font-weight: bold; background-color: #f9f9f9; }
              .text-right { text-align: right; }
            </style>
          </head>
          <body>
      `

      fullInvoices.forEach((invoice: PurchaseInvoice, index: number) => {
        const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('az-AZ') : '-'
        const items = invoice.purchase_invoice_items || []
        const totalAmount = invoice.total_amount ? Number(invoice.total_amount) : 0

        htmlContent += `
          <div class="invoice ${index < fullInvoices.length - 1 ? 'invoice-break' : ''}">
            <div class="invoice-header">
              <h2>ALIŞ QAIMƏSİ</h2>
            </div>
            <div class="invoice-info">
              <div>
                <p><strong>Faktura №:</strong> ${invoice.invoice_number || ''}</p>
                <p><strong>Tarix:</strong> ${invoiceDate}</p>
              </div>
              <div>
                <p><strong>Təchizatçı:</strong> ${invoice.suppliers?.name || '-'}</p>
                ${invoice.suppliers?.phone ? `<p><strong>Telefon:</strong> ${invoice.suppliers.phone}</p>` : ''}
                ${invoice.suppliers?.address ? `<p><strong>Ünvan:</strong> ${invoice.suppliers.address}</p>` : ''}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>№</th>
                  <th>Məhsul</th>
                  <th class="text-right">Miqdar</th>
                  <th class="text-right">Vahid qiymət</th>
                  <th class="text-right">Cəmi</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any, idx: number) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${item.products?.name || 'Naməlum məhsul'}</td>
                    <td class="text-right">${Number(item.quantity).toFixed(2)}</td>
                    <td class="text-right">${Number(item.unit_price).toFixed(2)} ₼</td>
                    <td class="text-right">${Number(item.total_price).toFixed(2)} ₼</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="4" class="text-right"><strong>Ümumi məbləğ:</strong></td>
                  <td class="text-right"><strong>${totalAmount.toFixed(2)} ₼</strong></td>
                </tr>
              </tfoot>
            </table>
            ${invoice.notes ? `<p style="margin-top: 20px;"><strong>Qeydlər:</strong> ${invoice.notes}</p>` : ''}
          </div>
        `
      })

      htmlContent += `
          </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // DataTable üçün məlumatları formatla
  const tableData = filteredInvoices.map(invoice => ({
    ...invoice,
    is_active_status: invoice.is_active ? '✓' : '',
    supplier_name: invoice.suppliers?.name || '-',
    invoice_date: invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('az-AZ') : '-',
    total_amount: invoice.total_amount ? `${Number(invoice.total_amount).toFixed(2)} ₼` : '0.00 ₼',
    created_at: invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('az-AZ') : '-',
  }))

  return (
    <div>
      <style>{notificationStyles}</style>
      {/* Notification Container */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
      }}>
        {notifications.map((notification) => {
          const bgColor = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
          }[notification.type]

          const textColor = notification.type === 'warning' ? '#000' : '#fff'

          return (
            <div
              key={notification.id}
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              style={{
                background: bgColor,
                color: textColor,
                padding: '12px 20px',
                borderRadius: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                pointerEvents: 'auto',
                minWidth: '300px',
                maxWidth: '500px',
                animation: 'slideUp 0.3s ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <span style={{ flex: 1 }}>{notification.message}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setNotifications(prev => prev.filter(n => n.id !== notification.id))
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: textColor,
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0',
                  lineHeight: '1',
                  opacity: 0.8
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
      <DataTable
        pageId="alis-qaimeleri"
        columns={defaultColumns}
        data={tableData}
        loading={loading}
        error={error}
        title=""
        getRowId={(row) => row.id}
        defaultColumns={defaultColumns}
        toolbarActions={{
          onSettings: () => { },
          onEdit: handleEdit,
          onDelete: handleDelete,
          onCopy: handleCopy,
          onPrint: handlePrint,
        }}
        contextMenuActions={{
          onSettings: () => { },
          onEdit: handleEdit,
          onDelete: handleDelete,
          onCopy: handleCopy,
          onPrint: handlePrint,
          onActivate: async (selectedIds: (number | string)[]) => {
            if (selectedIds.length === 0) {
              alert('Qaimə seçilməyib')
              return
            }
            try {
              await Promise.all(selectedIds.map(id => purchaseInvoicesAPI.updateStatus(id.toString(), true)))
              await loadInvoices()
              setSelectedInvoiceIds([])
              alert('Qaimələr təsdiq edildi')
            } catch (err: any) {
              alert(err.response?.data?.message || 'Xəta baş verdi')
            }
          },
          onDeactivate: async (selectedIds: (number | string)[]) => {
            if (selectedIds.length === 0) {
              alert('Qaimə seçilməyib')
              return
            }
            try {
              await Promise.all(selectedIds.map(id => purchaseInvoicesAPI.updateStatus(id.toString(), false)))
              await loadInvoices()
              setSelectedInvoiceIds([])
              alert('Qaimələr təsdiq edilmədi')
            } catch (err: any) {
              alert(err.response?.data?.message || 'Xəta baş verdi')
            }
          },
        }}
        onSearch={handleSearch}
        onRowSelect={setSelectedInvoiceIds}
        onRowClick={(_row, id) => {
          // Dubl klik zamanı sənədi aç
          handleEdit([id])
        }}
        rightToolbarItems={[
          <button
            key="activate"
            onClick={async () => {
              if (selectedInvoiceIds.length === 0) {
                alert('Qaimə seçilməyib')
                return
              }
              try {
                await Promise.all(selectedInvoiceIds.map(id => purchaseInvoicesAPI.updateStatus(id.toString(), true)))
                await loadInvoices()
                setSelectedInvoiceIds([])
              } catch (err: any) {
                alert(err.response?.data?.message || 'Xəta baş verdi')
              }
            }}
            style={{
              padding: '0.5rem 1rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
            title="Aktiv et"
          >
            <span style={{ position: 'relative', display: 'inline-block', fontSize: '1.2rem', marginRight: '0.5rem' }}>
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
            Aktiv et
          </button>,
          <button
            key="deactivate"
            onClick={async () => {
              if (selectedInvoiceIds.length === 0) {
                alert('Qaimə seçilməyib')
                return
              }
              try {
                await Promise.all(selectedInvoiceIds.map(id => purchaseInvoicesAPI.updateStatus(id.toString(), false)))
                await loadInvoices()
                setSelectedInvoiceIds([])
              } catch (err: any) {
                alert(err.response?.data?.message || 'Xəta baş verdi')
              }
            }}
            style={{
              padding: '0.5rem 1rem',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
            title="Deaktiv et"
          >
            <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>📄</span>
            Deaktiv et
          </button>
        ]}
        leftToolbarItems={[
          <button
            key="refresh"
            onClick={loadInvoices}
            style={{
              padding: '0.5rem 1rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🔄 Yenilə
          </button>,
          <button
            key="add"
            onClick={() => openModalForInvoice(null)}
            style={{
              padding: '0.5rem 1rem',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            ➕ Yeni qaimə
          </button>
        ]}
      />


      {/* Çoxlu Purchase Invoice Modalları - REMOVED (Handled by UniversalWindow) */}
    </div>
  )
}
