import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useNotificationStore } from '../store/notificationStore'
import UniversalToolBar from '../components/UniversalToolBar'
import CategoryTree from '../components/CategoryTree'
import UniversalTable, { ColumnConfig, UniversalTableRef } from '../components/UniversalTable'
import { productsAPI, categoriesAPI } from '../services/api'
import type { Product, Category } from '../../../shared/types'
import { useWindowStore } from '../store/windowStore'
import ProductForm from '../components/ProductFormModal'
import AdvancedFilterModal, { FilterRule } from '../components/AdvancedFilterModal'

import ProductBottomPanel from '../components/ProductBottomPanel'
import MoveToCategoryModal from '../components/MoveToCategoryModal'
import ConfirmationModal from '../components/ConfirmationModal'

type GridItem = ((Product & { type: 'product' }) | (Category & { type: 'category' })) & { isParent?: boolean }

const FolderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 19V11H2V19H22ZM2 7L20 7V9H2V7Z" fill="#F4D03F" />
    <path d="M22 11V19C22 20.1 21.1 21 20 21H4C2.9 21 2 20.1 2 19V7C2 5.9 2.9 5 4 5H10L12 7H20C21.1 7 22 7.9 22 9V11Z" fill="#F4D03F" />
    <path d="M20 9H4V19H20V9Z" fill="#F4D03F" />
    <path d="M22 9H2V11H22V9Z" fill="#D4AC0D" fillOpacity="0.2" />
  </svg>
)

const FolderParentIcon = () => ( // Up Arrow
  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
    <FolderIcon />
    <div style={{ position: 'absolute', left: '-6px', top: '6px' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M5 12L12 19M5 12L12 5" transform="rotate(90 12 12)" />{/* Up Arrow */}
      </svg>
    </div>
  </div>
)

const FolderChildIcon = () => ( // Drill-down Arrow
  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
    <div style={{ position: 'absolute', left: '-6px', top: '2px' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" /> {/* Right Chevron/Arrow */}
      </svg>
    </div>
    <FolderIcon />
  </div>
)

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#8B4513' }}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
)


const defaultColumns: ColumnConfig[] = [
  {
    id: 'icon', label: '', width: 50, order: 0, align: 'center',
    render: (_, row: GridItem) => {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
          {row.isParent ? (
            <FolderParentIcon />
          ) : (
            row.type === 'category' ? <FolderChildIcon /> : <FileIcon />
          )}
        </div>
      )
    }
  },
  {
    id: 'id', label: 'ID', visible: true, width: 60, order: 1,
    render: (val) => val
  },
  { id: 'name', label: 'Ad', visible: true, width: 250, order: 2 },
  {
    id: 'code', label: 'Kod', visible: true, width: 100, order: 3,
    render: (val, row: GridItem) => row.type === 'product' ? val : ''
  },
  {
    id: 'barcode', label: 'Barkod', visible: true, width: 130, order: 4,
    render: (val, row: GridItem) => row.type === 'product' ? val : ''
  },
  {
    id: 'unit', label: 'Vahid', visible: true, width: 80, order: 5,
    render: (val, row: GridItem) => row.type === 'product' ? val : ''
  },
  {
    id: 'purchase_price',
    label: 'Alış qiyməti',
    visible: true,
    width: 120,
    order: 6,
    align: 'right',
    render: (val: number, row: GridItem) => row.type === 'product' && !isNaN(Number(val)) ? `${Number(val).toFixed(2)} ₼` : ''
  },
  {
    id: 'sale_price',
    label: 'Satış qiyməti',
    visible: true,
    width: 120,
    order: 7,
    align: 'right',
    render: (val: number, row: GridItem) => row.type === 'product' && !isNaN(Number(val)) ? `${Number(val).toFixed(2)} ₼` : ''
  },
  {
    id: 'quantity',
    label: 'Qalıq',
    visible: true,
    width: 100,
    order: 8,
    align: 'right',
    render: (_val: any, row: GridItem) => {
      if (row.type !== 'product') return ''
      const quantity = (row as any).warehouse?.[0]?.quantity || 0
      return `${quantity} ${row.unit || 'ədəd'}`
    }
  },
  {
    id: 'purchase_total',
    label: 'Alış cəm',
    visible: true,
    width: 120,
    order: 9,
    align: 'right',
    render: (val: number, row: GridItem) => row.type === 'product' && !isNaN(Number(val)) ? `${Number(val).toFixed(2)} ₼` : ''
  },
  {
    id: 'sale_total',
    label: 'Satış cəm',
    visible: true,
    width: 120,
    order: 10,
    align: 'right',
    render: (val: number, row: GridItem) => row.type === 'product' && !isNaN(Number(val)) ? `${Number(val).toFixed(2)} ₼` : ''
  },
]









interface Products2Props {
  initialSelectedProductId?: number | null
  initialCategoryId?: number | null
  onSelect?: (product: Product) => void
}

export default function Products2({ initialSelectedProductId, initialCategoryId, onSelect }: Products2Props = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRows, setSelectedRows] = useState<string[]>([])


  // localStorage-dan papka ağacının görünürlüyünü yüklə (default: true - həmişə açıq)
  const loadCategoryTreeVisibility = (): boolean => {
    try {
      const saved = localStorage.getItem('anbar-category-tree-visible')
      if (saved !== null) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Category tree visibility yüklənərkən xəta:', e)
    }
    return true // Default: açıq
  }

  const [showCategoryTree, setShowCategoryTree] = useState(loadCategoryTreeVisibility)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(initialCategoryId || null)
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const tableRef = useRef<UniversalTableRef>(null)
  const { addNotification } = useNotificationStore()


  // Resizing states
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('products2-sidebar-width')
    return saved ? parseInt(saved) : 300
  })
  const [bottomHeight, setBottomHeight] = useState<number>(() => {
    const saved = localStorage.getItem('products2-bottom-height')
    return saved ? parseInt(saved) : 180
  })

  const [isResizingSidebar, setIsResizingSidebar] = useState(false)
  const [isResizingBottom, setIsResizingBottom] = useState(false)

  // Sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingSidebar) return
      const newWidth = Math.max(150, Math.min(600, e.clientX - 10)) // 10px offset for padding/margin
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      if (isResizingSidebar) {
        setIsResizingSidebar(false)
        localStorage.setItem('products2-sidebar-width', sidebarWidth.toString())
      }
    }

    if (isResizingSidebar) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingSidebar, sidebarWidth])

  // Bottom panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingBottom) return
      const windowHeight = window.innerHeight
      const newHeight = Math.max(100, Math.min(500, windowHeight - e.clientY - 40)) // 40px offset for taskbar
      setBottomHeight(newHeight)
    }

    const handleMouseUp = () => {
      if (isResizingBottom) {
        setIsResizingBottom(false)
        localStorage.setItem('products2-bottom-height', bottomHeight.toString())
      }
    }

    if (isResizingBottom) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingBottom, bottomHeight])




  // localStorage-dan funksiyalar ayarlarını yüklə
  const loadFunctionSettings = () => {
    try {
      const saved = localStorage.getItem('anbar-function-settings')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Function settings yüklənərkən xəta:', e)
    }
    return {
      multiSelect: true,
      ctrlClickMultiSelect: true,
      deleteEnabled: true
    }
  }

  const [functionSettings] = useState(loadFunctionSettings())

  // Load saved filters from localStorage
  const loadSavedFilters = (): FilterRule[] => {
    try {
      const saved = localStorage.getItem('products2-applied-filters')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Filter yüklənərkən xəta:', e)
    }
    return []
  }

  const [appliedFilters, setAppliedFilters] = useState<FilterRule[]>(loadSavedFilters())

  // Helper to get warehouse quantity
  const getWarehouseQuantity = (product: Product) => {
    return (product as any).warehouse?.[0]?.quantity || 0
  }

  const filterFieldMap: Record<string, string> = {
    'product': 'id',
    'code': 'code',
    'barcode': 'barcode',
    'article': 'article',
    'brand': 'brand',
    'model': 'model',
    'category': 'category_id'
  }

  // Filtr və axtarış
  const gridData = useMemo<GridItem[]>(() => {
    // Helper for search
    const matchesSearch = (item: { name: string, code?: string | null, barcode?: string | null }) => {
      const term = searchTerm.toLowerCase()
      return item.name.toLowerCase().includes(term) ||
        (item.code && item.code.toLowerCase().includes(term)) ||
        (item.barcode && item.barcode.toLowerCase().includes(term))
    }

    // 0. Ancestor Stack (Full Path Up to Current)
    let parentRow: GridItem[] = []
    if (selectedCategoryId !== null && !searchTerm) {
      let chain: Category[] = []
      let currentTemp = categories.find(c => c.id === selectedCategoryId)

      while (currentTemp) {
        chain.unshift(currentTemp)
        // Move up
        currentTemp = categories.find(c => c.id === currentTemp!.parent_id)
      }

      // chain indi [RootCA, ..., Parent, Current]
      // Bunları parentRow kimi yığırıq
      parentRow = chain.map(cat => ({
        ...cat,
        type: 'category',
        isParent: true // Bu bunları icon fərqliliyi və click logic üçün ayırır
      }))
    }

    // 1. Categories
    const currentCategories = categories.filter(c => {
      if (searchTerm) return matchesSearch(c)
      if (selectedCategoryId) return c.parent_id === selectedCategoryId
      return c.parent_id === null
    }).map(c => ({ ...c, type: 'category' } as GridItem))

    // 2. Products
    const currentProducts = products.filter(p => {
      if (searchTerm) return matchesSearch(p)

      // Navigation mode
      if (selectedCategoryId !== null) {
        if (p.category_id !== selectedCategoryId) return false
      } else {
        if (p.category_id !== null) return false
      }

      // Advanced filters
      if (appliedFilters.length > 0) {
        return appliedFilters.every(rule => {
          const field = filterFieldMap[rule.component] || rule.component
          const val = (p as any)[field]
          const target = rule.value

          if (rule.condition === 'equals') {
            if (rule.component === 'product') return val === (target?.id)
            return String(val || '').toLowerCase() === String(target || '').toLowerCase()
          }
          return true
        })
      }
      return true
    }).map(p => ({ ...p, type: 'product' } as GridItem))

    return [...parentRow, ...currentCategories, ...currentProducts]
  }, [products, categories, selectedCategoryId, searchTerm, appliedFilters, filterFieldMap])

  // Backward compatibility for existing handlers
  const filteredProducts = useMemo(() => gridData.filter(item => item.type === 'product') as Product[], [gridData])


  // Kontekst menyu state-ləri
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    type: 'table' | 'category' | null
    categoryId?: number | null
  }>({
    visible: false,
    x: 0,
    y: 0,
    type: null
  })

  const loadProducts = useCallback(async (categoryId?: number | null) => {
    try {
      setLoading(true)
      const data = await productsAPI.getAll()
      // Frontend-də filtr et
      let filtered = data
      if (categoryId !== undefined && categoryId !== null) {
        filtered = data.filter(p => p.category_id === categoryId)
      }
      setProducts(filtered)
    } catch (err: any) {
      console.error(err.response?.data?.message || 'Məhsullar yüklənərkən xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoriesAPI.getAll()
      setCategories(data)
    } catch (err: any) {
      console.error('Categories yüklənərkən xəta:', err)
    }
  }, [])

  const loadData = useCallback(async () => {
    await loadProducts(selectedCategoryId)
    await loadCategories()
  }, [loadProducts, loadCategories, selectedCategoryId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-select product if initialSelectedProductId is provided
  useEffect(() => {
    if (initialSelectedProductId && products.length > 0 && !loading) {
      const productRowId = `prod_${initialSelectedProductId}`
      setSelectedRows([productRowId])
    }
  }, [initialSelectedProductId, products, loading])

  // Hər gün tarixi yenilə (tarix hesablamaları üçün)
  useEffect(() => {
    const interval = setInterval(() => {
      // Hər saat yoxla, gün dəyişibsə yenilə
      const now = new Date()
      const currentHour = now.getHours()
      if (currentHour === 0) {
        // Gecə yarısı olduqda yenilə
        window.location.reload()
      }
    }, 1000 * 60 * 60) // Hər saat yoxla

    return () => clearInterval(interval)
  }, [])

  // Browser-in default kontekst menyusunu dayandır
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Yalnız cədvəl və papkalar üçün öz kontekst menyumuzu göstəririk
      // Digər yerlərdə browser-in default menyusunu tamamilə dayandırırıq
      e.preventDefault()
    }

    document.addEventListener('contextmenu', handleContextMenu)
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  // Kontekst menyunu bağla
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false })
      }
    }

    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [contextMenu])





  // Ctrl+A ilə hamısını seç
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        if (functionSettings.multiSelect) {
          // Select all grid items
          const allIds = gridData
            .map(item => item.type === 'category' ? `cat_${item.id}` : `prod_${item.id}`)
          setSelectedRows(allIds)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gridData, functionSettings.multiSelect])

  const handleDelete = async () => {
    if (selectedRows.length === 0) return
    if (!functionSettings.deleteEnabled) {
      toast.error('Delete funksiyası deaktivdir. Ayarlardan aktivləşdirin.')
      return
    }


    const confirmDelete = async () => {
      try {
        const prodIds = selectedRows.filter(id => id.startsWith('prod_')).map(id => Number(id.replace('prod_', '')))
        const catIds = selectedRows.filter(id => id.startsWith('cat_')).map(id => Number(id.replace('cat_', '')))

        // Delete Products
        if (prodIds.length > 0) {
          await Promise.all(prodIds.map(async (id) => {
            const product = products.find(p => p.id === id)
            await productsAPI.delete(id.toString())
            if (product) {
              const identifier = product.code ? `"${product.code}" kodlu` : `"${product.name}"`
              addNotification('success', 'Uğurlu', `${identifier} məhsul silindi`)
            }
          }))
        }

        // Delete Categories
        if (catIds.length > 0) {
          await Promise.all(catIds.map(async (id) => {
            const category = categories.find(c => c.id === id)
            await categoriesAPI.delete(id.toString())
            if (category) {
              addNotification('success', 'Uğurlu', `"${category.name}" kateqoriyası silindi`)
            }
          }))
        }

        await loadData()
        setSelectedRows([])
      } catch (err: any) {
        addNotification('error', 'Xəta', 'Silmə zamanı xəta baş verdi')
      }
    }

    useWindowStore.getState().addWindow({
      id: 'confirm-delete',
      title: 'Təsdiq',
      icon: '⚠️',
      type: 'confirm',
      modalType: 'confirm',
      content: <ConfirmationModal
        message={`${selectedRows.length} element silinsin?`}
        onConfirm={async () => {
          await confirmDelete()
          useWindowStore.getState().closeWindow('confirm-delete')
        }}
        onCancel={() => useWindowStore.getState().closeWindow('confirm-delete')}
        confirmText="Sil"
        cancelText="İmtina"
      />,
      size: { width: 400, height: 200 },
      position: { x: (window.innerWidth - 400) / 2, y: (window.innerHeight - 200) / 2 },
      isMaximized: false,
      isMinimized: false,
      zIndex: 9999
    })
  }

  // Delete düyməsi ilə silmə
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedRows.length > 0 && functionSettings.deleteEnabled) {
        e.preventDefault()
        handleDelete()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedRows, functionSettings.deleteEnabled, handleDelete])

  const { openPageWindow } = useWindowStore()

  // Helper to calculate date difference
  const calculateDateDifference = (startDate: Date, endDate: Date): { years: number; months: number; days: number } => {
    let years = endDate.getFullYear() - startDate.getFullYear()
    let months = endDate.getMonth() - startDate.getMonth()
    let days = endDate.getDate() - startDate.getDate()

    if (days < 0) {
      const lastDayOfPrevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate()
      days += lastDayOfPrevMonth
      months--
    }

    if (months < 0) {
      months += 12
      years--
    }

    return { years, months, days }
  }

  const handleEdit = () => {
    // Only edit single product for now
    // Find single selected product
    const selectedProdIds = selectedRows.filter(id => id.startsWith('prod_'))

    if (selectedProdIds.length === 1) {
      const prodId = Number(selectedProdIds[0].replace('prod_', ''))
      const product = products.find(p => p.id === prodId)

      if (product) {
        const existingBarcodes = products.map(p => p.barcode).filter(Boolean) as string[]

        openPageWindow(
          `edit-product-${product.id}`,
          `Redaktə: ${product.name}`,
          '✏️',
          <ProductForm
            product={product}
            title={`Redaktə: ${product.name}`}
            mode="edit"
            categories={categories}
            existingBarcodes={existingBarcodes}
            onSubmit={async (formData, shouldClose) => {
              // Validation: Check for duplicates
              // Exclude current product from check
              const isDuplicateCode = formData.code && products.some(p => p.code === formData.code && p.id !== product.id)
              if (isDuplicateCode) {
                throw new Error('Bu kodla məhsul artıq mövcuddur!')
              }

              const isDuplicateBarcode = formData.barcode && products.some(p => p.barcode === formData.barcode && p.id !== product.id)
              if (isDuplicateBarcode) {
                throw new Error('Bu barkodla məhsul artıq mövcuddur!')
              }

              const isDuplicateArticle = formData.article && products.some(p => p.article === formData.article && p.id !== product.id)
              if (isDuplicateArticle) {
                throw new Error('Bu artikulla məhsul artıq mövcuddur!')
              }

              await productsAPI.update(product.id.toString(), {
                name: formData.name,
                code: formData.code || undefined,
                barcode: formData.barcode || undefined,
                article: formData.article || undefined,
                description: formData.description || undefined,
                unit: formData.unit,
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : 0,
                sale_price: formData.sale_price ? parseFloat(formData.sale_price) : 0,
                category_id: formData.category_id ? parseInt(formData.category_id) : null,
                type: formData.type || undefined,
                brand: formData.brand || undefined,
                warranty_period: (() => {
                  if (formData.production_date && formData.expiry_date) {
                    try {
                      const productionDate = new Date(formData.production_date + 'T00:00:00')
                      const expiryDate = new Date(formData.expiry_date + 'T00:00:00')
                      if (!isNaN(productionDate.getTime()) && !isNaN(expiryDate.getTime())) {
                        const { years, months, days } = calculateDateDifference(productionDate, expiryDate)
                        const totalMonths = years * 12 + months + (days >= 15 ? 1 : 0)
                        return totalMonths > 0 ? totalMonths : undefined
                      }
                    } catch (e) {
                      console.error('Zəmanət müddəti hesablanarkən xəta:', e)
                    }
                  }
                  return undefined
                })(),
                production_date: formData.production_date ? new Date(formData.production_date + 'T00:00:00').toISOString() : undefined,
                expiry_date: formData.expiry_date ? new Date(formData.expiry_date + 'T00:00:00').toISOString() : undefined,
                is_active: formData.is_active
              })

              await loadData()
              await loadData()
              // toast.success('Məhsul uğurla yeniləndi!')
              if (shouldClose) {
                useWindowStore.getState().closePageWindow(`edit-product-${product.id}`)
              }
            }}
          />,
          { width: 800, height: 700 }
        )
      }
    }
  }

  const handleAddNew = () => {
    const existingBarcodes = products.map(p => p.barcode).filter(Boolean) as string[]

    openPageWindow(
      'new-product',
      'Yeni Məhsul Əlavə Et',
      '➕',
      <ProductForm
        product={null}
        title="Yeni Məhsul"
        mode="create"
        categories={categories}
        existingBarcodes={existingBarcodes}
        onSubmit={async (formData, shouldClose) => {
          // Validation: Check for duplicates
          const isDuplicateCode = formData.code && products.some(p => p.code === formData.code)
          if (isDuplicateCode) {
            throw new Error('Bu kodla məhsul artıq mövcuddur!')
          }

          const isDuplicateBarcode = formData.barcode && products.some(p => p.barcode === formData.barcode)
          if (isDuplicateBarcode) {
            throw new Error('Bu barkodla məhsul artıq mövcuddur!')
          }

          const isDuplicateArticle = formData.article && products.some(p => p.article === formData.article)
          if (isDuplicateArticle) {
            throw new Error('Bu artikulla məhsul artıq mövcuddur!')
          }

          const generateBarcode = () => {
            const timestamp = Date.now().toString()
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
            return `BC${timestamp.slice(-8)}${random}`
          }

          let finalBarcode = formData.barcode
          if (!finalBarcode) {
            finalBarcode = generateBarcode()
            while (existingBarcodes.includes(finalBarcode)) {
              finalBarcode = generateBarcode()
            }
          }

          let finalCode = formData.code
          if (!finalCode && finalBarcode && finalBarcode.length >= 6) {
            finalCode = finalBarcode.slice(-6)
          }

          try {
            await productsAPI.create({
              name: formData.name,
              code: finalCode || undefined,
              barcode: finalBarcode || undefined,
              article: formData.article || undefined,
              description: formData.description || undefined,
              unit: formData.unit,
              purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : 0,
              sale_price: formData.sale_price ? parseFloat(formData.sale_price) : 0,
              category_id: formData.category_id ? parseInt(formData.category_id) : null,
              type: formData.type || undefined,
              brand: formData.brand || undefined,
              warranty_period: (() => {
                if (formData.production_date && formData.expiry_date) {
                  try {
                    const productionDate = new Date(formData.production_date + 'T00:00:00')
                    const expiryDate = new Date(formData.expiry_date + 'T00:00:00')
                    if (!isNaN(productionDate.getTime()) && !isNaN(expiryDate.getTime())) {
                      const { years, months, days } = calculateDateDifference(productionDate, expiryDate)
                      const totalMonths = years * 12 + months + (days >= 15 ? 1 : 0)
                      return totalMonths > 0 ? totalMonths : undefined
                    }
                  } catch (e) {
                    console.error('Zəmanət müddəti hesablanarkən xəta:', e)
                  }
                }
                return undefined
              })(),
              production_date: formData.production_date ? new Date(formData.production_date + 'T00:00:00').toISOString() : undefined,
              expiry_date: formData.expiry_date ? new Date(formData.expiry_date + 'T00:00:00').toISOString() : undefined,
              is_active: formData.is_active
            })

            await loadData()
            await loadData()
            // toast.success('Yeni məhsul uğurla əlavə edildi!')
            if (shouldClose) {
              useWindowStore.getState().closePageWindow('new-product')
            }
          } catch (e) {
            console.error(e)
            console.error(e)
            throw e
          }
        }}
      />,
      { width: 800, height: 700 }
    )
  }







  const handleLocate = () => {
    // ... existing locate logic ...
    if (selectedRows.length !== 1) {
      toast.error('Zəhmət olmasa bir element seçin.')
      return
    }
    const selectedId = selectedRows[0]
    const type = selectedId.startsWith('prod_') ? 'product' : 'category'
    const id = Number(selectedId.split('_')[1])

    if (type === 'product') {
      const prod = products.find(p => p.id === id)
      if (prod) {
        setSearchTerm('')
        setSelectedCategoryId(prod.category_id || null)
      }
    } else if (type === 'category') {
      const currentCat = categories.find(c => c.id === id)
      if (currentCat) {
        // Locate folder (Go to its parent)
        if (currentCat.parent_id) {
          setSearchTerm('')
          setSelectedCategoryId(currentCat.parent_id)
        } else {
          setSearchTerm('')
          setSelectedCategoryId(null)
        }
      }
    }
  }

  const handleMove = () => {
    if (selectedRows.length === 0) {
      toast.error('Zəhmət olmasa köçürmək üçün ən azı bir element seçin.')
      return
    }
    setIsMoveModalOpen(true)
  }

  const confirmMove = async (targetCategoryId: number | null) => {
    try {
      const productIdsToMove = selectedRows.filter(id => id.startsWith('prod_')).map(id => Number(id.replace('prod_', '')))
      const categoryIdsToMove = selectedRows.filter(id => id.startsWith('cat_')).map(id => Number(id.replace('cat_', '')))

      // 1. Move Products
      if (productIdsToMove.length > 0) {
        await categoriesAPI.moveProducts(productIdsToMove, targetCategoryId)
      }

      // 2. Move Categories
      if (categoryIdsToMove.length > 0) {
        await Promise.all(categoryIdsToMove.map(async (catId) => {
          const category = categories.find(c => c.id === catId)
          if (category) {
            // Prevent moving a category into itself or one of its descendants
            if (catId === targetCategoryId || (targetCategoryId !== null && isCategoryDescendant(categories, targetCategoryId, catId))) {
              console.warn(`Skipping move for category ${category.name} to target ${targetCategoryId} due to circular reference or self-move.`)
              return
            }
            await categoriesAPI.update(String(catId), { name: category.name, parent_id: targetCategoryId })
          }
        }))
      }

      toast.success('Uğurla köçürüldü!')
      setIsMoveModalOpen(false)
      setSelectedRows([])
      await loadData() // Refresh
    } catch (e) {
      console.error('Move error:', e)
      toast.error('Köçürmə zamanı xəta baş verdi.')
    }
  }

  const handleCopy = () => {
    const selectedProdIds = selectedRows.filter(id => id.startsWith('prod_'))

    if (selectedProdIds.length !== 1) {
      toast.error('Kopyalamaq üçün zəhmət olmasa 1 məhsul seçin')
      return
    }

    const prodId = Number(selectedProdIds[0].replace('prod_', ''))
    const product = products.find(p => p.id === prodId)

    if (product) {
      const existingBarcodes = products.map(p => p.barcode).filter(Boolean) as string[]
      // Kopyalanacaq məlumatlar (kod, barkod və artikul boş)
      const productCopy = { ...product, code: '', barcode: '', article: '' }

      // Custom submit handler for copy (creates new product)
      const handleCopySubmit = async (formData: any, shouldClose: boolean) => {
        // Validation: Check for duplicates
        const isDuplicateCode = formData.code && products.some(p => p.code === formData.code)
        if (isDuplicateCode) {
          throw new Error('Bu kodla məhsul artıq mövcuddur!')
        }

        const isDuplicateBarcode = formData.barcode && products.some(p => p.barcode === formData.barcode)
        if (isDuplicateBarcode) {
          throw new Error('Bu barkodla məhsul artıq mövcuddur!')
        }

        const isDuplicateArticle = formData.article && products.some(p => p.article === formData.article)
        if (isDuplicateArticle) {
          throw new Error('Bu artikulla məhsul artıq mövcuddur!')
        }

        const generateBarcode = () => {
          const timestamp = Date.now().toString()
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
          return `BC${timestamp.slice(-8)}${random}`
        }

        let finalBarcode = formData.barcode
        if (!finalBarcode) {
          finalBarcode = generateBarcode()
          while (existingBarcodes.includes(finalBarcode)) {
            finalBarcode = generateBarcode()
          }
        }

        let finalCode = formData.code
        if (!finalCode && finalBarcode && finalBarcode.length >= 6) {
          finalCode = finalBarcode.slice(-6)
        }

        await productsAPI.create({
          name: formData.name,
          code: finalCode || undefined,
          barcode: finalBarcode || undefined,
          article: formData.article || undefined,
          description: formData.description || undefined,
          unit: formData.unit,
          purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : 0,
          sale_price: formData.sale_price ? parseFloat(formData.sale_price) : 0,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          type: formData.type || undefined,
          brand: formData.brand || undefined,
          warranty_period: (() => {
            if (formData.production_date && formData.expiry_date) {
              try {
                const productionDate = new Date(formData.production_date + 'T00:00:00')
                const expiryDate = new Date(formData.expiry_date + 'T00:00:00')
                if (!isNaN(productionDate.getTime()) && !isNaN(expiryDate.getTime())) {
                  const diffTime = Math.abs(expiryDate.getTime() - productionDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const months = Math.floor(diffDays / 30);
                  return months > 0 ? months : undefined;
                }
              } catch (e) { }
            }
            return undefined
          })(),
          production_date: formData.production_date ? new Date(formData.production_date + 'T00:00:00').toISOString() : undefined,
          expiry_date: formData.expiry_date ? new Date(formData.expiry_date + 'T00:00:00').toISOString() : undefined,
          is_active: formData.is_active
        })

        await loadData()
        await loadData()
        // toast.success('Məhsul uğurla kopyalandı!')
        if (shouldClose) {
          useWindowStore.getState().closePageWindow('copy-product')
        }
      }

      useWindowStore.getState().openPageWindow(
        'copy-product',
        'Məhsul Kopyala',
        '📋',
        <ProductForm
          product={productCopy}
          title="Məhsul Kopyala"
          mode="copy"
          categories={categories}
          existingBarcodes={existingBarcodes}
          onSubmit={handleCopySubmit}
        />,
        { width: 800, height: 700 }
      )
    }
  }

  const handlePrint = () => {
    // Seçilmiş məhsulları və ya bütün məhsulları göstər
    // For print, we mainly want products, not folders?
    // Using filteredProducts (which is GridItem[] filtered to type=product)
    const productsToPrint = selectedRows.length > 0
      ? filteredProducts.filter(p => selectedRows.includes(`prod_${p.id}`))
      : filteredProducts

    if (productsToPrint.length === 0) {
      toast.error('Çap üçün məhsul seçilməyib')
      return
    }

    // Çap üçün HTML yarat
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // Cəmləri hesabla
    let totalQuantity = 0

    productsToPrint.forEach(product => {
      const quantity = parseFloat(getWarehouseQuantity(product).toString())
      totalQuantity += quantity
    })

    // Görünən sütunlar
    const visibleCols = defaultColumns.filter(col => col.visible && col.id !== 'checkbox')
      .sort((a, b) => (a.order || 0) - (b.order || 0))

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Anbar - Çap</title>
          <style>
            @media print {
              @page { margin: 1cm; }
              body { margin: 0; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              text-align: center;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .text-right {
              text-align: right;
            }
            .summary {
              margin-top: 20px;
              padding: 15px;
              background-color: #f8f9fa;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .summary-total {
              font-weight: bold;
              font-size: 18px;
              color: #007bff;
              border-top: 2px solid #007bff;
              padding-top: 10px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <h1>Anbar - Məhsul Siyahısı</h1>
          <table>
            <thead>
              <tr>
                ${visibleCols.map(col => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${productsToPrint.map(product => {
      const quantity = getWarehouseQuantity(product)

      const qty = parseFloat(quantity.toString())


      return `
                  <tr>
                    ${visibleCols.map(col => {
        let value = ''
        switch (col.id) {
          case 'id':
            value = product.id.toString()
            break
          case 'name':
            value = product.name || '-'
            break
          case 'code':
            value = product.code || '-'
            break
          case 'barcode':
            value = product.barcode || '-'
            break
          case 'unit':
            value = product.unit || 'ədəd'
            break
          case 'purchase_price':
            value = `${product.purchase_price || 0} AZN`
            break
          case 'sale_price':
            value = `${product.sale_price || 0} AZN`
            break
          case 'quantity':
            value = `${quantity} ${product.unit || 'ədəd'}`
            break
          case 'purchase_total':
            const purchaseTotal = parseFloat(product.purchase_price?.toString() || '0') * qty
            value = `${purchaseTotal.toFixed(2)} AZN`
            break
          case 'sale_total':
            const saleTotal = parseFloat(product.sale_price?.toString() || '0') * qty
            value = `${saleTotal.toFixed(2)} AZN`
            break
          default:
            value = '-'
        }
        const alignClass = (col.id.includes('price') || col.id === 'quantity' || col.id === 'purchase_total' || col.id === 'sale_total') ? 'text-right' : ''
        return `<td class="${alignClass}">${value}</td>`
      }).join('')}
                  </tr>
                `
    }).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #f2f2f2; font-weight: bold;">
                ${visibleCols.map(col => {
      let value = ''
      switch (col.id) {
        case 'name':
          value = 'Cəmi:'
          break
        case 'purchase_price':
          // Alış qiyməti sütununun altında: sadəcə alış qiymətlərinin cəmi (qalıqla vurulmur)
          const totalPurchasePrice = productsToPrint.reduce((sum, p) => {
            const price = parseFloat(p.purchase_price?.toString() || '0')
            return sum + price
          }, 0)
          value = `${totalPurchasePrice.toFixed(2)} AZN`
          break
        case 'sale_price':
          // Satış qiyməti sütununun altında: sadəcə satış qiymətlərinin cəmi (qalıqla vurulmur)
          const totalSalePrice = productsToPrint.reduce((sum, p) => {
            const price = parseFloat(p.sale_price?.toString() || '0')
            return sum + price
          }, 0)
          value = `${totalSalePrice.toFixed(2)} AZN`
          break
        case 'quantity':
          value = totalQuantity.toFixed(2)
          break
        case 'purchase_total':
          const totalPurchaseSum = productsToPrint.reduce((sum, p) => {
            const qty = parseFloat(getWarehouseQuantity(p).toString())
            const price = parseFloat(p.purchase_price?.toString() || '0')
            return sum + (price * qty)
          }, 0)
          value = `${totalPurchaseSum.toFixed(2)} AZN`
          break
        case 'sale_total':
          const totalSaleSum = productsToPrint.reduce((sum, p) => {
            const qty = parseFloat(getWarehouseQuantity(p).toString())
            const salePrice = parseFloat(p.sale_price?.toString() || '0')
            return sum + (salePrice * qty)
          }, 0)
          value = `${totalSaleSum.toFixed(2)} AZN`
          break
        default:
          value = ''
      }
      const alignClass = (col.id.includes('price') || col.id === 'quantity' || col.id === 'purchase_total' || col.id === 'sale_total') ? 'text-right' : ''
      return `<td class="${alignClass}">${value}</td>`
    }).join('')}
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()

    // Çap pəncərəsini aç
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }


  // Məhsulları kateqoriyaya köçür
  const handleMoveToCategory = async (productIds: number[], categoryId: number | null) => {
    if (productIds.length === 0) {
      toast.error('Məhsul seçin')
      return
    }

    try {
      await categoriesAPI.moveProducts(productIds, categoryId)
      await loadData()
      setSelectedRows([])
      toast.success('Məhsullar köçürüldü')
    } catch (err: any) {
      toast.error('Köçürmə zamanı xəta baş verdi')
    }
  }

  // Papka redaktə et
  const handleEditCategory = async (category: Category) => {
    const newName = prompt('Papka adını dəyişdirin:', category.name)
    if (newName && newName.trim() && newName !== category.name) {
      try {
        await categoriesAPI.update(category.id.toString(), { name: newName.trim() })
        await loadData()
      } catch (err: any) {
        toast.error('Papka adı dəyişdirilərkən xəta baş verdi')
      }
    }
  }

  // Papka sil
  const handleDeleteCategory = async (category: Category) => {
    const productCount = category._count?.products || 0
    const executeDelete = async () => {
      try {
        await categoriesAPI.delete(category.id.toString())
        await loadData()
        if (selectedCategoryId === category.id) {
          setSelectedCategoryId(null)
        }
      } catch (err: any) {
        toast.error('Papka silinərkən xəta baş verdi')
      }
    }

    let message = `"${category.name}" papkasını silmək istəyirsiniz?`
    if (productCount > 0) {
      message = `Bu papkada ${productCount} məhsul var. Papkanı silmək istəyirsiniz?`
    }

    useWindowStore.getState().addWindow({
      id: 'confirm-delete-category',
      title: 'Papka Sil',
      icon: '⚠️',
      type: 'confirm',
      modalType: 'confirm',
      content: <ConfirmationModal
        message={message}
        onConfirm={async () => {
          await executeDelete()
          useWindowStore.getState().closeWindow('confirm-delete-category')
        }}
        onCancel={() => useWindowStore.getState().closeWindow('confirm-delete-category')}
        confirmText="Sil"
        confirmColor="#dc3545"
      />,
      size: { width: 400, height: 200 },
      position: { x: (window.innerWidth - 400) / 2, y: (window.innerHeight - 200) / 2 },
      isMaximized: false,
      isMinimized: false,
      zIndex: 9999
    })
  }

  // Papkanı başqa papkaya köçür
  const handleMoveCategory = async (category: Category) => {
    // Bütün mövcud papkaları göstər (özü və valideynlərini istisna et)
    const availableCategories = categories.filter(cat =>
      cat.id !== category.id &&
      !isCategoryDescendant(categories, cat.id, category.id)
    )

    if (availableCategories.length === 0) {
      toast.error('Başqa papka yoxdur')
      return
    }

    const categoryList = availableCategories.map(cat => {
      const path = getCategoryPath(categories, cat.id)
      return `${cat.id}: ${path}`
    }).join('\n')

    const input = prompt(
      `Papkanı köçürmək üçün valideyn papka ID-sini daxil edin (boş buraxın - kök səviyyəyə köçürmək üçün):\n\n${categoryList}`
    )

    if (input === null) return // İstifadəçi ləğv etdi

    const newParentId = input.trim() === '' ? null : parseInt(input.trim())

    if (newParentId !== null && isNaN(newParentId)) {
      toast.error('Yanlış ID')
      return
    }

    if (newParentId === category.parent_id) {
      return // Dəyişiklik yoxdur
    }

    try {
      await categoriesAPI.update(category.id.toString(), { name: category.name, parent_id: newParentId ?? undefined })
      await loadData()
    } catch (err: any) {
      toast.error('Papka köçürülərkən xəta baş verdi')
    }
  }

  // Alt papka yarat
  const handleCreateSubCategory = async (parentCategory: Category | null) => {
    const parentName = parentCategory ? `"${parentCategory.name}" papkasının daxilində` : 'kök səviyyədə'
    const name = prompt(`Yeni papka adı (${parentName}):`, '')
    if (name && name.trim()) {
      try {
        await categoriesAPI.create({
          name: name.trim(),
          parent_id: parentCategory ? parentCategory.id : undefined
        })
        await loadData()
      } catch (err: any) {
        toast.error('Papka yaradılarkən xəta baş verdi')
      }
    }
  }

  // Papka yolunu tap
  const getCategoryPath = (categories: Category[], categoryId: number): string => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return ''

    if (category.parent_id === null) {
      return category.name
    }

    const parentPath = getCategoryPath(categories, category.parent_id)
    return parentPath ? `${parentPath} > ${category.name}` : category.name
  }

  // Papka nəslini yoxla (descendant)
  const isCategoryDescendant = (categories: Category[], categoryId: number, ancestorId: number): boolean => {
    const category = categories.find(c => c.id === categoryId)
    if (!category || category.parent_id === null) return false
    if (category.parent_id === ancestorId) return true
    return isCategoryDescendant(categories, category.parent_id, ancestorId)
  }

  // localStorage-a açıq papkaları saxla


  // Qeyd: selectedCategoryId həmişə null ilə başlayır (Bütün məhsullar aktiv)
  // localStorage-də saxlanmır, çünki səhifə yenilənəndə həmişə "Bütün məhsullar" aktiv olmalıdır

  // Papka ağacının görünürlüyünü localStorage-a saxla
  useEffect(() => {
    try {
      localStorage.setItem('anbar-category-tree-visible', JSON.stringify(showCategoryTree))
    } catch (e) {
      console.error('Category tree visibility saxlanarkən xəta:', e)
    }
  }, [showCategoryTree])



  return (

    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%', padding: '5px', gap: '1px' }}>
      <UniversalToolBar
        toolbarId="products2"
        onAdd={handleAddNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCopy={handleCopy}
        onPrint={handlePrint}
        onLocate={handleLocate}
        onRefresh={loadData}
        onSearch={(term) => setSearchTerm(term)}
        onFolders={() => setShowCategoryTree(!showCategoryTree)}
        onFilter={() => {
          useWindowStore.getState().openPageWindow(
            'advanced-filter',
            'Filtrlər',
            '🔍',
            <AdvancedFilterModal
              isOpen={true}
              onClose={() => useWindowStore.getState().closeWindow('advanced-filter')}
              toolbarId="filter-mehsullar"
              initialRules={appliedFilters}
              onApply={(rules) => {
                setAppliedFilters(rules)
                // Save to localStorage
                try {
                  localStorage.setItem('products2-applied-filters', JSON.stringify(rules))
                } catch (e) {
                  console.error('Filter saxlanarkən xəta:', e)
                }
              }}
            />,
            { width: 800, height: 600 }
          )
        }}
        onSettings={() => tableRef.current?.openSettings()}
        onMove={handleMove}
        onUp={() => {
          // Up logic
          if (selectedCategoryId) {
            const current = categories.find(c => c.id === selectedCategoryId)
            if (current) setSelectedCategoryId(current.parent_id || null)
          }
        }}
      />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '5px', height: '100%', width: '100%' }}>
          {/* Papka Ağacı */}
          {showCategoryTree && (
            <div style={{
              width: `${sidebarWidth}px`,
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid #ddd',
              maxHeight: '100%',
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CategoryTree
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                onMove={handleMoveCategory}
                onCreateSubCategory={handleCreateSubCategory}
                onMoveProducts={(catId) => handleMoveToCategory(selectedRows.filter(id => id.startsWith('prod_')).map(id => Number(id.split('_')[1])), catId)}
              />
            </div>
          )}

          {/* Vertical Resizer */}
          {showCategoryTree && (
            <div
              onMouseDown={() => setIsResizingSidebar(true)}
              style={{
                width: '6px',
                cursor: 'col-resize',
                background: isResizingSidebar ? '#007bff' : 'transparent',
                transition: 'background 0.2s',
                borderRadius: '3px',
                zIndex: 10,
                margin: '0 -3px'
              }}
              onMouseEnter={(e) => { if (!isResizingSidebar) e.currentTarget.style.background = '#ddd' }}
              onMouseLeave={(e) => { if (!isResizingSidebar) e.currentTarget.style.background = 'transparent' }}
            />
          )}

          {/* Əsas Məzmun */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Breadcrumb Header */}
              <div style={{ padding: '8px 12px', background: '#fff', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '8px', color: '#333', fontSize: '14px' }}>
                <span
                  style={{ cursor: 'pointer', color: '#007bff', fontWeight: selectedCategoryId === null ? 'bold' : 'normal' }}
                  onClick={() => setSelectedCategoryId(null)}
                >
                  🏠 Ana Səhifə
                </span>
                {(() => {
                  const crumbs: Category[] = []
                  let current = categories.find(c => c.id === selectedCategoryId)
                  while (current) {
                    crumbs.unshift(current)
                    current = categories.find(c => c.id === current!.parent_id)
                  }
                  return crumbs.map((crumb, index) => (
                    <div key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>/</span>
                      <span
                        style={{ cursor: 'pointer', color: index === crumbs.length - 1 ? '#333' : '#007bff', fontWeight: index === crumbs.length - 1 ? 'bold' : 'normal' }}
                        onClick={() => setSelectedCategoryId(crumb.id)}
                      >
                        📂 {crumb.name}
                      </span>
                    </div>
                  ))
                })()}
              </div>

              <UniversalTable
                ref={tableRef}
                tableId="products2"
                data={gridData}
                columns={defaultColumns}
                loading={loading}
                getRowId={(row) => {
                  if (row.type === 'category') return `cat_${row.id}`
                  return `prod_${row.id}`
                }}
                onRowSelect={(ids) => setSelectedRows(ids as string[])}
                onRowClick={(row) => {
                  if (row.type === 'category') {
                    // If clicking an ancestor row (which represents an open folder in the stack),
                    // the user wants to "close" it, i.e., go to ITS parent.
                    if ((row as any).isParent) {
                      const parentId = (row as any).parent_id
                      setSelectedCategoryId(parentId ?? null)
                    } else {
                      // Navigate to that folder (Enter)
                      setSelectedCategoryId(row.id)
                    }
                  }
                  else if (row.type === 'product') {
                    // If onSelect is provided, call it for selection mode
                    if (onSelect) {
                      onSelect(row as Product)
                    } else {
                      // Otherwise, open edit form
                      handleEdit()
                    }
                  }
                }}
              />
            </div>
            {/* Move Modal */}
            {isMoveModalOpen && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ background: 'white', width: '500px', height: '600px', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    Qovluq Seçin
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <MoveToCategoryModal
                      categories={categories}
                      onClose={() => setIsMoveModalOpen(false)}
                      onConfirm={confirmMove}
                    />
                  </div>
                </div>
              </div>
            )}

            <div
              onMouseDown={() => setIsResizingBottom(true)}
              style={{
                height: '6px',
                cursor: 'row-resize',
                background: isResizingBottom ? '#007bff' : 'transparent',
                transition: 'background 0.2s',
                borderRadius: '3px',
                zIndex: 10,
                margin: '-3px 0'
              }}
              onMouseEnter={(e) => { if (!isResizingBottom) e.currentTarget.style.background = '#ddd' }}
              onMouseLeave={(e) => { if (!isResizingBottom) e.currentTarget.style.background = 'transparent' }}
            />

            <ProductBottomPanel
              height={bottomHeight}
              product={
                selectedRows.length > 0
                  ? products.find(p => selectedRows.includes(`prod_${p.id}`))
                  : undefined
              } />
          </div>
        </div>
      </div>
    </div>
  )
}
