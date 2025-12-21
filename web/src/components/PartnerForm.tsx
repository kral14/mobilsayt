import { useState, useEffect } from 'react'
import { Customer, Supplier } from '@shared/types'
import { customersAPI } from '../services/api'
import { useNotificationStore } from '../store/notificationStore'

type Partner = Customer | Supplier

interface PartnerFormProps {
    initialData?: Partner | null
    onSave: () => void
    onCancel: () => void
}

export default function PartnerForm({ initialData, onSave, onCancel }: PartnerFormProps) {
    const [formData, setFormData] = useState<Partial<Customer>>({})
    const addNotification = useNotificationStore(state => state.addNotification)

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData })
        } else {
            // Default (empty) state logic could go here, 
            // but for now we expect PartnerManager to handle default creation state 
            // or we handle it if needed.
            setFormData({
                name: '',
                is_active: true,
                type: 'BUYER',
                permanent_discount: 0,
                balance: 0
            })
        }
    }, [initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (initialData?.id) {
                await customersAPI.update(initialData.id.toString(), formData)
                addNotification('success', 'Uğurlu əməliyyat', 'Tərəfdaş yeniləndi')
            } else {
                await customersAPI.create(formData)
                addNotification('success', 'Uğurlu əməliyyat', 'Yeni tərəfdaş əlavə edildi')
            }
            onSave()
        } catch (error) {
            console.error('Error saving:', error)
            addNotification('error', 'Xəta', 'Yadda saxlanılarkən xəta baş verdi')
        }
    }

    return (
        <div style={{ padding: '0 1rem' }}>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Ad *</label>
                    <input
                        type="text"
                        required
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                {/* Type Selector */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Növ</label>
                    <select
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        value={formData.type || 'BUYER'}
                        onChange={e => {
                            const newType = e.target.value as 'BUYER' | 'SUPPLIER' | 'BOTH'
                            // NOTE: Code generation logic removed from here as it requires full list.
                            // If user changes type, they might need to update code manually or 
                            // we keep the old code.
                            setFormData({ ...formData, type: newType })
                        }}
                    >
                        <option value="BUYER">🛒 Alıcı</option>
                        <option value="SUPPLIER">📦 Satıcı</option>
                        <option value="BOTH">🔄 Hər ikisi</option>
                    </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Kod</label>
                    <input
                        type="text"
                        placeholder="Kod"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                    />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Telefon</label>
                        <input
                            type="text"
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                            value={formData.phone || ''}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                        <input
                            type="email"
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Ünvan</label>
                    <input
                        type="text"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        value={formData.address || ''}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1565c0' }}>Daimi Endirim %</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #90caf9', borderRadius: '4px' }}
                            value={formData.permanent_discount || 0}
                            onChange={e => setFormData({ ...formData, permanent_discount: parseFloat(e.target.value) })}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Balans</label>
                        <input
                            type="number"
                            step="0.01"
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                            value={formData.balance || 0}
                            onChange={e => setFormData({ ...formData, balance: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{ padding: '0.5rem 1rem', border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Ləğv et
                    </button>
                    <button
                        type="submit"
                        style={{ padding: '0.5rem 1rem', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Yadda saxla
                    </button>
                </div>
            </form>
        </div>
    )
}
