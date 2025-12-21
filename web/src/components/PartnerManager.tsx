
import { useState, useEffect, useCallback, useMemo } from 'react'
import { customersAPI } from '../services/api'
import type { Customer } from '../../../shared/types'
import UniversalContainer from './UniversalContainer'
import UniversalToolBar from './UniversalToolBar'
import UniversalTable, { ColumnConfig } from './UniversalTable'
import UniversalFooter from './UniversalFooter'
import TableSettingsModal from './TableSettingsModal'
import { useNotificationStore } from '../store/notificationStore'
import PartnerForm from './PartnerForm'

interface PartnerManagerProps {
    filterType?: 'ALL' | 'BUYER' | 'SUPPLIER'
    onSelect?: (partner: Customer) => void
    initialEditId?: number
    pageTitle?: string  // Added for compatibility
}


export default function PartnerManager({ filterType = 'ALL', onSelect, initialEditId }: PartnerManagerProps) {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showSettingsModal, setShowSettingsModal] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [formData, setFormData] = useState<Partial<Customer>>({})
    const [typeFilter] = useState<'ALL' | 'BUYER' | 'SUPPLIER'>(filterType)
    const [tableColumns, setTableColumns] = useState<ColumnConfig[]>([])

    const addNotification = useNotificationStore(state => state.addNotification)

    // Fetch customers
    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true)
            const data = await customersAPI.getAll()
            setCustomers(data)
        } catch (error) {
            console.error('Failed to load customers:', error)
            addNotification('error', 'Xəta', 'Tərəfdaşlar yüklənərkən xəta baş verdi')
        } finally {
            setLoading(false)
        }
    }, [addNotification])

    useEffect(() => {
        loadCustomers()
    }, [loadCustomers])

    // Handle initial edit
    useEffect(() => {
        if (initialEditId && customers.length > 0 && !showModal) {
            const initialTarget = customers.find(c => c.id === initialEditId)
            if (initialTarget) {
                setEditingCustomer(initialTarget)
                setFormData({ ...initialTarget })
                setShowModal(true)
            }
        }
    }, [initialEditId, customers, showModal])

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
                addNotification('success', 'Uğurlu əməliyyat', `${ids.length} tərəfdaş silindi`)
            } catch (error: any) {
                console.error('Error deleting:', error)

                // Backend-dən gələn xəta mesajını göstər
                if (error.response?.data) {
                    const errorData = error.response.data

                    if (errorData.documents) {
                        // Sənədləri formatla
                        const allDocs = [
                            ...errorData.documents.sales,
                            ...errorData.documents.purchases
                        ]

                        const docList = allDocs.map((doc: any) =>
                            `${doc.type}: ${doc.number} - ${doc.amount} AZN`
                        ).join(', ')

                        addNotification(
                            'error',
                            'Silmək mümkün deyil',
                            `${errorData.message} Sənədlər: ${docList}`
                        )
                    } else {
                        addNotification('error', 'Xəta', errorData.message || 'Silinərkən xəta baş verdi')
                    }
                } else {
                    addNotification('error', 'Xəta', 'Silinərkən xəta baş verdi')
                }
            }
        }
    }, [loadCustomers, addNotification])



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

            return `${prefix}${String(maxCode + 1).padStart(8, '0')}`
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



    const [selectedIds, setSelectedIds] = useState<(number | string)[]>([])

    const handleSelection = useCallback(() => {
        if (selectedIds.length === 1 && onSelect) {
            const customer = filteredCustomers.find(c => c.id === selectedIds[0])
            if (customer) {
                onSelect(customer)
            }
        }
    }, [selectedIds, filteredCustomers, onSelect])

    // Enter key support for selection
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && selectedIds.length === 1 && onSelect && !showModal && !showSettingsModal) {
                handleSelection()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleSelection, selectedIds.length, onSelect, showModal, showSettingsModal])

    return (
        <UniversalContainer padding="5px 15px">
            <UniversalToolBar
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
                onSelect={onSelect && selectedIds.length === 1 ? handleSelection : undefined}
            />

            <UniversalTable
                data={filteredCustomers}
                columns={tableColumns}
                loading={loading}
                getRowId={(row: Customer) => row.id}
                onRowSelect={setSelectedIds}
                onRowClick={onSelect}
            />

            <UniversalFooter
                totalRecords={filteredCustomers.length}
                selectedCount={selectedIds.length}
            />

            {/* Table Settings Modal */}
            {showSettingsModal && (
                <TableSettingsModal
                    columns={tableColumns}
                    onColumnsChange={setTableColumns}
                    onClose={() => setShowSettingsModal(false)}
                />
            )}

            {/* Edit Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '600px', maxWidth: '90%' }}>
                        <h2>{editingCustomer ? 'Redaktə Et' : 'Yeni Tərəfdaş'}</h2>
                        {/* Dynamic import probably better but we can use direct import here if we import it at top */}
                        {/* Since I cannot add import easily with replace_file, I will assume I can edit imports later or use require? 
                            React lazy import is an option. 
                            But for this step I will try to use the component directly and rely on previous steps ensuring it's available or adding import.
                            Actually, I need to add import. 
                        */}
                        <PartnerForm
                            initialData={editingCustomer || (formData.name ? formData : null) as Customer}
                            onSave={() => {
                                setShowModal(false)
                                loadCustomers()
                            }}
                            onCancel={() => setShowModal(false)}
                        />
                    </div>
                </div>
            )}
        </UniversalContainer>
    )
}
