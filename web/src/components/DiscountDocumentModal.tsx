import { useState, useEffect } from 'react'
import { useWindow } from '../context/WindowContext'
import { DiscountDocumentItem, Supplier, Product } from '@shared/types'
import { discountDocumentsAPI, productsAPI, suppliersAPI } from '../services/api'
import SmartDateInput from './SmartDateInput'

interface DiscountDocumentModalProps {
    type: 'SUPPLIER' | 'PRODUCT'
    documentId?: number | string
    onSuccess?: () => void
}

export default function DiscountDocumentModal({
    type,
    documentId,
    onSuccess
}: DiscountDocumentModalProps) {
    const { close } = useWindow()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [loadingError, setLoadingError] = useState('')

    // Form State
    const [docNumber, setDocNumber] = useState('')
    // const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0])
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16))
    const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16))
    const [entityId, setEntityId] = useState<number | null>(null)
    const [notes, setNotes] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [items, setItems] = useState<Partial<DiscountDocumentItem>[]>([])
    const [originalDocDate, setOriginalDocDate] = useState<string | null>(null) // Track original creation date

    // Selection Data
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [products, setProducts] = useState<Product[]>([])

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)

                // Load metadata
                if (type === 'SUPPLIER') {
                    const s = await suppliersAPI.getAll()
                    setSuppliers(s)
                }
                const p = await productsAPI.getAll()
                setProducts(p)

                // Load Document if Editing
                if (documentId) {
                    const doc = await discountDocumentsAPI.getById(documentId)
                    setDocNumber(doc.document_number)
                    setOriginalDocDate(typeof doc.document_date === 'string' ? doc.document_date : new Date(doc.document_date).toISOString()) // Preserve original creation date
                    // Try to use start_date/end_date if available, else fallback
                    const sDate = doc.start_date ? new Date(doc.start_date) : new Date(doc.document_date)
                    let eDate = doc.end_date ? new Date(doc.end_date) : new Date(doc.document_date)

                    // Fix for "Instant Expiry": If Start and End are identical (to the minute), extend End by 1 year
                    // This handles legacy docs or docs created where user didn't touch the dates
                    if (sDate.getTime() === eDate.getTime()) {
                        console.log('Auto-extending end date for zero-duration document')
                        eDate = new Date(sDate.getTime() + 365 * 24 * 60 * 60 * 1000)
                    }

                    setStartDate(sDate.toISOString().slice(0, 16))
                    setEndDate(eDate.toISOString().slice(0, 16))

                    setEntityId(doc.entity_id)
                    setNotes(doc.notes || '')
                    setIsActive(doc.is_active)
                    setItems(doc.items || [])
                }
            } catch (err) {
                console.error('Failed to load data:', err)
                setLoadingError('Məlumatları yükləmək mümkün olmadı')
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [type, documentId])

    // Helpers
    const handleAddItem = () => {
        setItems([...items, { product_id: null, discount_percent: 0, description: '' }])
    }

    const handleUpdateItem = (index: number, field: keyof DiscountDocumentItem, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index)
        setItems(newItems)
    }

    const handleSave = async () => {
        if (type === 'SUPPLIER' && !entityId) {
            alert('Zəhmət olmasa təchizatçı seçin')
            return
        }

        if (items.length === 0) {
            alert('Ən azı bir endirim sətri əlavə edin')
            return
        }

        try {
            setSaving(true)
            const docData = {
                document_number: docNumber || `DOC-${Date.now()}`,
                // Preserve original document_date for edits, use current time for new documents
                document_date: originalDocDate || new Date().toISOString(),
                start_date: new Date(startDate).toISOString(),
                end_date: new Date(endDate).toISOString(),
                type,
                entity_id: entityId,
                notes,
                is_active: isActive,
                items: items as any
            }

            if (documentId) {
                await discountDocumentsAPI.update(documentId, docData)
                alert('Sənəd uğurla yeniləndi!')
            } else {
                await discountDocumentsAPI.create(docData)
                alert('Sənəd uğurla yaradıldı!')
            }

            if (onSuccess) onSuccess()
            close()
        } catch (err) {
            console.error('Save failed:', err)
            alert('Yadda saxlanarkən xəta baş verdi')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Yüklənir...</div>
    if (loadingError) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{loadingError}</div>

    return (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', background: 'white' }}>
            {/* Header Section - 4 Columns Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Başlama Tarixi</label>
                    <SmartDateInput
                        value={startDate}
                        onDateChange={setStartDate}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Bitmə Tarixi</label>
                    <SmartDateInput
                        value={endDate}
                        onDateChange={setEndDate}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>

                {type === 'SUPPLIER' && (
                    <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Təchizatçı</label>
                        <select
                            value={entityId || ''}
                            onChange={e => setEntityId(Number(e.target.value))}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="">Seçin...</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', height: '36px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={e => setIsActive(e.target.checked)}
                                style={{ width: '20px', height: '20px', marginRight: '0.5rem' }}
                            />
                            {isActive ? 'Aktiv' : 'Deaktiv'}
                        </label>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Qeyd</label>
                    <input
                        type="text"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Qeydlər..."
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>
            </div>

            {/* Items Table Section */}
            <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '0.5rem', background: '#e0e0e0', fontWeight: 'bold', display: 'flex' }}>
                    <div style={{ flex: 2 }}>Məhsul (Boş qalsa ümumi tətbiq olunur)</div>
                    <div style={{ flex: 1 }}>Faiz %</div>
                    <div style={{ flex: 2 }}>Açıqlama</div>
                    <div style={{ width: '50px' }}>Sil</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {items.map((item, index) => (
                        <div key={index} style={{ display: 'flex', padding: '0.5rem', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                            <div style={{ flex: 2, paddingRight: '0.5rem' }}>
                                <select
                                    value={item.product_id || ''}
                                    onChange={e => handleUpdateItem(index, 'product_id', e.target.value ? Number(e.target.value) : null)}
                                    style={{ width: '100%', padding: '0.25rem' }}
                                >
                                    <option value="">-- Ümumi (Bütün məhsullar) --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                                <input
                                    type="number"
                                    value={item.discount_percent}
                                    onChange={e => handleUpdateItem(index, 'discount_percent', e.target.value)}
                                    style={{ width: '100%', padding: '0.25rem' }}
                                />
                            </div>
                            <div style={{ flex: 2, paddingRight: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={item.description || ''}
                                    onChange={e => handleUpdateItem(index, 'description', e.target.value)}
                                    style={{ width: '100%', padding: '0.25rem' }}
                                    placeholder="Sətir üzrə qeyd"
                                />
                            </div>
                            <div style={{ width: '50px', textAlign: 'center' }}>
                                <button
                                    onClick={() => handleRemoveItem(index)}
                                    style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ padding: '0.5rem', background: '#f9f9f9', borderTop: '1px solid #ddd' }}>
                    <button
                        onClick={handleAddItem}
                        style={{ padding: '0.5rem 1rem', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        + Sətir əlavə et
                    </button>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                <button
                    onClick={close}
                    style={{ padding: '0.75rem 1.5rem', border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Ləğv et
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ padding: '0.75rem 1.5rem', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                    {saving ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                </button>
            </div>
        </div>
    )
}
