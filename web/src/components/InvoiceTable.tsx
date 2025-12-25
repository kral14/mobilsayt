import React, { useState, useEffect, useMemo } from 'react'
import type { Product } from '@shared/types'
import { InvoiceItem, TableColumnConfig, FunctionSettings } from './InvoiceTypes'
import ProductSelectCell from './ProductSelectCell'

// Helper component for numeric inputs that hides 0 but allows typing decimals
const NumberInput = ({ value, onChange, style, className, placeholder, onFocus, onBlur, onKeyDown, ...props }: any) => {
    const [localValue, setLocalValue] = useState(value === 0 ? '' : String(value))
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
        if (!isFocused) {
            // Round to max 3 decimal places for display
            if (value === 0) {
                setLocalValue('')
            } else {
                const rounded = Math.round(Number(value) * 1000) / 1000
                setLocalValue(String(rounded))
            }
        }
    }, [value, isFocused])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value

        // Enforce max 3 decimal places
        if (val.includes('.')) {
            const parts = val.split('.')
            if (parts[1] && parts[1].length > 3) {
                val = `${parts[0]}.${parts[1].substring(0, 3)}`
            }
        }

        setLocalValue(val)
        // Only trigger update if it's a valid number or empty
        const num = parseFloat(val)
        onChange(isNaN(num) ? 0 : num)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true)
        e.target.select()
        if (onFocus) onFocus(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false)
        setLocalValue(value === 0 ? '' : String(value))
        if (onBlur) onBlur(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Ensure Ctrl+A works by stopping propagation to global listeners
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
            e.stopPropagation()
        }
        if (onKeyDown) onKeyDown(e)
    }

    return (
        <input
            type="number"
            step="any"
            value={localValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onDragStart={(e) => e.preventDefault()}
            draggable={false}
            style={style}
            className={className}
            placeholder={placeholder}
            {...props}
        />
    )
}

interface InvoiceTableProps {
    items: InvoiceItem[]
    columns: TableColumnConfig[]
    onColumnsChange: (columns: TableColumnConfig[]) => void
    selectedItemIndices: number[]
    onRowSelect: (indices: number[]) => void
    functionSettings: FunctionSettings

    // Handlers
    onUpdateItem: (index: number, updates: Partial<InvoiceItem>) => void
    onProductSelect: (index: number, product: Product) => void
    onOpenProductSelect: (index: number) => void
    onOpenProductDetails: (productId: number, productName: string) => void

    // Sort
    sortColumn: string | null
    sortDirection: 'asc' | 'desc'
    onSort: (columnId: string) => void

    // Helpers
    getProductInfo: (id: number | null) => { code: string, barcode: string, unit: string }
    suggestions: Product[]
    isSearching?: boolean
    isPurchase: boolean
}

export default function InvoiceTable({
    items,
    columns,
    onColumnsChange,
    selectedItemIndices,
    onRowSelect,
    functionSettings,
    onUpdateItem,
    onProductSelect,
    onOpenProductSelect,
    onOpenProductDetails,
    getProductInfo,
    suggestions,
    isSearching,
    isPurchase,
    sortColumn,
    sortDirection,
    onSort
}: InvoiceTableProps) {
    const [focusedProductRow, setFocusedProductRow] = useState<number | null>(null)
    const [resizingColumn, setResizingColumn] = useState<string | null>(null)
    const [resizeStartX, setResizeStartX] = useState(0)
    const [resizeStartWidth, setResizeStartWidth] = useState(0)
    const [draggedColumnKey, setDraggedColumnKey] = useState<string | null>(null)

    const visibleOrderedColumns = useMemo(() => {
        return [...columns]
            .filter(column => column.visible)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
    }, [columns])

    const visibleColumnCount = visibleOrderedColumns.length

    const columnConfig = useMemo(() => {
        return columns.reduce((acc, col) => {
            acc[col.id] = col
            return acc
        }, {} as Record<string, TableColumnConfig>)
    }, [columns])

    // Resize Handlers
    const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
        e.preventDefault()
        e.stopPropagation()
        const column = columns.find(c => c.id === columnId)
        if (!column) return
        setResizingColumn(columnId)
        setResizeStartX(e.clientX)
        setResizeStartWidth(column.width || 100)
    }

    useEffect(() => {
        if (!resizingColumn) return

        const handleMouseMove = (e: MouseEvent) => {
            const diff = e.clientX - resizeStartX
            const newWidth = Math.max(5, resizeStartWidth + diff) // Min width 5px
            const updatedColumns = columns.map(col =>
                col.id === resizingColumn ? { ...col, width: newWidth } : col
            )
            onColumnsChange(updatedColumns)
        }

        const handleMouseUp = () => {
            setResizingColumn(null)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [resizingColumn, resizeStartX, resizeStartWidth, columns, onColumnsChange])


    // Drag Handlers
    const handleColumnDragStart = (e: React.DragEvent, columnId: string) => {
        setDraggedColumnKey(columnId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleColumnDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleColumnDrop = (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault()

        if (!draggedColumnKey || draggedColumnKey === targetColumnId) {
            setDraggedColumnKey(null)
            return
        }

        const draggedIndex = columns.findIndex(c => c.id === draggedColumnKey)
        const targetIndex = columns.findIndex(c => c.id === targetColumnId)

        if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedColumnKey(null)
            return
        }

        const newColumns = [...columns]
        const [draggedColumn] = newColumns.splice(draggedIndex, 1)
        newColumns.splice(targetIndex, 0, draggedColumn)

        // Update order property
        const reorderedColumns = newColumns.map((col, index) => ({ ...col, order: index }))
        onColumnsChange(reorderedColumns)
        setDraggedColumnKey(null)
    }

    const handleColumnDragEnd = () => {
        setDraggedColumnKey(null)
    }

    // Connect internal handlers to render logic variables used below
    const onColumnDragStart = handleColumnDragStart
    const onColumnDrop = handleColumnDrop
    const onResizeStart = handleResizeStart
    const onColumnDragEnd = handleColumnDragEnd
    const onColumnDragOver = handleColumnDragOver


    const renderSortIcon = (columnId: string) => {
        if (sortColumn !== columnId) {
            return (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5 }}>
                    <path d="M3 4.5L6 1.5L9 4.5M3 7.5L6 10.5L9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        }

        return sortDirection === 'asc' ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4.5L6 1.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7.5L6 10.5L9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    }

    const renderCell = (item: InvoiceItem, idx: number, columnId: string) => {
        const isSelected = selectedItemIndices.includes(idx)

        switch (columnId) {
            case 'checkbox':
                return (
                    <div style={{ textAlign: 'center' }}>
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (e.ctrlKey || e.metaKey) {
                                    if (selectedItemIndices.includes(idx)) {
                                        onRowSelect(selectedItemIndices.filter(i => i !== idx))
                                    } else {
                                        onRowSelect([...selectedItemIndices, idx])
                                    }
                                } else {
                                    onRowSelect([idx])
                                }
                            }}
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                )
            case 'number':
                return (
                    <div style={{ textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {idx + 1}
                    </div>
                )
            case 'product':
                return (
                    <ProductSelectCell
                        productName={item.product_name}
                        productId={item.product_id}
                        searchTerm={item.searchTerm || ''}
                        searchResults={suggestions}
                        isLoading={isSearching}
                        isPurchase={isPurchase}
                        isFocused={focusedProductRow === idx}
                        onFocus={() => {
                            setFocusedProductRow(idx)
                            onRowSelect([idx])
                        }}
                        onBlur={() => setFocusedProductRow(null)}
                        onSearchChange={(val) => {
                            onUpdateItem(idx, {
                                searchTerm: val,
                                product_id: null,
                                product_name: ''
                            })
                        }}
                        onSelect={(prod) => onProductSelect(idx, prod)}
                        onClear={() => onUpdateItem(idx, { product_id: null, product_name: '', searchTerm: '' })} // Or handle via onProductSearch? Original code cleared via update
                        onOpenSelect={() => onOpenProductSelect(idx)}
                        onOpenDetails={onOpenProductDetails}
                        data-row-index={idx}
                        data-col-id="product"
                    />
                )
            case 'code':
                return (
                    <div style={{ textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getProductInfo(item.product_id).code || '-'}
                    </div>
                )
            case 'barcode':
                return (
                    <div style={{ textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getProductInfo(item.product_id).barcode || '-'}
                    </div>
                )
            case 'unit':
                return (
                    <div style={{ textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getProductInfo(item.product_id).unit || '-'}
                    </div>
                )
            case 'quantity':
                return (
                    <NumberInput
                        value={item.quantity}
                        onChange={(val: number) => onUpdateItem(idx, { quantity: val })}
                        style={{ width: '100%', padding: '0.35rem', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }}
                        className="cell-input"
                    />
                )
            case 'unitPrice':
                return (
                    <NumberInput
                        value={item.unit_price}
                        onChange={(val: number) => onUpdateItem(idx, { unit_price: val })}
                        style={{ width: '100%', padding: '0.35rem', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }}
                        className="cell-input"
                    />
                )
            case 'total':
                return (
                    <div style={{ padding: '0 0.25rem' }}>
                        <NumberInput
                            value={item.total_price}
                            onChange={(val: number) => {
                                // Calculate Manual Discount based on Total Price
                                // Total = (Qty * Price) * (1 - AutoDisc/100) * (1 - ManualDisc/100)
                                // ManualDisc = 100 * (1 - Total / (Qty * Price * (1 - AutoDisc/100)))

                                const qty = item.quantity || 0
                                const price = item.unit_price || 0
                                const autoDisc = item.discount_auto || 0
                                const basePriceAfterAuto = (qty * price) * (1 - autoDisc / 100)

                                let newManualDisc = 0
                                if (basePriceAfterAuto !== 0) {
                                    // Round to 4 decimal places to avoid long numbers
                                    const rawDisc = 100 * (1 - val / basePriceAfterAuto)
                                    newManualDisc = Math.round(rawDisc * 10000) / 10000
                                }

                                onUpdateItem(idx, {
                                    discount_manual: newManualDisc,
                                    total_price: val
                                })
                            }}
                            style={{ width: '100%', padding: '0.35rem', border: '1px solid #ddd', borderRadius: '4px', background: '#f9f9f9', color: '#666', textAlign: 'center' }}
                        />
                    </div>
                )
            case 'discountAuto':
                return (
                    <div style={{ textAlign: 'center', color: '#28a745', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.discount_auto || 0}%
                    </div>
                )
            case 'discountManual':
                return (
                    <NumberInput
                        value={item.discount_manual || 0}
                        onChange={(val: number) => onUpdateItem(idx, { discount_manual: val })}
                        style={{ width: '100%', padding: '0.35rem', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }}
                        className="cell-input"
                    />
                )
            default:
                return null
        }
    }

    return (
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 10 }}>
                        {visibleOrderedColumns.map((column) => {
                            if (column.id === 'checkbox') {
                                return (
                                    <th
                                        key="checkbox"
                                        style={{
                                            padding: '0.75rem',
                                            border: '1px solid #ddd',
                                            textAlign: 'center',
                                            fontSize: '0.875rem',
                                            width: `${columnConfig.checkbox.width}px`
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedItemIndices.length === items.length && items.length > 0}
                                            onChange={() => {
                                                if (selectedItemIndices.length === items.length) {
                                                    onRowSelect([])
                                                } else {
                                                    onRowSelect(items.map((_, i) => i))
                                                }
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </th>
                                )
                            }

                            const dragProps = functionSettings.enableColumnDrag ? {
                                draggable: true,
                                onDragStart: (e: React.DragEvent) => onColumnDragStart(e, column.id),
                                onDragOver: onColumnDragOver,
                                onDrop: (e: React.DragEvent) => onColumnDrop(e, column.id),
                                onDragEnd: onColumnDragEnd
                            } : {}

                            const isRightAligned = ['quantity', 'unitPrice', 'total'].includes(column.id)

                            const commonStyle: React.CSSProperties = {
                                padding: '2px',
                                borderRight: '1px solid #dee2e6',
                                borderBottom: '2px solid #dee2e6',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: functionSettings.enableColumnDrag ? 'move' : 'default',
                                userSelect: 'none',
                                textAlign: isRightAligned ? 'right' : 'center',
                                width: `${columnConfig[column.id]?.width || 120}px`,
                                position: 'relative',
                                backgroundColor: '#fff',
                                color: '#495057',
                                // whiteSpace: 'nowrap', // Moved to inner div
                                // overflow: 'hidden',   // Moved to inner div
                                // textOverflow: 'ellipsis', // Moved to inner div
                                // textOverflow: 'ellipsis', // Moved to inner div
                                verticalAlign: 'middle',
                                height: '40px'
                            }

                            const headerContent = () => {
                                switch (column.id) {
                                    case 'number':
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                №
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5 }}>
                                                    <path d="M3 4.5L6 1.5L9 4.5M3 7.5L6 10.5L9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        )
                                    case 'product':
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                Məhsul
                                                {renderSortIcon('product')}
                                            </div>
                                        )
                                    case 'code':
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                Kod
                                                {renderSortIcon('code')}
                                            </div>
                                        )
                                    case 'barcode':
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                Barkod
                                                {renderSortIcon('barcode')}
                                            </div>
                                        )
                                    case 'unit':
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                Vahid
                                                {renderSortIcon('unit')}
                                            </div>
                                        )
                                    case 'quantity':
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                                Miqdar
                                                {renderSortIcon('quantity')}
                                            </div>
                                        )
                                    case 'unitPrice':
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                                Vahid qiymət
                                                {renderSortIcon('unitPrice')}
                                            </div>
                                        )
                                    case 'total':
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                                Cəm
                                                {renderSortIcon('total')}
                                            </div>
                                        )
                                    default:
                                        return column.label || null
                                }
                            }

                            return (
                                <th
                                    key={column.id}
                                    {...dragProps}
                                    style={commonStyle}
                                    title={column.label}
                                >
                                    <div
                                        onClick={() => onSort && onSort(column.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: isRightAligned ? 'flex-end' : 'center',
                                            height: '100%',
                                            width: '100%',
                                            gap: '4px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                        {headerContent()}
                                    </div>
                                    {functionSettings.enableColumnResize !== false && (
                                        <div
                                            onMouseDown={(e) => onResizeStart(e, column.id)}
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: '12px', // Increased width
                                                cursor: 'col-resize',
                                                zIndex: 100 // Increased Z
                                            }}
                                        />
                                    )}
                                </th>
                            )
                        })}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => {
                        const isSelected = selectedItemIndices.includes(idx)
                        return (
                            <tr
                                key={idx}
                                draggable={false}
                                onDragStart={(e) => e.preventDefault()}
                                onClick={(e) => {
                                    if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'BUTTON') {
                                        if (e.ctrlKey || e.metaKey) {
                                            if (selectedItemIndices.includes(idx)) {
                                                onRowSelect(selectedItemIndices.filter(i => i !== idx))
                                            } else {
                                                onRowSelect([...selectedItemIndices, idx])
                                            }
                                        } else {
                                            onRowSelect([idx])
                                        }
                                    }
                                }}
                                style={{
                                    background: isSelected ? '#e7f3ff' : (idx % 2 === 0 ? 'white' : '#f9f9f9'),
                                    cursor: 'pointer'
                                }}
                            >
                                {visibleOrderedColumns.map((column) => (
                                    <td key={`${column.id}-${idx}`} style={{ padding: '2px', border: '1px solid #ddd' }}>
                                        {renderCell(item, idx, column.id)}
                                    </td>
                                ))}
                            </tr>
                        )
                    })}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={visibleColumnCount} style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                                Məhsul yoxdur. Əlavə edin.
                            </td>
                        </tr>
                    )}
                </tbody>

            </table>
        </div>
    )
}
