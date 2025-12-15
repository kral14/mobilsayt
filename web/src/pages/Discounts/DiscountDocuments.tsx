import { useState, useEffect, useCallback, useMemo } from 'react'
import Layout from '../../components/Layout'
import DataTable, { ColumnConfig } from '../../components/DataTable'
import { discountDocumentsAPI } from '../../services/api'
import { DiscountDocument } from '@shared/types'
import DiscountDocumentModal from '../../components/DiscountDocumentModal'
import ActiveDiscountsModal from '../../components/ActiveDiscountsModal'
import { useWindowStore } from '../../store/windowStore'

interface DiscountDocumentsProps {
    type: 'SUPPLIER' | 'PRODUCT'
}

// Internal component with just the content
function DiscountDocumentsContent({ type }: DiscountDocumentsProps) {
    const [documents, setDocuments] = useState<DiscountDocument[]>([])
    const [loading, setLoading] = useState(true)
    const { openPageWindow } = useWindowStore()

    const loadDocuments = useCallback(async () => {
        try {
            setLoading(true)
            const data = await discountDocumentsAPI.getAll({ type })
            setDocuments(data)
        } catch (error) {
            console.error('Failed to load documents:', error)
        } finally {
            setLoading(false)
        }
    }, [type])

    useEffect(() => {
        loadDocuments()
    }, [loadDocuments])

    // Columns
    const columns = useMemo<ColumnConfig[]>(() => [
        { id: 'document_number', label: 'Sənəd №', visible: true, width: 150, order: 1 },
        {
            id: 'start_date',
            label: 'Başlama',
            visible: true,
            width: 140,
            order: 2,
            render: (val: string) => new Date(val).toLocaleString()
        },
        {
            id: 'end_date',
            label: 'Bitmə',
            visible: true,
            width: 140,
            order: 2.5,
            render: (val: string) => new Date(val).toLocaleString()
        },
        {
            id: 'active_status',
            label: 'Status',
            visible: true,
            width: 100,
            order: 3,
            align: 'center',
            render: (_: any, row: DiscountDocument) => (
                <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: row.is_active ? '#e8f5e9' : '#ffebee',
                    color: row.is_active ? '#2e7d32' : '#c62828',
                    fontWeight: 'bold'
                }}>
                    {row.is_active ? 'Aktiv' : 'Passiv'}
                </span>
            )
        },
        { id: 'notes', label: 'Qeyd', visible: true, width: 200, order: 4 }
    ], [])

    const handleOpenActiveSummary = () => {
        openPageWindow(
            'active-discounts-summary',
            'Aktiv Məhsul Endirimləri',
            '📋',
            <ActiveDiscountsModal />,
            { width: 900, height: 600 }
        )
    }

    const handleOpenNew = () => {
        // Unique ID for the new window
        const uniqueId = `discount-doc-${Date.now()}`
        openPageWindow(
            uniqueId,
            type === 'SUPPLIER' ? 'Təchizatçı Faiz Əməliyyatı' : 'Məhsul Faiz Əməliyyatı',
            '📄',
            <DiscountDocumentModal type={type} onSuccess={loadDocuments} />,
            { width: 900, height: 600 }
        )
    }

    // Header button is managed within the Layout/Return JSX below

    const handleEdit = (selectedIds: (number | string)[]) => {
        if (selectedIds.length !== 1) return
        const id = selectedIds[0]

        // Use a unique ID to allow multiple edit windows if needed, or same ID to focus
        const windowId = `discount-doc-edit-${id}`

        openPageWindow(
            windowId,
            type === 'SUPPLIER' ? 'Təchizatçı Faiz Sənədi (Redaktə)' : 'Məhsul Faiz Sənədi (Redaktə)',
            '📄',
            <DiscountDocumentModal
                type={type}
                documentId={id}
                onSuccess={() => {
                    loadDocuments()
                }}
            />,
            { width: 900, height: 600 }
        )
    }

    const handleDelete = async (selectedIds: (number | string)[]) => {
        if (!selectedIds.length) return
        if (!window.confirm(`${selectedIds.length} sənədi silmək istədiyinizə əminsiniz?`)) return

        try {
            setLoading(true)
            for (const id of selectedIds) {
                await discountDocumentsAPI.delete(id)
            }
            loadDocuments()
        } catch (err) {
            console.error('Delete failed:', err)
            alert('Silinmə zamanı xəta baş verdi')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <h1>{type === 'SUPPLIER' ? 'Təchizatçı Faiz Sənədləri' : 'Məhsul Faiz Sənədləri'}</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {type === 'PRODUCT' && (
                        <button
                            onClick={handleOpenActiveSummary}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#ff9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>📋</span> Aktiv Siyahı
                        </button>
                    )}
                    <button
                        onClick={handleOpenNew}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>+</span> Yeni Sənəd
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <DataTable
                    data={documents}
                    columns={columns}
                    loading={loading}
                    pageId={`discount-docs-${type}`}
                    title={type === 'SUPPLIER' ? 'Təchizatçı Sənədləri' : 'Məhsul Sənədləri'}
                    getRowId={(row: DiscountDocument) => row.id}
                    defaultColumns={columns}
                    toolbarActions={{
                        onEdit: handleEdit,
                        onDelete: handleDelete,
                        onSearch: () => { },
                        onFilter: () => { }
                    }}
                    onRowClick={(row) => handleEdit([row.id])}
                />
            </div>
        </div>
    )
}

// Default export uses Layout (for Routing)
export default function DiscountDocumentsPage(props: DiscountDocumentsProps) {
    return (
        <Layout>
            <DiscountDocumentsContent {...props} />
        </Layout>
    )
}

// Named exports use Content only (for Window Manager)
export function SupplierDiscountDocuments() {
    return <DiscountDocumentsContent type="SUPPLIER" />
}

export function ProductDiscountDocuments() {
    return <DiscountDocumentsContent type="PRODUCT" />
}
