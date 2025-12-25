import { useState, useEffect, useCallback, useRef } from 'react'
import AdvancedFilterModal, { FilterRule, FilterComponentConfig } from '../../components/AdvancedFilterModal'
import Layout from '../../components/Layout'

import UniversalContainer from '../../components/UniversalContainer'
import UniversalToolBar from '../../components/UniversalToolBar'
import UniversalTable, { ColumnConfig, UniversalTableRef } from '../../components/UniversalTable'
import UniversalFooter from '../../components/UniversalFooter'
import InvoiceModal, { type ModalData, type InvoiceItem } from '../../components/InvoiceModal'
import { ordersAPI, customersAPI, warehousesAPI } from '../../services/api'
import type { SaleInvoice, Product, Customer, WarehouseLocation } from '@shared/types'
import { useWindowStore } from '../../store/windowStore'
import { logActivity } from '../../store/logStore'

import { useNotificationStore } from '../../store/notificationStore'
import { ConfirmWindow } from '../../components/ConfirmWindow'

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




const FILTER_COMPONENTS: FilterComponentConfig[] = [
  { id: 'invoice_number', label: '№', type: 'text' },
  { id: 'customer_id', label: 'Müştəri', type: 'partner', partnerType: 'BUYER' },
  { id: 'invoice_date', label: 'Tarix', type: 'date' },
  { id: 'total_amount', label: 'Məbləğ', type: 'number' },
  { id: 'notes', label: 'Qeydlər', type: 'text' },
  { id: 'product', label: 'Məhsul', type: 'product' }
]

const defaultColumns: ColumnConfig[] = [

  {
    id: 'is_active_status',
    label: '',
    visible: true,
    width: 50,
    order: 1,
    sortable: false,
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
  {
    id: 'row_index',
    label: '№',
    visible: true,
    width: 60,
    order: 2,
    sortable: false,
    render: (_: any, __: any, index: number) => index + 1
  },
  { id: 'invoice_number', label: 'Faktura №', visible: true, width: 140, order: 3 },
  { id: 'customers', label: 'Müştəri', visible: true, width: 220, order: 3, render: (value: any) => value?.name || '-' },
  { id: 'invoice_date', label: 'Tarix', visible: true, width: 180, order: 4 },
  { id: 'payment_date', label: 'Son ödəniş tarixi', visible: true, width: 180, order: 5 },
  { id: 'total_amount', label: 'Ümumi məbləğ', visible: true, width: 150, order: 6, align: 'right' },
  { id: 'notes', label: 'Qeydlər', visible: true, width: 250, order: 7 },
  { id: 'created_at', label: 'Yaradılma tarixi', visible: true, width: 180, order: 8 },
]


// Content component (The actual window content)
export function SatisQaimeleriContent() {
  const [invoices, setInvoices] = useState<SaleInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredInvoices, setFilteredInvoices] = useState<SaleInvoice[]>([]) // Deprecated but kept for type compatibility if needed
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<(number | string)[]>([])
  const [appliedFilters, setAppliedFilters] = useState<FilterRule[]>([])

  // Pagination State
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(50)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  // Global notification store
  const { addNotification } = useNotificationStore()

  // Bildiriş göstər helper (backward compatibility)
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    addNotification(
      type,
      type === 'error' ? 'Xəta' : (type === 'success' ? 'Uğurlu' : 'Məlumat'),
      message
    )
  }, [addNotification])

  // Çoxlu modal state - Windows benzeri sistem
  const [openModals, setOpenModals] = useState<Map<string, ModalData>>(new Map())
  const openModalsRef = useRef<Map<string, ModalData>>(new Map())
  const initialDataMap = useRef<Map<string, any>>(new Map()) // İlkin datanı saxlamaq üçün
  const [activeModalId, setActiveModalId] = useState<string | null>(null)
  const [baseZIndex, setBaseZIndex] = useState(1000)
  const tableRef = useRef<UniversalTableRef>(null) // Table settings üçün

  // Təsdiq dialoqu üçün state
  const [confirmDialog, setConfirmDialog] = useState<{ modalId: string; currentModal: ModalData } | null>(null)

  // openModals state-i dəyişdikdə ref-i yenilə
  useEffect(() => {
    openModalsRef.current = openModals
  }, [openModals])

  // Global window store actions (selectors to prevent re-renders)
  const addWindow = useWindowStore(state => state.addWindow)
  const removeWindow = useWindowStore(state => state.removeWindow)
  const updateWindow = useWindowStore(state => state.updateWindow)

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([])
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



  const handleDiscard = useCallback((modalId: string) => {
    // Dəyişikliyi ləğv etmək (pəncərəni bağlamaq) üçün dirty check-i bypass etmək lazımdır
    const currentModal = openModalsRef.current.get(modalId)
    if (currentModal) {
      initialDataMap.current.set(modalId, JSON.parse(JSON.stringify(currentModal.data)))
    }

    // Təsdiq pəncərəsini bağla
    useWindowStore.getState().closeWindow('confirm-dialog-' + modalId)

    // Modalı sil (local state və store)
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
    useWindowStore.getState().closeWindow(windowId)
  }, [activeModalId])

  const handleModalBeforeClose = useCallback((modalId: string): boolean => {
    const currentModal = openModalsRef.current.get(modalId)
    const initialData = initialDataMap.current.get(modalId)

    console.log(`[DEBUG] Check before close for ${modalId}`)
    console.log('[DEBUG] Current Data:', currentModal?.data)
    console.log('[DEBUG] Initial Data:', initialData)

    if (!currentModal || !initialData) {
      console.log('[DEBUG] Missing modal or initial data, closing allowed')
      return true
    }

    const isDirty = JSON.stringify(currentModal.data) !== JSON.stringify(initialData)
    console.log(`[DEBUG] Is Dirty: ${isDirty}`)

    if (isDirty) {
      logActivity(
        'invoice',
        'Qaimə bağlandı (yadda saxlanmadan)',
        `Qaimə ${currentModal.data?.invoiceNumber ? currentModal.data.invoiceNumber : (currentModal.invoiceId ? '#' + currentModal.invoiceId : '(yeni)')} saxlanmadan bağlandı - təsdiq dialoqu göstərildi`,
        'warning',
        { modalId, invoiceId: currentModal.invoiceId, invoiceNumber: currentModal.data?.invoiceNumber }
      )

      // Təsdiq dialogunu göstər (React state ilə, UniversalWindow-suz)
      setConfirmDialog({ modalId, currentModal })
      return false // Stop closure
    }

    return true
  }, [])

  const handleModalClose = useCallback((modalId: string, force?: boolean) => {
    // Yadda saxlanmamış dəyişiklikləri yoxla (əgər məcburi bağlanmırsa)
    if (!force && !handleModalBeforeClose(modalId)) {
      return
    }

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
  }, [activeModalId, removeWindow, handleModalBeforeClose])

  const handleModalActivate = useCallback((modalId: string) => {
    const newZIndex = baseZIndex + 1
    setBaseZIndex(newZIndex)
    setActiveModalId(modalId)
    setOpenModals(prev => {
      const newMap = new Map(prev)
      const currentModal = newMap.get(modalId)
      if (currentModal) {
        newMap.set(modalId, { ...currentModal }) // zIndex artıq store tərəfindən idarə olunur
      }
      return newMap
    })
    const windowId = `purchase-invoice-modal-${modalId}`
    useWindowStore.getState().activateWindow(windowId) // updateWindow əvəzinə birbaşa activateWindow
  }, [baseZIndex])

  const handleModalPrint = useCallback(async (modalId: string, _modalData: ModalData['data']) => {
    const modal = openModals.get(modalId)
    if (!modal || !modal.invoiceId) {
      showNotification('Yalnız mövcud qaimələr çap edilə bilər', 'warning')
      return
    }

    try {
      const fullInvoice = await ordersAPI.getById(modal.invoiceId.toString())
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const invoiceDate = fullInvoice.invoice_date ? new Date(fullInvoice.invoice_date).toLocaleDateString('az-AZ') : '-'
        const items = fullInvoice.sale_invoice_items || []
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
                    <p><strong>Müştəri:</strong> ${fullInvoice.customers?.name || '-'}</p>
                    ${fullInvoice.customers?.phone ? `<p><strong>Telefon:</strong> ${fullInvoice.customers.phone}</p>` : ''}
                    ${fullInvoice.customers?.address ? `<p><strong>Ünvan:</strong> ${fullInvoice.customers.address}</p>` : ''}
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
      showNotification(err.response?.data?.message || 'Qaimə çap edilərkən xəta baş verdi', 'error')
    }
  }, [openModals])

  // loadInvoices funksiyasını useEffect-dən əvvəl təyin et (handleModalSave-dən əvvəl lazımdır)
  // Sort state
  const [sortConfig, setSortConfig] = useState<{ column: string, direction: 'asc' | 'desc' } | null>(null)

  const isFetchingMoreRef = useRef(false)

  // loadInvoices function
  const loadInvoices = useCallback(async (pageToLoad = 1, isReset = false) => {
    // Prevent potential race conditions or duplicate calls
    if (!isReset && pageToLoad > 1 && isFetchingMoreRef.current) return

    try {
      if (isReset || pageToLoad === 1) {
        setLoading(true)
      } else {
        setIsFetchingMore(true)
        isFetchingMoreRef.current = true
      }

      const params: any = {
        page: pageToLoad,
        limit: pageSize,
        search: searchTerm
      }

      if (sortConfig) {
        params.sort_by = sortConfig.column
        params.order = sortConfig.direction
      }

      const data = await ordersAPI.getAll(params)

      if (data && data.pagination) {
        // New paginated response
        if (isReset || pageToLoad === 1) {
          setInvoices(data.data)
        } else {
          setInvoices(prev => {
            // Deduplicate just in case
            // Use Map for faster lookup if list is huge, but array is fine for 100s
            const existingIds = new Set(prev.map((inv: any) => inv.id));
            const newInvoices = data.data.filter((inv: any) => !existingIds.has(inv.id))
            return [...prev, ...newInvoices]
          })
        }
        setTotal(data.pagination.total)
        // setPage(data.pagination.page) // Managed by local state usually
      } else if (Array.isArray(data)) {
        // Fallback for legacy array response
        setInvoices(data)
        setTotal(data.length)
      }

      // Update filtered invoices logic - direct map for now, as server handles filtering
      // We will update filteredInvoices in useEffect or here directly
    } catch (err: any) {
      console.error('Qaimələr yüklənərkən xəta:', err)
      addNotification(
        'error',
        'Xəta',
        err.response?.data?.message || 'Qaimələr yüklənərkən xəta baş verdi'
      )
    } finally {
      setLoading(false)
      setIsFetchingMore(false)
      isFetchingMoreRef.current = false
    }
  }, [addNotification, pageSize, searchTerm, sortConfig]) // Removed isFetchingMore dependency

  // Handle server-side sort
  const handleSort = useCallback((column: string, direction: 'asc' | 'desc') => {
    setSortConfig({ column, direction })
    // loadInvoices will be triggered by useEffect because sortConfig changed
    // Wait, loadInvoices is in dependency of useEffect? No.
    // We need a separate useEffect for sort?
    // Or simply call loadInvoices directly here?
    // If we call directly, we might race with state update if loadInvoices depends on sortConfig state.
    // But loadInvoices is a callback dependent on sortConfig.
    // So if sortConfig changes, loadInvoices changes.
    // We should use a useEffect to trigger reload when sortConfig changes.
  }, [])

  // Effect to reload when sort changes
  useEffect(() => {
    if (sortConfig) {
      loadInvoices(1, true)
    }
  }, [sortConfig, loadInvoices])


  // Handle Scroll for Infinite Loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    // Trigger when close to bottom (e.g., 200px)
    if (scrollHeight - scrollTop - clientHeight < 200 && !loading && !isFetchingMore && invoices.length < total) {
      loadInvoices(page + 1)
      setPage(prev => prev + 1)
    }
  }

  const handleJumpToStart = () => {
    loadInvoices(1, true)
    setPage(1)
  }

  const handleJumpToEnd = () => {
    const lastPage = Math.ceil(total / pageSize)
    if (lastPage > 1) {
      loadInvoices(lastPage, true)
      setPage(lastPage)
    }
  }

  // Pəncərələri izlə və global store-a əlavə et
  useEffect(() => {
    // Qaimə modalları - global store-a əlavə et
    // Qaimə modalları - global store-a əlavə et
    // devLog removed to reduce noise

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
    Array.from(openModals.values()).forEach((modal) => {
      const windowId = `purchase-invoice-modal-${modal.id}`
      const store = useWindowStore.getState()
      const existingWindow = store.windows.get(windowId)

      // devLog removed

      if (!existingWindow) {

        addWindow({
          id: windowId,
          title: modal.data.invoiceNumber || (modal.invoiceId ? `Qaimə #${modal.invoiceId}` : 'Yeni Satış Qaiməsi'),
          type: 'modal',
          modalType: 'invoice-edit',
          pageId: 'purchase-invoice-modal',
          isVisible: true,
          isMinimized: false,
          // zIndex: modal.zIndex, // Store tərəfindən idarə olunur
          position: modal.position,
          size: modal.size,
          isMaximized: modal.isMaximized,
          onBeforeClose: () => handleModalBeforeClose(modal.id),
          content: (
            <InvoiceModal
              modal={modal}
              customers={customers}
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
              activeConfirmDialog={confirmDialog?.modalId === modal.id ? {
                isOpen: true,
                modalZIndex: 1000,
                onConfirm: async () => {
                  if (!confirmDialog) return
                  try {
                    await handleModalSave(confirmDialog.modalId, confirmDialog.currentModal.data)
                    initialDataMap.current.set(confirmDialog.modalId, JSON.parse(JSON.stringify(confirmDialog.currentModal.data)))
                    setConfirmDialog(null)
                    const wId = `purchase-invoice-modal-${confirmDialog.modalId}`
                    useWindowStore.getState().closeWindow(wId)
                  } catch (e) {
                    console.error(e)
                  }
                },
                onDiscard: async () => {
                  if (!confirmDialog) return
                  setConfirmDialog(null)
                  handleDiscard(confirmDialog.modalId)
                },
                onCancel: () => setConfirmDialog(null)
              } : undefined}
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

        /* setTimeout(() => {
          const checkStore = useWindowStore.getState()
          const createdWindow = checkStore.windows.get(windowId)
           devLog removed
        }, 100) */
      } else {
        const storeWindow = existingWindow
        const storeIsMinimized = storeWindow.isMinimized || false



        // devLog removed

        const currentTitle = modal.data.invoiceNumber || (modal.invoiceId ? `Qaimə #${modal.invoiceId}` : 'Yeni Satış Qaiməsi')

        // Dirty check LƏĞV EDİLDİ: ConfirmDialog və digər daxili state dəyişikliklərinin (məs: activeConfirmDialog) 
        // prop kimi InvoiceModal-a ötürülməsi üçün updateWindow hər zaman çağırılmalıdır.
        // if (storeWindow.title !== currentTitle || storeWindow.isMinimized !== storeIsMinimized || !storeWindow.isVisible) {
        updateWindow(windowId, {
          isVisible: true,
          isMinimized: storeIsMinimized,
          title: currentTitle,
          onBeforeClose: () => handleModalBeforeClose(modal.id),
          content: (
            <InvoiceModal
              modal={modal}
              customers={customers}
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
              activeConfirmDialog={confirmDialog?.modalId === modal.id ? {
                isOpen: true,
                modalZIndex: 1000,
                onConfirm: async () => {
                  if (!confirmDialog) return
                  try {
                    await handleModalSave(confirmDialog.modalId, confirmDialog.currentModal.data)
                    initialDataMap.current.set(confirmDialog.modalId, JSON.parse(JSON.stringify(confirmDialog.currentModal.data)))
                    setConfirmDialog(null)
                    const wId = `purchase-invoice-modal-${confirmDialog.modalId}`
                    useWindowStore.getState().closeWindow(wId)
                  } catch (e) {
                    console.error(e)
                  }
                },
                onDiscard: async () => {
                  if (!confirmDialog) return
                  setConfirmDialog(null)
                  handleDiscard(confirmDialog.modalId)
                },
                onCancel: () => setConfirmDialog(null)
              } : undefined}
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
  }, [openModals, activeModalId, showSupplierModal, showProductModal, showItemSettingsModal, customers, products, warehouses, handleModalClose, handleModalUpdate, handleModalActivate, handleModalPrint, confirmDialog])

  // Load saved filters on mount
  useEffect(() => {
    try {
      const savedRules = localStorage.getItem('filter-applied-filter-satis')
      if (savedRules) {
        setAppliedFilters(JSON.parse(savedRules))
      }
    } catch (e) {
      console.error('Failed to load saved filters', e)
    }
  }, []) // Run once on mount

  useEffect(() => {
    loadInvoices()
    loadCustomers()
    loadProducts()
    loadWarehouses()
  }, [])

  useEffect(() => {
    filterInvoices()
  }, [searchTerm, invoices, appliedFilters])

  const loadCustomers = async () => {
    try {
      const data = await customersAPI.getAll()
      setCustomers(data)
    } catch (err: any) {
      console.error('Müştərilər yüklənərkən xəta:', err)
    }
  }

  const loadProducts = async () => {
    try {
      // OPTIMIZATION: Don't load all products. InvoiceModal handles async search & caching.
      // const data = await productsAPI.getAll()
      setProducts([])
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
    // Server-side filtering is used, so valid data is always in 'invoices'.
    // Just sync filteredInvoices with invoices.
    setFilteredInvoices(invoices)
  }

  // Debounced server-side search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') { // Optional: prevent check on initial mount if desired, but consistent state is better
        loadInvoices(1, true)
      } else {
        loadInvoices(1, true) // Reset
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm]) // Don't include loadInvoices to avoid loop if it changes often

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  // Çoxlu modal açmaq üçün funksiya
  const openModalForInvoice = async (invoiceId: number | null = null, initialData: ModalData['data'] | null = null) => {
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

          if (!windowInfo) {
            console.warn('[Alis.tsx] Modal openModals-da var amma windowStore-da yoxdur (phantom). Təmizlənir...', existingModal.id)
            // Phantom modal - təmizlə və yenidən açmağa icazə ver
            setOpenModals(prev => {
              const newMap = new Map(prev)
              newMap.delete(existingModal.id)
              return newMap
            })
            // Return etmə - funksiya davam edəcək və yeni modal yaradacaq
          } else {
            // Normal hal - pəncərə var, aktiv et
            if (windowInfo.isMinimized) {
              store.restoreWindow(windowId)
            }
            store.activateWindow(windowId)
            setActiveModalId(existingModal.id)
            showNotification('Qaimə artıq açıqdır', 'info')
            return
          }
        }
      }

      // Load invoice data FIRST if editing
      let fullInvoice: SaleInvoice | null = null
      if (invoiceId) {
        fullInvoice = await ordersAPI.getById(invoiceId.toString())
      }

      // Eyni invoice üçün eyni modal ID istifadə et (fokuslanma üçün)
      const modalId = invoiceId ? `modal-${invoiceId}` : `modal-new-${Date.now()}`

      // Saxlanılan ayarları yüklə
      let savedPrefs: any = null
      try {
        const stored = localStorage.getItem('window-pref-sale-invoice-modal')
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

      // Modalı həmişə mərkəzdə aç
      const positionX = Math.max(0, (screenWidth - modalWidth) / 2)
      const positionY = Math.max(0, (screenHeight - modalHeight) / 2)

      // Invoice date formatla - saat, dəqiqə, saniyə ilə
      let invoiceDateStr = ''
      if (fullInvoice?.invoice_date) {
        const date = new Date(fullInvoice.invoice_date)
        invoiceDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
      } else if (!invoiceId) {
        const date = new Date()
        invoiceDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
      }

      // Invoice items formatla
      const invoiceItemsData = fullInvoice ? (fullInvoice.sale_invoice_items || []) : []
      const items: InvoiceItem[] = invoiceItemsData.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.products?.name || 'Naməlum məhsul',
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
        discount_manual: Number(item.discount_manual || 0),
        discount_auto: Number(item.discount_auto || 0),
        vat_rate: Number(item.vat_rate || 0),
        searchTerm: item.products?.name || 'Naməlum məhsul'
      }))

      const newZIndex = baseZIndex + 1

      // Create modal with loaded data
      const newModal: ModalData = {
        id: modalId,
        invoiceId: invoiceId,
        position: {
          x: positionX,
          y: positionY
        },
        size: {
          width: modalWidth,
          height: modalHeight
        },
        isMaximized: savedPrefs?.isMaximized || false,
        zIndex: newZIndex,
        invoiceType: 'sale',
        isActive: fullInvoice ? (fullInvoice.is_active ?? false) : undefined,
        data: initialData || {
          selectedCustomerId: fullInvoice?.customer_id || null,
          selectedCustomer: fullInvoice?.customers || null,
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
      // Initial datanı saxla
      const initialSnapshot = JSON.parse(JSON.stringify(newModal.data))
      initialDataMap.current.set(modalId, initialSnapshot)
      console.log(`[DEBUG] Initial data set for ${modalId}`, initialSnapshot)

      setActiveModalId(modalId)
      devLog('[Alis.tsx] openModalForInvoice - Modal yaradıldı və state yeniləndi:', modalId)

      // Log invoice open
      logActivity(
        'invoice',
        invoiceId ? 'Qaimə redaktə edildi' : 'Yeni qaimə açıldı',
        invoiceId
          ? `Qaimə ${fullInvoice?.invoice_number || ('#' + invoiceId)} redaktə üçün açıldı (${items.length} məhsul)`
          : `Yeni satış qaiməsi yaradıldı`,
        'info',
        { invoiceId, itemCount: items.length, customerId: fullInvoice?.customer_id, invoiceNumber: fullInvoice?.invoice_number }
      )

      // Window useEffect-də avtomatik yaradılacaq
    } catch (err: any) {
      console.error('Modal açılarkən xəta:', err)
      showNotification('Modal açılarkən xəta baş verdi', 'error')
    }
  }

  const handleEdit = async (selectedIds: (number | string)[]) => {
    if (selectedIds.length === 1) {
      const invoiceId = parseInt(selectedIds[0].toString())
      await openModalForInvoice(invoiceId)
    }
  }

  const handleDelete = async (selectedIds: (number | string)[]) => {
    addWindow({
      id: 'delete-confirmation',
      title: 'Təsdiq',
      type: 'modal',
      position: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 100 },
      size: { width: 400, height: 200 },
      isMinimized: false,
      isMaximized: false,
      zIndex: 9999,
      normalState: null,
      content: (
        <ConfirmWindow
          message={`${selectedIds.length} qaimə silinsin?`}
          onConfirm={async () => {
            try {
              await Promise.all(selectedIds.map(async (id) => {
                const invoice = invoices.find(inv => inv.id === id)
                await ordersAPI.delete(id.toString())
                if (invoice) {
                  addNotification('success', 'Uğurlu', `${invoice.invoice_number} nömrəli qaimə silindi`)
                }
              }))
              await loadInvoices(1, true) // Reload list
              useWindowStore.getState().closeWindow('delete-confirmation')
              setSelectedInvoiceIds([]) // Clear selection
            } catch (err: any) {
              showNotification(err.response?.data?.message || 'Silinərkən xəta baş verdi', 'error')
              useWindowStore.getState().closeWindow('delete-confirmation')
            }
          }}
          onCancel={() => useWindowStore.getState().closeWindow('delete-confirmation')}
        />
      )
    })
  }




  // F4 qısayolu InvoiceModal-da idarə olunur


  const handleModalSave = useCallback(async (modalId: string, modalData: ModalData['data']) => {
    devLog('[Alis.tsx] ========== handleModalSave FUNKSİYASI ÇAĞIRILDI ==========')
    devLog('[Alis.tsx] handleModalSave çağırıldı', {
      modalId,
      modalData,
      modalDataKeys: Object.keys(modalData),
      invoiceItemsCount: modalData.invoiceItems?.length || 0
    })

    // Modalı ref-dən oxu (state-dən asılılığı aradan qaldırır)
    const modal = openModalsRef.current.get(modalId)

    if (!modal) {
      console.error('[Alis.tsx] handleModalSave - XƏTA: Modal tapılmadı!', modalId)
      return
    }

    const modalDataToUse = modal.data
    // modalData arqumenti varsa, onu istifadə et (ən son dəyişikliklər)
    const finalData = modalData ? { ...modalDataToUse, ...modalData } : modalDataToUse

    devLog('[Alis.tsx] handleModalSave - Modal tapıldı:', { id: modal.id, invoiceId: modal.invoiceId })

    // Promise-dən modal-ı alırıq

    devLog('[Alis.tsx] handleModalSave - Promise-dən modal alındı:', modal)

    if (!modal) {
      console.error('[Alis.tsx] handleModalSave - XƏTA: Modal tapılmadı, funksiya dayandırılır')
      return
    }

    devLog('[Alis.tsx] handleModalSave - Modal istifadəyə hazırdır:', { id: modal.id, invoiceId: modal.invoiceId })
    devLog('[Alis.tsx] handleModalSave - modalData:', finalData)

    const validItems = finalData.invoiceItems.filter(item => item.product_id !== null)
    devLog('[Alis.tsx] handleModalSave - Valid items:', validItems.length)
    devLog('[Alis.tsx] handleModalSave - Valid items details:', validItems)

    // Yadda saxla düyməsi üçün validasiya yoxdur - boş qaimə yarada bilər
    // Validasiya yalnız OK düyməsi üçün InvoiceModal komponentindədir

    try {
      const items = validItems.map(item => ({
        product_id: item.product_id!,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount_manual: item.discount_manual || 0,
        discount_auto: item.discount_auto || 0,
        vat_rate: item.vat_rate || 0,
      }))

      devLog('[Alis.tsx] handleModalSave - Items hazırlandı:', items)
      devLog('[Alis.tsx] handleModalSave - Modal invoiceId:', modal.invoiceId)

      if (modal.invoiceId) {
        // Mövcud qaimə - yenilə
        console.log('[Alis.tsx] ========== MÖVCUD QAIMƏ YENİLƏNİR ==========')
        console.log('[Alis.tsx] Mövcud qaimə yenilənir:', modal.invoiceId)
        console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.update')
        console.log('[Alis.tsx] Request data:', {
          supplier_id: finalData.selectedCustomerId || undefined,
          items,
          notes: finalData.notes || undefined,
        })

        const updateResult = await ordersAPI.update(modal.invoiceId.toString(), {
          customer_id: finalData.selectedCustomerId || undefined,
          items,
          notes: finalData.notes || undefined,
          invoice_date: finalData.invoiceDate || undefined,
          payment_date: finalData.paymentDate || undefined,
        })

        console.log('[Alis.tsx] API cavabı (update):', updateResult)

        // Change saved: update initial data to prevent unsaved changes warning
        initialDataMap.current.set(modalId, JSON.parse(JSON.stringify(finalData)))

        // Modalı yenilə ki, dirty check düzgün işləsin (data-nı yenilə)
        setOpenModals(prev => {
          const newMap = new Map(prev)
          const current = newMap.get(modalId)
          if (current) {
            newMap.set(modalId, {
              ...current,
              data: { ...current.data, ...finalData }
            })
          }
          return newMap
        })

        // Vəziyyəti dəyişdirmə - mövcud vəziyyəti saxla
        if (modal.isActive !== undefined) {
          console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.updateStatus')
          console.log('[Alis.tsx] Status update:', { id: modal.invoiceId, isActive: modal.isActive })
          const statusResult = await ordersAPI.updateStatus(modal.invoiceId.toString(), modal.isActive)
          console.log('[Alis.tsx] API cavabı (updateStatus - confirm):', statusResult)
        }

        logActivity(
          'invoice',
          'Qaimə təsdiqləndi',
          `Qaimə ${finalData.invoiceNumber || ('#' + modal.invoiceId)} təsdiqləndi və yadda saxlanıldı`,
          'success',
          { invoiceId: modal.invoiceId, itemCount: validItems.length, invoiceNumber: finalData.invoiceNumber }
        )

        console.log('[Alis.tsx] Qaimə yeniləndi')
        showNotification(`Satış qaiməsi ${finalData.invoiceNumber} uğurla yeniləndi`, 'success')

        logActivity(
          'invoice',
          'Qaimə yadda saxlanıldı',
          `Qaimə ${finalData.invoiceNumber || ('#' + modal.invoiceId)} yeniləndi (${validItems.length} məhsul)`,
          'success',
          { invoiceId: modal.invoiceId, itemCount: validItems.length, supplierId: finalData.selectedSupplierId, invoiceNumber: finalData.invoiceNumber }
        )
      } else {
        // Yeni qaimə - yarad, amma tesdiqsiz saxla
        console.log('[Alis.tsx] ========== YENİ QAIMƏ YARADILIR ==========')
        console.log('[Alis.tsx] Yeni qaimə yaradılır (təsdiqsiz)...')
        console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.create')
        console.log('[Alis.tsx] Request data:', {
          supplier_id: finalData.selectedSupplierId || undefined,
          items,
          notes: finalData.notes || undefined,
        })

        const newInvoice = await ordersAPI.create({
          customer_id: finalData.selectedCustomerId || undefined,
          items,
          notes: finalData.notes || undefined,
          invoice_date: finalData.invoiceDate || undefined,
          payment_date: finalData.paymentDate || undefined,
        })

        console.log('[Alis.tsx] API cavabı (create):', newInvoice)
        console.log('[Alis.tsx] Yeni qaimə ID:', newInvoice.id)

        // Tesdiqsiz saxla (default olaraq tesdiqsizdir, amma açıq şəkildə təyin edək)
        if (newInvoice.id) {
          console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.updateStatus (false)')
          const statusResult = await ordersAPI.updateStatus(newInvoice.id.toString(), false)
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
                ...modalData, // Ensure validItems and other changes are preserved
                invoiceNumber: newInvoice.invoice_number || '',
                invoiceDate: invoiceDateStr
              }
            })
          }
          return newMap
        })

        console.log('[Alis.tsx] API cavabı (create):', newInvoice)

        showNotification(`Satış qaiməsi ${newInvoice.invoice_number} uğurla yaradıldı (təsdiqsiz)`, 'success')
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
      // showNotification(err.response?.data?.message || 'Qaimə yadda saxlanılarkən xəta baş verdi', 'error')
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

    // Modalı ref-dən oxu
    const modal = openModalsRef.current.get(modalId)

    if (!modal) {
      console.error('[Alis.tsx] handleModalSaveAndConfirm - XƏTA: Modal tapılmadı!', modalId)
      return
    }

    const modalDataToUse = modal.data
    const finalData = modalData ? { ...modalDataToUse, ...modalData } : modalDataToUse

    devLog('[Alis.tsx] handleModalSaveAndConfirm - Modal tapıldı:', { id: modal.id, invoiceId: modal.invoiceId })

    // Promise-dən modal-ı alırıq

    devLog('[Alis.tsx] handleModalSaveAndConfirm - Promise-dən modal alındı:', modal)

    if (!modal) {
      console.error('[Alis.tsx] handleModalSaveAndConfirm - XƏTA: Modal tapılmadı, funksiya dayandırılır')
      return
    }

    devLog('[Alis.tsx] handleModalSaveAndConfirm - Modal istifadəyə hazırdır:', { id: modal.id, invoiceId: modal.invoiceId })
    devLog('[Alis.tsx] handleModalSaveAndConfirm - modalData:', finalData)

    const validItems = finalData.invoiceItems.filter(item => item.product_id !== null)
    devLog('[Alis.tsx] handleModalSaveAndConfirm - Valid items:', validItems.length)
    devLog('[Alis.tsx] handleModalSaveAndConfirm - Valid items details:', validItems)

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
        discount_manual: item.discount_manual || 0,
        discount_auto: item.discount_auto || 0,
        vat_rate: item.vat_rate || 0,
      }))

      devLog('[Alis.tsx] handleModalSaveAndConfirm - Items hazırlandı:', items)
      devLog('[Alis.tsx] handleModalSaveAndConfirm - Modal invoiceId:', modal.invoiceId)

      if (modal.invoiceId) {
        // Mövcud qaimə - yenilə və təsdiqlə
        console.log('[Alis.tsx] ========== MÖVCUD QAIMƏ YENİLƏNİR VƏ TƏSDİQLƏNİR ==========')
        console.log('[Alis.tsx] Mövcud qaimə yenilənir və təsdiqlənir:', modal.invoiceId)
        console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.update')
        console.log('[Alis.tsx] Request data:', {
          supplier_id: modalData.selectedCustomerId || undefined,
          items,
          notes: modalData.notes || undefined,
        })

        const updateResult = await ordersAPI.update(modal.invoiceId.toString(), {
          customer_id: modalData.selectedSupplierId || undefined,
          items,
          notes: modalData.notes || undefined,
          invoice_date: modalData.invoiceDate || undefined,
          payment_date: modalData.paymentDate || undefined,
        })

        console.log('[Alis.tsx] API cavabı (update):', updateResult)

        // Təsdiqlə
        console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.updateStatus (true)')
        const statusResult = await ordersAPI.updateStatus(modal.invoiceId.toString(), true)
        console.log('[Alis.tsx] API cavabı (updateStatus):', statusResult)

        console.log('[Alis.tsx] Qaimə yeniləndi və təsdiq edildi')

        // Change saved: update initial data
        initialDataMap.current.set(modalId, JSON.parse(JSON.stringify(finalData)))

        // Modalı yenilə (data və status)
        setOpenModals(prev => {
          const newMap = new Map(prev)
          const current = newMap.get(modalId)
          if (current) {
            newMap.set(modalId, {
              ...current,
              isActive: true,
              data: { ...current.data, ...finalData }
            })
          }
          return newMap
        })

        showNotification(`Satış qaiməsi ${updateResult.invoice_number} uğurla yeniləndi və təsdiq edildi`, 'success')
      } else {
        // Yeni qaimə - yarad və təsdiqlə
        console.log('[Alis.tsx] ========== YENİ QAIMƏ YARADILIR VƏ TƏSDİQLƏNİR ==========')
        console.log('[Alis.tsx] Yeni qaimə yaradılır və təsdiqlənir...')
        console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.create')
        console.log('[Alis.tsx] Request data:', {
          supplier_id: modalData.selectedCustomerId || undefined,
          items,
          notes: modalData.notes || undefined,
        })

        const newInvoice = await ordersAPI.create({
          customer_id: modalData.selectedCustomerId || undefined,
          items,
          notes: modalData.notes || undefined,
          invoice_date: modalData.invoiceDate || undefined,
          payment_date: modalData.paymentDate || undefined,
        })

        console.log('[Alis.tsx] API cavabı (create):', newInvoice)
        console.log('[Alis.tsx] Yeni qaimə ID:', newInvoice.id)

        // Təsdiqlə
        if (newInvoice.id) {
          console.log('[Alis.tsx] API çağırışı: purchaseInvoicesAPI.updateStatus (true)')
          const statusResult = await ordersAPI.updateStatus(newInvoice.id.toString(), true)
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
                ...modalData, // Ensure validItems and other changes are preserved
                invoiceNumber: newInvoice.invoice_number || '',
                invoiceDate: invoiceDateStr
              }
            })
          }
          return newMap
        })

        console.log('[Alis.tsx] Yeni qaimə yaradıldı və təsdiq edildi:', newInvoice.id)

        // Change saved: update initial data
        initialDataMap.current.set(modalId, JSON.parse(JSON.stringify({
          ...finalData,
          invoiceNumber: newInvoice.invoice_number || '',
          invoiceDate: invoiceDateStr
        })))

        showNotification(`Satış qaiməsi ${newInvoice.invoice_number} uğurla yaradıldı və təsdiq edildi`, 'success')
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
      // showNotification(err.response?.data?.message || 'Qaimə yadda saxlanılarkən xəta baş verdi', 'error')
      throw err // Xətanı yuxarı at ki, modal bağlanmasın
    }
  }, [showNotification, loadInvoices])


  // Handle Copy/Duplicate
  const handleCopy = useCallback(async (ids: (number | string)[]) => {
    if (ids.length !== 1) {
      showNotification('Kopyalamaq üçün yalnız bir qaimə seçin', 'warning')
      return
    }

    try {
      const id = ids[0]
      // Full invoice fetch
      const existingInvoice = await ordersAPI.getById(id.toString())

      if (!existingInvoice) {
        showNotification('Qaimə tapılmadı', 'error')
        return
      }

      // Prepare data for new invoice
      const newInvoiceData: ModalData['data'] = {
        invoiceNumber: '', // Let backend generate new number
        invoiceDate: new Date().toISOString(),
        selectedCustomerId: existingInvoice.customer_id,
        selectedSupplierId: undefined,
        notes: existingInvoice.notes ? `${existingInvoice.notes} (Kopyalanıb)` : '(Kopyalanıb)',
        invoiceItems: existingInvoice.sale_invoice_items?.map((item: any) => ({
          product_id: item.product_id,
          product_name: item.products?.name || 'Naməlum məhsul',
          searchTerm: item.products?.name || 'Naməlum məhsul',
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price),
          vat_rate: Number(item.vat_rate || 0),
          discount_manual: Number(item.discount_manual || 0),
          discount_auto: Number(item.discount_auto || 0)
        })) || []
      }

      openModalForInvoice(null, newInvoiceData)
      showNotification('Qaimə kopyalandı. Zəhmət olmasa yoxlayın və yadda saxlayın.', 'success')

    } catch (err: any) {
      console.error('Kopyalama xətası:', err)
      showNotification('Kopyalama zamanı xəta baş verdi', 'error')
    }
  }, [openModalForInvoice, showNotification])

  const handlePrint = async () => {
    // Seçilmiş sənədləri al
    const invoicesToPrint = selectedInvoiceIds.length > 0
      ? invoices.filter(inv => selectedInvoiceIds.includes(inv.id))
      : []

    if (invoicesToPrint.length === 0) {
      showNotification('Çap üçün sənəd seçilməyib', 'warning')
      return
    }

    // Hər sənədi tam məlumatla yüklə
    const fullInvoices = await Promise.all(
      invoicesToPrint.map(async (inv) => {
        try {
          const fullInvoice = await ordersAPI.getById(inv.id.toString())
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
            <title>Satış Qaimələri</title>
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

      fullInvoices.forEach((invoice: SaleInvoice, index: number) => {
        const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('az-AZ') : '-'
        const items = invoice.sale_invoice_items || []
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
                <p><strong>Müştəri:</strong> ${invoice.customers?.name || '-'}</p>
                ${invoice.customers?.phone ? `<p><strong>Telefon:</strong> ${invoice.customers.phone}</p>` : ''}
                ${invoice.customers?.address ? `<p><strong>Ünvan:</strong> ${invoice.customers.address}</p>` : ''}
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
    customer_name: invoice.customers?.name || '-',
    invoice_date: invoice.invoice_date ? (() => {
      const date = new Date(invoice.invoice_date)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`
    })() : '-',
    payment_date: invoice.payment_date ? (() => {
      const date = new Date(invoice.payment_date)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`
    })() : '-',
    total_amount: invoice.total_amount ? `${Number(invoice.total_amount).toFixed(2)} ₼` : '0.00 ₼',
    created_at: invoice.created_at ? (() => {
      const date = new Date(invoice.created_at)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`
    })() : '-',
  }))



  return (
    <UniversalContainer padding="5px">
      <style>{notificationStyles}</style>
      <UniversalToolBar
        onAdd={() => openModalForInvoice(null)}
        onEdit={() => {
          if (selectedInvoiceIds.length === 1) {
            handleEdit(selectedInvoiceIds)
          }
        }}
        onDelete={() => {
          if (selectedInvoiceIds.length > 0) {
            handleDelete(selectedInvoiceIds)
          }
        }}
        onCopy={() => {
          if (selectedInvoiceIds.length > 0) {
            handleCopy(selectedInvoiceIds)
          }
        }}
        onPrint={handlePrint}
        onRefresh={loadInvoices}
        onSearch={handleSearch}
        onPeriodChange={(period: any) => {
          const newRules = appliedFilters.filter(r => r.component !== 'invoice_date')
          if (period.startDate || period.endDate) {
            newRules.push({
              component: 'invoice_date',
              condition: 'between',
              value: period
            } as any)
          }
          setAppliedFilters(newRules)
          localStorage.setItem('filter-applied-filter-satis', JSON.stringify(newRules))
        }}
        onFilter={() => {
          useWindowStore.getState().openPageWindow(
            'advanced-filter-satis',
            'Filtrlər',
            '🔍',
            <AdvancedFilterModal
              onClose={() => useWindowStore.getState().closePageWindow('advanced-filter-satis')}
              toolbarId="filter-satis"
              onApply={(rules) => {
                setAppliedFilters(rules)
                localStorage.setItem('filter-applied-filter-satis', JSON.stringify(rules))
                useWindowStore.getState().closePageWindow('advanced-filter-satis')
              }}
              filterComponents={FILTER_COMPONENTS}
            />,
            { width: 800, height: 600 }
          )
        }}
        onSettings={() => tableRef.current?.openSettings()}

      />

      {/* Aktiv filtrlər */}
      {/* activeFilters.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', padding: '0 15px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {activeFilters.map((filter, index) => {
             ...
          })}
        </div>
      ) */}

      <UniversalTable
        ref={tableRef}
        data={tableData}
        columns={defaultColumns}
        loading={loading}
        getRowId={(row: any) => row.id}
        onRowSelect={setSelectedInvoiceIds}
        onRowClick={(row: any) => handleEdit([row.id])}
        onScroll={handleScroll}
        onJumpToStart={handleJumpToStart}
        onJumpToEnd={handleJumpToEnd}
        serverSideSort={true}
        onSort={handleSort}
      />

      <UniversalFooter
        totalRecords={tableData.length}
        selectedCount={selectedInvoiceIds.length}
      />

      {/* Təsdiq Dialoqu */}


      {/* Çoxlu Purchase Invoice Modalları - REMOVED (Handled by UniversalWindow) */}
    </UniversalContainer>
  )
}

// Page component (The route handler)
export default function SatisQaimeleriPage() {
  const { openPageWindow } = useWindowStore()

  useEffect(() => {
    const { isPageOpen, focusPage } = useWindowStore.getState()
    if (isPageOpen('qaimeler-satis')) {
      focusPage('qaimeler-satis')
      return
    }

    openPageWindow(
      'qaimeler-satis',
      'Satış Qaimələri',
      '📋',
      <SatisQaimeleriContent />
    )
  }, []) // Mount-da bir dəfə aç

  // Arxa fonda Layout (Navbar və Taskbar)
  return (
    <Layout>
      <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
        {/* Boş sahə - pəncərə üstə açılacaq */}
      </div>
    </Layout>
  )
}
