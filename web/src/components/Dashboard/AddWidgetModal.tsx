import React, { useState } from 'react'

interface AddWidgetModalProps {
    onClose: () => void
    onAdd: (type: 'quick_access' | 'overdue_invoices', data: any) => void
}

export const AddWidgetModal: React.FC<AddWidgetModalProps> = ({ onClose, onAdd }) => {
    const [type, setType] = useState<'quick_access' | 'overdue_invoices'>('quick_access')

    // Quick Access fields
    const [title, setTitle] = useState('')
    const [icon, setIcon] = useState('📦')
    const [pageId, setPageId] = useState('anbar')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (type === 'quick_access') {
            onAdd('quick_access', { title, icon, pageId })
        } else {
            onAdd('overdue_invoices', {})
        }
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
        }}>
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '16px',
                width: '400px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Widget Əlavə Et</h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Növ:</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                        >
                            <option value="quick_access">Sürətli Keçid</option>
                            <option value="overdue_invoices">Ödənişlər Cədvəli</option>
                        </select>
                    </div>

                    {type === 'quick_access' && (
                        <>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Başlıq:</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Məs: Anbar"
                                    required
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>İkon:</label>
                                    <input
                                        type="text"
                                        value={icon}
                                        onChange={(e) => setIcon(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Səhifə:</label>
                                    <select
                                        value={pageId}
                                        onChange={(e) => setPageId(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                    >
                                        <option value="anbar">Məhsullar</option>
                                        <option value="hesablar">Hesablar</option>
                                        <option value="partners">Tərəfdaşlar</option>
                                        <option value="qaimeler-satis">Satış Qaimələri</option>
                                        <option value="qaimeler-alis">Alış Qaimələri</option>
                                        <option value="kassa-medaxil">Kassa Mədaxil</option>
                                        <option value="kassa-mexaric">Kassa Məxaric</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '2rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                background: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            Ləğv Et
                        </button>
                        <button
                            type="submit"
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#667eea',
                                color: 'white',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Əlavə Et
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
