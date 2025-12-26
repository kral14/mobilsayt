import { useState, useEffect, useCallback, useRef } from 'react'
import { ModalData, InvoiceItem } from '../components/InvoiceTypes'
import { Product, Customer, Supplier, DiscountDocument } from '@shared/types'
import { convertDisplayToRaw } from '../utils/dateUtils'
import { productDiscountsAPI, discountDocumentsAPI, productsAPI } from '../services/api'

interface UseInvoiceLogicProps {
    modal: ModalData
    products: Product[]
    customers: Customer[]
    suppliers: Supplier[]
    onUpdate: (modalId: string, updates: Partial<ModalData>) => void
    isPurchase: boolean
}

export const useInvoiceLogic = ({
    modal,
    products,
    customers,
    suppliers,
    onUpdate,
    isPurchase
}: UseInvoiceLogicProps) => {

    // 1. Local Data State
    const [localData, setLocalData] = useState(modal.data)
    const isSyncingFromProps = useRef(false)

    // Downward Sync (Props -> State)
    useEffect(() => {
        if (JSON.stringify(modal.data) !== JSON.stringify(localData)) {
            // console.log('[DEBUG] Downward Sync triggered!')
            isSyncingFromProps.current = true
            setLocalData(prev => ({ ...prev, ...modal.data }))
        }
    }, [modal.data])

    // Upward Sync (State -> Props - via onUpdate)
    useEffect(() => {
        if (isSyncingFromProps.current) {
            isSyncingFromProps.current = false
            return
        }

        // Debounce upward sync to prevent lag during typing
        const timeoutId = setTimeout(() => {
            if (JSON.stringify(localData) !== JSON.stringify(modal.data)) {
                onUpdate(modal.id, { data: localData })
            }
        }, 500) // 500ms debounce

        return () => clearTimeout(timeoutId)
    }, [localData, modal.data, modal.id, onUpdate])

    // Initial Date Setup
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
    }, [])

    // 2. Discount Documents State
    const [supplierDiscountDocuments, setSupplierDiscountDocuments] = useState<DiscountDocument[]>([])
    const [productDiscountDocuments, setProductDiscountDocuments] = useState<DiscountDocument[]>([])

    // Fetch Discount Documents (Purchase only)
    useEffect(() => {
        const fetchDiscount = async () => {
            if (!isPurchase) {
                setSupplierDiscountDocuments([])
                setProductDiscountDocuments([])
                return
            }
            try {
                if (localData.selectedSupplierId) {
                    const docs = await discountDocumentsAPI.getAllActive('SUPPLIER', localData.selectedSupplierId)
                    setSupplierDiscountDocuments(docs)
                } else {
                    setSupplierDiscountDocuments([])
                }
                const prodDocs = await discountDocumentsAPI.getAllActive('PRODUCT')
                setProductDiscountDocuments(prodDocs)
            } catch (err) {
                console.error('Failed to fetch discount documents:', err)
                setSupplierDiscountDocuments([])
            }
        }
        fetchDiscount()
    }, [isPurchase, localData.selectedSupplierId])

    // Calculate Auto Discount Helper
    const calculateAutoDiscount = useCallback((productId: number): number => {
        let now = new Date()
        if (localData.invoiceDate) {
            const rawDate = convertDisplayToRaw(localData.invoiceDate)
            const parsed = new Date(rawDate)
            if (!isNaN(parsed.getTime())) now = parsed
        }

        const supplier = localData.selectedSupplier || suppliers.find(s => s.id === localData.selectedSupplierId)
        const supplierPermanentDiscount = Number(supplier?.permanent_discount || 0)

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
        let supplierDocDiscount = 0
        if (activeSupplierDoc && activeSupplierDoc.items) {
            const item = activeSupplierDoc.items.find((i: any) => Number(i.product_id) === Number(productId))
            if (item) {
                supplierDocDiscount = Number(item.discount_percent)
            } else {
                const general = activeSupplierDoc.items.find((i: any) => i.product_id === null)
                if (general) supplierDocDiscount = Number(general.discount_percent)
            }
        }

        let productDiscount = 0
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

        for (const doc of validProductDocs) {
            const item = doc.items?.find((i: any) => i.product_id === productId)
            if (item) {
                productDiscount = Number(item.discount_percent)
                break
            }
        }

        if (productDiscount === 0) {
            for (const doc of validProductDocs) {
                const general = doc.items?.find((i: any) => i.product_id === null)
                if (general) {
                    productDiscount = Number(general.discount_percent)
                    break
                }
            }
        }

        return supplierPermanentDiscount + supplierDocDiscount + productDiscount
    }, [supplierDiscountDocuments, productDiscountDocuments, localData.invoiceDate, localData.selectedSupplier, localData.selectedSupplierId, suppliers])


    // 3. Helper Functions
    const handleAddEmptyRow = useCallback(() => {
        const newItems = [...localData.invoiceItems, {
            product_id: null,
            product_name: '',
            quantity: 0,
            unit_price: 0,
            total_price: 0,
        }]
        setLocalData(prev => ({ ...prev, invoiceItems: newItems }))
    }, [localData.invoiceItems])

    const handleTableUpdateItem = useCallback((index: number, updates: Partial<InvoiceItem>) => {
        setLocalData(prev => {
            const updatedItems = [...prev.invoiceItems]
            const currentItem = updatedItems[index]
            let newItem = { ...currentItem, ...updates }

            // If product name is cleared, reset all product-related fields
            if (updates.product_name === '') {
                newItem = {
                    ...newItem,
                    product_id: null,
                    unit_price: 0,
                    total_price: 0,
                    searchTerm: updates.searchTerm !== undefined ? updates.searchTerm : '',
                    discount_auto: 0,
                    discount_manual: 0,
                    vat_rate: 0,
                    unit: '',
                    product_code: '',
                    product_barcode: '',
                    product_unit: ''
                }
            }

            if ('quantity' in updates || 'unit_price' in updates || 'discount_manual' in updates || 'discount_auto' in updates) {
                const qty = newItem.quantity || 0
                const price = newItem.unit_price || 0
                const totalDisc = (newItem.discount_auto || 0) + (newItem.discount_manual || 0)
                newItem.total_price = (qty * price) * (1 - totalDisc / 100)
            }

            updatedItems[index] = newItem
            return { ...prev, invoiceItems: updatedItems }
        })
    }, [])

    const handleProductSelectInRow = useCallback(async (index: number, productId: number, preFetchedProduct?: Product) => {
        let product = preFetchedProduct || products.find(p => p.id === productId)

        // Fallback: Fetch if not locally found
        if (!product) {
            try {
                // Ensure productsAPI is imported or available. 
                // Since this hook depends on services/api, we can use it.
                // Assuming productsAPI.getById returns a Promise<Product>
                product = await productsAPI.getById(productId.toString())
            } catch (err) {
                console.error('[useInvoiceLogic] Failed to fetch product:', err)
                return
            }
        }

        if (!product) return

        const price = isPurchase ? (product.purchase_price || 0) : (product.sale_price || 0)
        const vatRate = product.tax_rate || 0

        // Optimistic Update
        setLocalData(prev => {
            const newItems = [...prev.invoiceItems]
            const currentItem = newItems[index]
            const currentQty = currentItem.quantity || 0
            const manualDisc = currentItem.discount_manual || 0
            const totalDisc = Math.min(0 + manualDisc, 100)

            newItems[index] = {
                ...currentItem,
                product_id: productId,
                product_name: product!.name, // Assert non-null as we checked above
                unit_price: price,
                discount_auto: 0,
                vat_rate: vatRate,
                total_price: (currentQty * price) * (1 - totalDisc / 100),
                searchTerm: product!.name
            }
            return { ...prev, invoiceItems: newItems }
        })

        // Async Discount Calculation
        let autoDisc = 0
        if (isPurchase) {
            autoDisc = calculateAutoDiscount(productId)
        } else {
            // Sale Logic
            const customer = localData.selectedCustomer || customers.find(c => c.id === localData.selectedCustomerId)
            const customerPermanentDiscount = Number(customer?.permanent_discount || 0)
            let customerTempDiscount = 0

            try {
                if (customer?.id) {
                    const customerDocs = await discountDocumentsAPI.getAllActive('CUSTOMER', customer.id)
                    const now = new Date()
                    const activeDoc = customerDocs.find(doc => {
                        if (doc.start_date && now < new Date(doc.start_date)) return false
                        if (doc.end_date && now > new Date(doc.end_date)) return false
                        return true
                    })

                    if (activeDoc && activeDoc.items) {
                        const productItem = activeDoc.items.find((i: any) => i.product_id === productId)
                        if (productItem) {
                            customerTempDiscount = Number(productItem.discount_percent)
                        } else {
                            const generalItem = activeDoc.items.find((i: any) => i.product_id === null)
                            if (generalItem) customerTempDiscount = Number(generalItem.discount_percent)
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to load customer discount documents', e)
            }

            const productObj = products.find(p => p.id === productId)
            const productPermanentDiscount = Number((productObj as any)?.permanent_discount || 0)
            let productTempDiscount = 0
            try {
                const discounts = await productDiscountsAPI.getAll(productId)
                const now = new Date()
                const activeDiscount = discounts.find((d: any) => {
                    const start = new Date(d.start_date)
                    const end = new Date(d.end_date)
                    return now >= start && now <= end
                })
                if (activeDiscount) productTempDiscount = Number(activeDiscount.percentage)
            } catch (e) {
                console.error('Failed to load product discounts', e)
            }
            autoDisc = customerPermanentDiscount + customerTempDiscount + productPermanentDiscount + productTempDiscount
        }

        // Final Update
        setLocalData(prev => {
            const newItems = [...prev.invoiceItems]
            if (newItems[index].product_id !== productId) return prev // Discard if changed

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

    }, [products, isPurchase, calculateAutoDiscount, localData.selectedCustomer, localData.selectedCustomerId, customers])

    // Recalculate discounts when date changes
    const initialDateRef = useRef<string | null>(null)
    useEffect(() => {
        if (modal.data.invoiceDate && !initialDateRef.current) {
            initialDateRef.current = modal.data.invoiceDate
        }
    }, []) // On mount

    useEffect(() => {
        if (!localData.invoiceItems.length) return
        if (!localData.invoiceDate || localData.invoiceDate.length < 10) return
        if (initialDateRef.current && localData.invoiceDate === initialDateRef.current) return

        setLocalData(prev => {
            const newItems = prev.invoiceItems.map(item => {
                if (!item.product_id) return item
                let autoDisc = 0
                if (isPurchase) {
                    autoDisc = calculateAutoDiscount(item.product_id)
                } else {
                    return item // Skip sales for now (can add logic later if needed)
                }

                if (item.discount_auto === autoDisc) return item

                const manualDisc = item.discount_manual || 0
                const totalDisc = Math.min(autoDisc + manualDisc, 100)
                return {
                    ...item,
                    discount_auto: autoDisc,
                    total_price: (item.quantity * item.unit_price) * (1 - totalDisc / 100)
                }
            })
            return { ...prev, invoiceItems: newItems }
        })
    }, [localData.invoiceDate, calculateAutoDiscount, isPurchase])


    // Recalculate Sales Discounts when Customer changes
    useEffect(() => {
        if (isPurchase) return
        if (!localData.invoiceItems || localData.invoiceItems.length === 0) return

        const recalculateSalesDiscounts = async () => {
            const customer = localData.selectedCustomer || customers.find(c => c.id === localData.selectedCustomerId)
            const customerDiscount = Number(customer?.permanent_discount || 0)

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
                    if (activeDiscount) productDiscount = Number(activeDiscount.percentage)
                } catch (e) { console.error(e) }

                const autoDisc = customerDiscount + productDiscount
                if (item.discount_auto === autoDisc) return item

                const manualDisc = item.discount_manual || 0
                const totalDisc = Math.min(autoDisc + manualDisc, 100)
                return {
                    ...item,
                    discount_auto: autoDisc,
                    total_price: (item.quantity * item.unit_price) * (1 - totalDisc / 100)
                }
            }))

            const hasChanges = updatedItems.some((item, index) => {
                const oldItem = localData.invoiceItems[index]
                return item.discount_auto !== oldItem.discount_auto || item.total_price !== oldItem.total_price
            })

            if (hasChanges) {
                setLocalData(prev => ({ ...prev, invoiceItems: updatedItems }))
            }
        }
        recalculateSalesDiscounts()
    }, [localData.selectedCustomerId, localData.invoiceItems.length, isPurchase, customers])


    return {
        localData,
        setLocalData,
        handleAddEmptyRow,
        handleTableUpdateItem,
        handleProductSelectInRow
    }
}
