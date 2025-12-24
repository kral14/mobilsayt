import { useEffect, useState, useCallback, useRef } from 'react'
import UniversalToolBar from '../components/UniversalToolBar'
import CategoryTree from '../components/CategoryTree'
import UniversalTable, { ColumnConfig, UniversalTableRef } from '../components/UniversalTable'
import { productsAPI, categoriesAPI } from '../services/api'
import type { Product, Category } from '../../../shared/types'
import { useWindowStore } from '../store/windowStore'
import ProductForm from '../components/ProductFormModal'
import AdvancedFilterModal, { FilterRule } from '../components/AdvancedFilterModal'


const defaultColumns: ColumnConfig[] = [

  { id: 'id', label: 'ID', visible: true, width: 60, order: 1 },
  { id: 'name', label: 'Məhsul adı', visible: true, width: 250, order: 2 },
  { id: 'code', label: 'Kod', visible: true, width: 100, order: 3 },
  { id: 'barcode', label: 'Barkod', visible: true, width: 130, order: 4 },
  { id: 'unit', label: 'Vahid', visible: true, width: 80, order: 5 },
  {
    id: 'purchase_price',
    label: 'Alış qiyməti',
    visible: true,
    width: 120,
    order: 6,
    align: 'right',
    render: (val: number) => !isNaN(Number(val)) ? `${Number(val).toFixed(2)} ₼` : '0.00 ₼'
  },
  {
    id: 'sale_price',
    label: 'Satış qiyməti',
    visible: true,
    width: 120,
    order: 7,
    align: 'right',
    render: (val: number) => !isNaN(Number(val)) ? `${Number(val).toFixed(2)} ₼` : '0.00 ₼'
  },
  {
    id: 'quantity',
    label: 'Qalıq',
    visible: true,
    width: 100,
    order: 8,
    align: 'right',
    render: (_val: any, row: Product) => {
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
    render: (val: number) => !isNaN(Number(val)) ? `${Number(val).toFixed(2)} ₼` : '0.00 ₼'
  },
  {
    id: 'sale_total',
    label: 'Satış cəm',
    visible: true,
    width: 120,
    order: 10,
    align: 'right',
    render: (val: number) => !isNaN(Number(val)) ? `${Number(val).toFixed(2)} ₼` : '0.00 ₼'
  },
]





interface MehsullarProps {
  initialSelectedProductId?: number | null
  onSelect?: (product: Product) => void
}

export default function Mehsullar({ initialSelectedProductId, onSelect }: MehsullarProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRows, setSelectedRows] = useState<number[]>(initialSelectedProductId ? [initialSelectedProductId] : [])

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const tableRef = useRef<UniversalTableRef>(null)




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

  useEffect(() => {
    loadProducts(selectedCategoryId)
    loadCategories()
  }, [loadProducts, loadCategories, selectedCategoryId])

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
          setSelectedRows(products.map(p => p.id))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [products, functionSettings.multiSelect])

  const handleDelete = async () => {
    if (selectedRows.length === 0) return
    if (!functionSettings.deleteEnabled) {
      alert('Delete funksiyası deaktivdir. Ayarlardan aktivləşdirin.')
      return
    }
    if (!confirm(`${selectedRows.length} məhsul silinsin?`)) return

    try {
      await Promise.all(selectedRows.map(id => productsAPI.delete(id.toString())))
      await loadProducts()
      setSelectedRows([])
    } catch (err: any) {
      alert('Silmə zamanı xəta baş verdi')
    }
  }

  // Delete düyməsi ilə silmə
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedRows.length > 0 && functionSettings.deleteEnabled) {
        e.preventDefault()
        if (!confirm(`${selectedRows.length} məhsul silinsin?`)) return

        try {
          await Promise.all(selectedRows.map(id => productsAPI.delete(id.toString())))
          await loadProducts()
          setSelectedRows([])
        } catch (err: any) {
          alert('Silmə zamanı xəta baş verdi')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedRows, functionSettings.deleteEnabled, loadProducts])

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
    if (selectedRows.length === 1) {
      const product = products.find(p => p.id === selectedRows[0])
      if (product) {
        const existingBarcodes = products.map(p => p.barcode).filter(Boolean) as string[]

        openPageWindow(
          `edit-product-${product.id}`,
          `Redaktə: ${product.name}`,
          '✏️',
          <ProductForm
            product={product}
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

              await productsAPI.update(product.id.toString(), {
                name: formData.name,
                code: formData.code || undefined,
                barcode: formData.barcode || undefined,
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

              await loadProducts(selectedCategoryId)
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

          await loadProducts(selectedCategoryId)
          if (shouldClose) {
            useWindowStore.getState().closePageWindow('new-product')
          }
        }}
      />,
      { width: 800, height: 700 }
    )
  }






  const handleCopy = () => {
    if (selectedRows.length > 0) {
      // Seçilmiş məhsulları mətn kimi kopyala
      const selectedProducts = products.filter(p => selectedRows.includes(p.id))
      const text = selectedProducts.map(p =>
        `${p.name} - ${p.barcode || 'Barkodsuz'} - ${p.sale_price} AZN`
      ).join('\n')

      navigator.clipboard.writeText(text)
        .then(() => alert('Məhsul məlumatları kopyalandı'))
        .catch(err => console.error('Kopyalama xətası:', err))
    }
  }

  const handlePrint = () => {
    // Seçilmiş məhsulları və ya bütün məhsulları göstər
    const productsToPrint = selectedRows.length > 0
      ? filteredProducts.filter(p => selectedRows.includes(p.id))
      : filteredProducts

    if (productsToPrint.length === 0) {
      alert('Çap üçün məhsul seçilməyib')
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

  const [appliedFilters, setAppliedFilters] = useState<FilterRule[]>([])

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
  const filteredProducts = products.filter(product => {
    // Basic search
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    // Advanced filters
    if (appliedFilters.length > 0) {
      return appliedFilters.every(rule => {
        const field = filterFieldMap[rule.component] || rule.component
        const val = (product as any)[field]
        const target = rule.value

        if (rule.condition === 'equals') {
          if (rule.component === 'product') return val === (target?.id)
          return String(val || '').toLowerCase() === String(target || '').toLowerCase()
        }
        if (rule.condition === 'not_equals') {
          if (rule.component === 'product') return val !== (target?.id)
          return String(val || '').toLowerCase() !== String(target || '').toLowerCase()
        }
        if (rule.condition === 'in') {
          if (!Array.isArray(target) || target.length === 0) return true
          if (rule.component === 'product') return target.some(p => p.id === val)
          return target.some(t => String(val || '').toLowerCase().includes(String(t || '').toLowerCase()))
        }
        if (rule.condition === 'not_in') {
          if (!Array.isArray(target) || target.length === 0) return true
          if (rule.component === 'product') return !target.some(p => p.id === val)
          return !target.some(t => String(val || '').toLowerCase().includes(String(t || '').toLowerCase()))
        }
        return true
      })
    }

    return true
  })







  // Sütunları sırala - REMOVED, handled internally by UniversalTable

  // Kateqoriya ağacını qur - moved to component


  // Məhsulları kateqoriyaya köçür
  const handleMoveToCategory = async (productIds: number[], categoryId: number | null) => {
    if (productIds.length === 0) {
      alert('Məhsul seçin')
      return
    }

    try {
      await categoriesAPI.moveProducts(productIds, categoryId)
      await loadProducts(selectedCategoryId)
      setSelectedRows([])
      alert('Məhsullar köçürüldü')
    } catch (err: any) {
      alert('Köçürmə zamanı xəta baş verdi')
    }
  }

  // Papka redaktə et
  const handleEditCategory = async (category: Category) => {
    const newName = prompt('Papka adını dəyişdirin:', category.name)
    if (newName && newName.trim() && newName !== category.name) {
      try {
        await categoriesAPI.update(category.id.toString(), { name: newName.trim() })
        await loadCategories()
      } catch (err: any) {
        alert('Papka adı dəyişdirilərkən xəta baş verdi')
      }
    }
  }

  // Papka sil
  const handleDeleteCategory = async (category: Category) => {
    const productCount = category._count?.products || 0
    if (productCount > 0) {
      if (!confirm(`Bu papkada ${productCount} məhsul var. Papkanı silmək istəyirsiniz?`)) {
        return
      }
    } else {
      if (!confirm(`"${category.name}" papkasını silmək istəyirsiniz?`)) {
        return
      }
    }

    try {
      await categoriesAPI.delete(category.id.toString())
      await loadCategories()
      if (selectedCategoryId === category.id) {
        setSelectedCategoryId(null)
      }
    } catch (err: any) {
      alert('Papka silinərkən xəta baş verdi')
    }
  }

  // Papkanı başqa papkaya köçür
  const handleMoveCategory = async (category: Category) => {
    // Bütün mövcud papkaları göstər (özü və valideynlərini istisna et)
    const availableCategories = categories.filter(cat =>
      cat.id !== category.id &&
      !isCategoryDescendant(categories, cat.id, category.id)
    )

    if (availableCategories.length === 0) {
      alert('Başqa papka yoxdur')
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
      alert('Yanlış ID')
      return
    }

    if (newParentId === category.parent_id) {
      return // Dəyişiklik yoxdur
    }

    try {
      await categoriesAPI.update(category.id.toString(), { name: category.name, parent_id: newParentId ?? undefined })
      await loadCategories()
    } catch (err: any) {
      alert('Papka köçürülərkən xəta baş verdi')
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
        await loadCategories()
      } catch (err: any) {
        alert('Papka yaradılarkən xəta baş verdi')
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
        toolbarId="mehsullar"
        onAdd={handleAddNew}
        onEdit={() => handleEdit()}
        onDelete={handleDelete}
        onCopy={handleCopy}
        onPrint={handlePrint}
        onRefresh={() => loadProducts(selectedCategoryId)}
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
              onApply={(rules) => {
                setAppliedFilters(rules)
                useWindowStore.getState().closeWindow('advanced-filter')
              }}
            />,
            { width: 800, height: 600 }
          )
        }}
        onSettings={() => tableRef.current?.openSettings()}
      />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '5px', height: '100%', width: '100%' }}>
          {/* Papka Ağacı */}
          {showCategoryTree && (
            <div style={{
              width: '300px',
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
                onMoveProducts={(catId) => handleMoveToCategory(selectedRows, catId)}
              />
            </div>
          )}

          {/* Əsas Məzmun */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <UniversalTable
              ref={tableRef}
              tableId="mehsullar"
              data={filteredProducts}
              columns={defaultColumns}
              loading={loading}
              getRowId={(row) => row.id}
              onRowSelect={(ids) => setSelectedRows(ids as number[])}
              onRowClick={(row) => {
                if (onSelect) {
                  onSelect(row)
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

