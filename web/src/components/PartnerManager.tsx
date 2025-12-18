
import { useState, useEffect, useCallback, useMemo } from 'react'
import { customersAPI } from '../services/api'
import type { Customer } from '../../../shared/types'
import UniversalContainer from './UniversalContainer'
import UniversalNavbar from './UniversalNavbar'
import UniversalTable, { ColumnConfig } from './UniversalTable'
import UniversalFooter from './UniversalFooter'
import TableSettingsModal from './TableSettingsModal'

interface PartnerManagerProps {
    pageTitle: string
    filterType?: 'ALL' | 'BUYER' | 'SUPPLIER' // Optional filter
}

export default function PartnerManager({ pageTitle, filterType = 'ALL' }: PartnerManagerProps) {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showSettingsModal, setShowSettingsModal] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [formData, setFormData] = useState<Partial<Customer>>({})
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUYER' | 'SUPPLIER'>(filterType)
    const [tableColumns, setTableColumns] = useState<ColumnConfig[]>([])

    // Fetch customers
    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true)
            const data = await customersAPI.getAll()
            setCustomers(data)
        } catch (error) {
            console.error('Failed to load customers:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadCustomers()
    }, [loadCustomers])

    // Filter customers by type
    const filteredCustomers = useMemo(() => {
        if (typeFilter === 'ALL') return customers
        return customers.filter(c =>
            c.type === typeFilter || c.type === 'BOTH'
        )
    }, [customers, typeFilter])

    // Columns configuration
    const columns = useMemo<ColumnConfig[]>(() => [
        { id: 'code', label: 'Kod', visible: true, width: 100, order: 1 },
        {
            id: 'type',
            label: 'Növ',
            visible: true,
            width: 120,
            order: 2,
            render: (value: any) => {
                if (value === 'BUYER') return '🛒 Alıcı'
                if (value === 'SUPPLIER') return '📦 Satıcı'
                if (value === 'BOTH') return '🔄 Hər ikisi'
                return '🛒 Alıcı' // Default
            }
        },
        { id: 'name', label: 'Ad', visible: true, width: 200, order: 3 },
        { id: 'phone', label: 'Telefon', visible: true, width: 150, order: 4 },
        { id: 'email', label: 'Email', visible: true, width: 200, order: 5 },
        {
            id: 'permanent_discount',
            label: 'Daimi Endirim %',
            visible: true,
            width: 120,
            order: 5,
            align: 'center',
            render: (value: any) => <span style={{ fontWeight: 'bold', color: '#1976d2' }}>{value || 0}%</span>
        },
        { id: 'balance', label: 'Balans', visible: true, width: 120, order: 6, align: 'right' },
        {
            id: 'is_active',
            label: 'Status',
            visible: true,
            width: 80,
            order: 7,
            align: 'center',
            render: (value: any) => value ? '✅' : '❌'
        }
    ], [])

    // Initialize table columns
    useEffect(() => {
        if (tableColumns.length === 0) {
            setTableColumns(columns)
        }
    }, [columns, tableColumns.length])

    const handleEdit = useCallback((customer: Customer) => {
        setEditingCustomer(customer)
        setFormData({ ...customer })
        setShowModal(true)
    }, [])

    const handleDelete = useCallback(async (ids: (number | string)[]) => {
        if (confirm(`${ids.length} tərəfdaşı silmək istədiyinizə əminsiniz?`)) {
            try {
                await Promise.all(ids.map(id => customersAPI.delete(id.toString())))
                loadCustomers()
            } catch (error) {
                console.error('Error deleting:', error)
                alert('Silinərkən xəta baş verdi')
            }
        }
    }, [loadCustomers])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingCustomer) {
                await customersAPI.update(editingCustomer.id.toString(), formData)
            } else {
                await customersAPI.create(formData)
            }
            setShowModal(false)
            loadCustomers()
        } catch (error) {
            console.error('Error saving:', error)
            alert('Yadda saxlanılarkən xəta baş verdi')
        }
    }

    const openNewModal = () => {
        setEditingCustomer(null)

        // Generate code based on type
        const generateCode = (type: string) => {
            const prefix = type === 'SUPPLIER' ? 'SAT' : 'AL'
            const maxCode = customers
                .filter(c => c.code?.startsWith(prefix))
                .map(c => {
                    const num = parseInt(c.code?.substring(prefix.length) || '0')
                    return isNaN(num) ? 0 : num
                })
                .reduce((max, num) => Math.max(max, num), 0)

            return `${prefix}${String(maxCode + 1).padStart(4, '0')}`
        }

        const newCode = generateCode('BUYER')
        setFormData({
            name: '',
            code: newCode,
            permanent_discount: 0,
            is_active: true,
            type: 'BUYER'
        })
        setShowModal(true)
    }

    const contextMenuActions = useMemo(() => ({
        customItems: [
            { label: 'Redaktə et', onClick: () => console.log('Edit from context menu needed') }
        ]
    }), [])

    const [selectedIds, setSelectedIds] = useState<(number | string)[]>([])

    return (
        <UniversalContainer padding="5px 15px">
            <UniversalNavbar
                onAdd={() => {
                    openNewModal()
                }}
                onEdit={() => {
                    if (selectedIds.length === 1) {
                        const customer = filteredCustomers.find(c => c.id === selectedIds[0])
                        if (customer) handleEdit(customer)
                    }
                }}
                onDelete={() => {
                    if (selectedIds.length > 0) {
                        handleDelete(selectedIds)
                    }
                }}
                onCopy={() => {
                    // Copy functionality
                    console.log('Copy:', selectedIds)
                }}
                onPrint={() => {
                    // Print functionality
                    window.print()
                }}
                onRefresh={loadCustomers}
                onSettings={() => {
                    setShowSettingsModal(true)
                }}
                onSearch={(term) => {
                    // Search functionality
                    console.log('Search:', term)
                }}
                onFilter={() => {
                    // Filter functionality
                    console.log('Filter')
                }}
            />

            <UniversalTable
                data={filteredCustomers}
                columns={tableColumns}
                loading={loading}
                getRowId={(row: Customer) => row.id}
                onRowSelect={setSelectedIds}
            />

            <UniversalFooter
                totalRecords={filteredCustomers.length}
                selectedCount={selectedIds.length}
            />

            {/* Table Settings Modal */}
            {showSettingsModal && (
                <TableSettingsModal
                    columns={tableColumns}
                    onSave={setTableColumns}
                    onClose={() => setShowSettingsModal(false)}
                />
            )}

            {/* Edit Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '500px', maxWidth: '90%' }}>
                        <h2>{editingCustomer ? 'Redaktə Et' : 'Yeni Tərəfdaş'}</h2>
                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Növ *</label>
                                <select
                                    required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                    value={formData.type || 'BUYER'}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as 'BUYER' | 'SUPPLIER' | 'BOTH' })}
                                >
                                    <option value="BUYER">🛒 Alıcı</option>
                                    <option value="SUPPLIER">📦 Satıcı</option>
                                    <option value="BOTH">🔄 Hər ikisi</option>
                                </select>
                            </div>
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
                                        const prefix = newType === 'SUPPLIER' ? 'SAT' : 'AL'
                                        const maxCode = customers
                                            .filter(c => c.code?.startsWith(prefix))
                                            .map(c => {
                                                const num = parseInt(c.code?.substring(prefix.length) || '0')
                                                return isNaN(num) ? 0 : num
                                            })
                                            .reduce((max, num) => Math.max(max, num), 0)

                                        const newCode = `${prefix}${String(maxCode + 1).padStart(4, '0')}`
                                        setFormData({ ...formData, type: newType, code: newCode })
                                    }}
                                >
                                    <option value="BUYER">🛒 Alıcı</option>
                                    <option value="SUPPLIER">📦 Satıcı</option>
                                    <option value="BOTH">🔄 Hər ikisi</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Kod (Avtomatik)</label>
                                <input
                                    type="text"
                                    placeholder="Boş buraxın avtomatik yaradılacaq"
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
                                    onClick={() => setShowModal(false)}
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
                </div>
            )}
        </UniversalContainer>
    )
}
