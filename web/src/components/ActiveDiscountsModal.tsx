import { useState, useEffect } from 'react'
import { useWindow } from '../context/WindowContext'
import { useWindowStore } from '../store/windowStore'
import { discountDocumentsAPI } from '../services/api'
import { DiscountDocument } from '@shared/types'
import DiscountDocumentModal from './DiscountDocumentModal'

export default function ActiveDiscountsModal() {
    const { close } = useWindow()
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Effective Discount List
    // Structure: { productId, productName, code, percent, docNumber, startDate, endDate }
    const [effectiveDiscounts, setEffectiveDiscounts] = useState<any[]>([])

    useEffect(() => {
        loadReport()
    }, [])

    const loadReport = async () => {
        try {
            setLoading(true)
            // Fetch all active PRODUCT documents
            // We assume logical flow for Supplier docs is separate (per supplier)
            // This report is mainly for "Product Discounts" (Global Layered)
            const docs = await discountDocumentsAPI.getAllActive('PRODUCT')

            // Sort by Date DESC (Newest First)
            // Note: API might sort by proper date, checking controller it sorts by document_date desc.
            // But let's be safe.
            const sortedDocs = docs.sort((a, b) => new Date(b.document_date).getTime() - new Date(a.document_date).getTime())

            const productMap = new Map<number, any>()
            const now = new Date()

            for (const doc of sortedDocs) {
                if (!doc.items) continue

                // Check Doc Validity
                let docValid = true
                if (doc.start_date && now < new Date(doc.start_date)) docValid = false
                if (doc.end_date && now > new Date(doc.end_date)) docValid = false
                if (!docValid) continue

                for (const item of doc.items) {
                    if (!item.product) continue // Skip if no product relation (shouldn't happen for items)

                    // Specific Product Logic
                    if (item.product_id) {
                        // If we haven't found a newer rule for this product, use this one
                        if (!productMap.has(item.product_id)) {
                            productMap.set(item.product_id, {
                                productId: item.product_id,
                                productName: item.product.name,
                                code: item.product.code,
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

            // Convert to array
            setEffectiveDiscounts(Array.from(productMap.values()))

        } catch (err) {
            console.error(err)
            alert('Yükləmə xətası')
        } finally {
            setLoading(false)
        }
    }

    const filteredList = effectiveDiscounts.filter(d =>
        d.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleOpenDocument = (docId: number, docNumber: string) => {
        const { openPageWindow } = useWindow() // Wait, useWindow only provides close, openPageWindow might not be there?
        // useWindow is from context/WindowContext. Let's check context.
        // Actually, existing code uses `useWindow` but only descructs `close`.
        // I should check WindowContext.tsx if openPageWindow is available.
        // But store is global. I can use `useWindowStore`.
        // Let's import useWindowStore instead of relying on context for opening.
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
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Məhsul</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Kod</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Faiz %</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Mənbə Sənəd</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Tarix Aralığı</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Yüklənir...</td></tr>
                        ) : filteredList.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Hec bir aktiv endirim tapılmadı</td></tr>
                        ) : (
                            filteredList.map(item => (
                                <tr key={item.productId} style={{ borderBottom: '1px solid #eee' }}>
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
