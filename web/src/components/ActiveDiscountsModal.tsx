import { useState, useEffect } from 'react'
import { useWindow } from '../context/WindowContext'
import { discountDocumentsAPI, suppliersAPI } from '../services/api' // Added suppliersAPI
import { DiscountDocument, Supplier } from '@shared/types'
import { useWindowStore } from '../store/windowStore'
import DiscountDocumentModal from './DiscountDocumentModal'

interface ActiveDiscountsModalProps {
    type?: 'PRODUCT' | 'SUPPLIER'
}

export default function ActiveDiscountsModal({ type = 'PRODUCT' }: ActiveDiscountsModalProps) {
    const { close } = useWindow()
    const { openPageWindow } = useWindowStore()
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Effective Discount List
    // For Product: { productId, productName, code, percent, docNumber, startDate, endDate }
    // For Supplier: { supplierId, supplierName, productId, productName, code, percent, docNumber, startDate, endDate }
    const [effectiveDiscounts, setEffectiveDiscounts] = useState<any[]>([])

    useEffect(() => {
        loadReport()
    }, [type])

    const loadReport = async () => {
        try {
            setLoading(true)

            // 1. Fetch Documents
            const docs = await discountDocumentsAPI.getAllActive(type)
            console.log('[ActiveDiscountsModal] Fetched documents:', docs)
            console.log('[ActiveDiscountsModal] Document count:', docs.length)
            console.log('[ActiveDiscountsModal] Type:', type)

            // 2. Fetch Suppliers if needed
            let supplierMap = new Map<number, Supplier>()
            if (type === 'SUPPLIER') {
                try {
                    const suppliers = await suppliersAPI.getAll()
                    suppliers.forEach(s => supplierMap.set(s.id, s))
                } catch (e) {
                    console.error('Failed to load suppliers', e)
                }
            }

            // Sort by start_date DESC (or document_date if start_date is null)
            // This prioritizes documents by their validity period, not when they were last saved
            const sortedDocs = docs.sort((a, b) => {
                const aDate = new Date(a.start_date || a.document_date).getTime()
                const bDate = new Date(b.start_date || b.document_date).getTime()
                return bDate - aDate
            })

            const list: any[] = []

            // For Product Type: We want strict "Active Rule" per product (One per product)
            // For Supplier Type: We want "Active Rule" per Supplier+Product combo? 
            // Actually, for Supplier, a user wants to see "What is the active discount for Product X from Supplier Y?"
            // So we should list ALL active rules.

            if (type === 'PRODUCT') {
                const productMap = new Map<number, any>()
                const now = new Date()
                // Set to start of day for date-only comparison
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

                for (const doc of sortedDocs) {
                    console.log('[ActiveDiscountsModal] Processing doc:', doc.id, 'items:', doc.items)

                    if (!doc.items) {
                        console.log('[ActiveDiscountsModal] Doc has no items, skipping:', doc.id)
                        continue
                    }

                    // Check validity - compare dates only, not time
                    let docValid = true
                    if (doc.start_date) {
                        const startDate = new Date(doc.start_date)
                        const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
                        if (today < startDay) docValid = false
                    }
                    if (doc.end_date) {
                        const endDate = new Date(doc.end_date)
                        const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
                        if (today > endDay) docValid = false
                    }

                    console.log('[ActiveDiscountsModal] Doc validity:', doc.id, 'valid:', docValid, 'start:', doc.start_date, 'end:', doc.end_date, 'today:', today)

                    if (!docValid) {
                        console.log('[ActiveDiscountsModal] Doc not valid, skipping:', doc.id)
                        continue
                    }

                    for (const item of doc.items) {
                        console.log('[ActiveDiscountsModal] Processing item:', item.id, 'product:', item.product, 'product_id:', item.product_id)

                        if (!item.product) {
                            console.log('[ActiveDiscountsModal] Item has no product, skipping:', item.id)
                            continue
                        }

                        // Specific Product
                        if (item.product_id) {
                            if (!productMap.has(item.product_id)) {
                                const entry = {
                                    id: `${doc.id}-${item.id}`,
                                    productName: item.product.name,
                                    code: item.product.code,
                                    percent: Number(item.discount_percent),
                                    docNumber: doc.document_number,
                                    docId: doc.id,
                                    startDate: doc.start_date,
                                    endDate: doc.end_date
                                }
                                console.log('[ActiveDiscountsModal] Adding product to map:', entry)
                                productMap.set(item.product_id, entry)
                            }
                        }
                    }
                }
                list.push(...Array.from(productMap.values()))
            } else {
                // SUPPLIER TYPE
                // We list all active connections. 
                // A supplier might have multiple docs? 
                // Usually "Newest Valid Doc" per Supplier is the rule.

                // Group by Supplier
                const now = new Date()
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                const supplierDocMap = new Map<number, DiscountDocument[]>()

                for (const doc of sortedDocs) {
                    if (!doc.entity_id) continue
                    const existing = supplierDocMap.get(doc.entity_id) || []
                    existing.push(doc)
                    supplierDocMap.set(doc.entity_id, existing)
                }

                // For each supplier, process docs newest to oldest
                for (const [supplierId, sDocs] of supplierDocMap.entries()) {
                    const supplier = supplierMap.get(supplierId)
                    const supplierName = supplier ? supplier.name : `Təchizatçı #${supplierId}`

                    // Helper to track which products we found a rule for THIS supplier
                    const productFound = new Set<number | string>() // use string 'general' for null

                    for (const doc of sDocs) {
                        if (!doc.items) continue

                        // Check validity - compare dates only, not time
                        let docValid = true
                        if (doc.start_date) {
                            const startDate = new Date(doc.start_date)
                            const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
                            if (today < startDay) docValid = false
                        }
                        if (doc.end_date) {
                            const endDate = new Date(doc.end_date)
                            const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
                            if (today > endDay) docValid = false
                        }
                        if (!docValid) continue

                        for (const item of doc.items) {
                            const key = item.product_id ? item.product_id : 'general'
                            if (productFound.has(key)) continue // Already found newer rule for this product/general

                            productFound.add(key)

                            list.push({
                                id: `${doc.id}-${item.id}`,
                                supplierName,
                                productName: item.product ? item.product.name : 'Bütün Məhsullar (Ümumi)',
                                code: item.product ? item.product.code : '-',
                                percent: Number(item.discount_percent),
                                docNumber: doc.document_number,
                                docId: doc.id,
                                startDate: doc.start_date,
                                endDate: doc.end_date
                            })
                        }
                    }
                }
            }

            console.log('[ActiveDiscountsModal] Effective discounts list:', list)
            console.log('[ActiveDiscountsModal] Total count:', list.length)
            setEffectiveDiscounts(list)

        } catch (err) {
            console.error('[ActiveDiscountsModal] Load error:', err)
            alert('Yükləmə xətası')
        } finally {
            setLoading(false)
        }
    }

    const filteredList = effectiveDiscounts.filter(d => {
        const text = searchTerm.toLowerCase()
        return (
            (d.productName && d.productName.toLowerCase().includes(text)) ||
            (d.code && d.code.toLowerCase().includes(text)) ||
            (d.supplierName && d.supplierName.toLowerCase().includes(text))
        )
    })

    const handleOpenDocument = (docId: number, docNumber: string) => {
        const windowId = `discount-doc-edit-${docId}`

        const title = type === 'SUPPLIER'
            ? `Təchizatçı Faiz Sənədi (${docNumber})`
            : `Məhsul Faiz Sənədi (${docNumber})`

        openPageWindow(
            windowId,
            title,
            '📄',
            <DiscountDocumentModal
                type={type}
                documentId={docId}
                onSuccess={() => {
                    loadReport()
                }}
            />,
            { width: 900, height: 600 }
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem', background: 'white' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Axtarış..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ padding: '0.5rem', width: '300px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <button
                    onClick={loadReport}
                    style={{ padding: '0.5rem 1rem', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Yenilə
                </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f5f5f5' }}>
                        <tr>
                            {type === 'SUPPLIER' && (
                                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Təchizatçı</th>
                            )}
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Məhsul</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Kod</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Faiz %</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Mənbə Sənəd</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Tarix Aralığı</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={type === 'SUPPLIER' ? 6 : 5} style={{ padding: '2rem', textAlign: 'center' }}>Yüklənir...</td></tr>
                        ) : filteredList.length === 0 ? (
                            <tr><td colSpan={type === 'SUPPLIER' ? 6 : 5} style={{ padding: '2rem', textAlign: 'center' }}>Hec bir aktiv endirim tapılmadı</td></tr>
                        ) : (
                            filteredList.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                    {type === 'SUPPLIER' && (
                                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{item.supplierName}</td>
                                    )}
                                    <td style={{ padding: '0.75rem' }}>{item.productName}</td>
                                    <td style={{ padding: '0.75rem' }}>{item.code}</td>
                                    <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#4caf50' }}>{item.percent}%</td>
                                    <td
                                        style={{ padding: '0.75rem', cursor: 'pointer' }}
                                        onClick={() => handleOpenDocument(item.docId, item.docNumber)}
                                        title="Sənədə bax"
                                    >
                                        <span style={{ color: '#2196f3', textDecoration: 'underline' }}>{item.docNumber}</span>
                                    </td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#666' }}>
                                        {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                <button
                    onClick={close}
                    style={{ padding: '0.5rem 1rem', border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Bağla
                </button>
            </div>
        </div>
    )
}
