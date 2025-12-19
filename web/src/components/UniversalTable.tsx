import React, { useState, useEffect, useMemo } from 'react'

export interface ColumnConfig {
    id: string
    label: string
    visible?: boolean
    width?: number
    align?: 'left' | 'right' | 'center'
    sortable?: boolean
    order?: number
    render?: (value: any, row: any) => React.ReactNode
}

interface UniversalTableProps<T = any> {
    data: T[]
    columns: ColumnConfig[]
    loading?: boolean
    selectable?: boolean
    sortable?: boolean
    getRowId: (row: T) => number | string
    onRowSelect?: (ids: (number | string)[]) => void
    onRowClick?: (row: T) => void
}

/**
 * UniversalTable - Universal cədvəl komponenti
 * 
 * Sadə və universal cədvəl - toolbar yoxdur, yalnız cədvəl funksionallığı.
 * Avtomatik flex: 1 layout və scroll.
 */
export default function UniversalTable<T = any>({
    data,
    columns,
    loading = false,
    selectable = true,
    sortable = true,
    getRowId,
    onRowSelect,
    onRowClick
}: UniversalTableProps<T>) {
    const [selectedRows, setSelectedRows] = useState<(number | string)[]>([])
    const [sortConfig, setSortConfig] = useState<{ column: string | null; direction: 'asc' | 'desc' }>({
        column: null,
        direction: 'asc'
    })

    // Seçilmiş sətirlər dəyişdikdə callback çağır
    useEffect(() => {
        if (onRowSelect) {
            onRowSelect(selectedRows)
        }
    }, [selectedRows, onRowSelect])

    // Ctrl+A - hamısını seç
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault()
                const allIds = data.map(row => getRowId(row))
                setSelectedRows(allIds)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [data, getRowId])

    // Sıralama
    const handleSort = (columnId: string) => {
        if (!sortable) return

        setSortConfig(prev => {
            if (prev.column === columnId) {
                return {
                    column: columnId,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                }
            }
            return {
                column: columnId,
                direction: 'asc'
            }
        })
    }

    // Sıralanmış məlumatlar
    const sortedData = useMemo(() => {
        if (!sortConfig.column || !sortable) {
            return data
        }

        return [...data].sort((a, b) => {
            const aValue = (a as any)[sortConfig.column!]
            const bValue = (b as any)[sortConfig.column!]

            if (aValue === null || aValue === undefined) return 1
            if (bValue === null || bValue === undefined) return -1

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
            }

            const aStr = String(aValue).toLowerCase()
            const bStr = String(bValue).toLowerCase()

            if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1
            if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })
    }, [data, sortConfig, sortable])

    // Row seçimi
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = sortedData.map(row => getRowId(row))
            setSelectedRows(allIds)
        } else {
            setSelectedRows([])
        }
    }


    const handleSelectRow = (id: number | string, event?: React.MouseEvent) => {
        const isCtrlPressed = event?.ctrlKey || event?.metaKey

        if (!isCtrlPressed) {
            setSelectedRows([id])
            return
        }

        setSelectedRows(prev => {
            if (prev.includes(id)) {
                return prev.filter(rowId => rowId !== id)
            } else {
                return [...prev, id]
            }
        })
    }

    // Double-click detection
    const [lastClickTime, setLastClickTime] = useState<number>(0)
    const [lastClickedId, setLastClickedId] = useState<number | string | null>(null)

    const handleRowClick = (row: any, id: number | string, event: React.MouseEvent) => {
        const now = Date.now()
        const timeDiff = now - lastClickTime

        // İkinci klik (double-click)
        if (lastClickedId === id && timeDiff < 300) {
            // Sənədi aç
            if (onRowClick) {
                onRowClick(row)
            }
            setLastClickTime(0)
            setLastClickedId(null)
        } else {
            // İlk klik - sətri seç
            if (selectable) {
                handleSelectRow(id, event)
            }
            setLastClickTime(now)
            setLastClickedId(id)
        }
    }

    // Görünən sütunlar
    const visibleColumns = columns.filter(col => col.visible !== false)

    return (
        <div style={{
            flex: 1,
            overflow: 'auto',
            minHeight: 0,
            backgroundColor: 'white'
            // border: '2px solid blue' // DEBUG: Table - Removed
        }}>
            {loading && (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    Yüklənir...
                </div>
            )}

            {!loading && (
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white'
                }}>
                    <thead>
                        <tr style={{
                            background: '#f8f9fa',
                            borderBottom: '2px solid #dee2e6',
                            position: 'sticky',
                            top: 0,
                            zIndex: 10
                        }}>
                            {selectable && (
                                <th style={{
                                    padding: '0.75rem',
                                    textAlign: 'left',
                                    borderRight: '1px solid #dee2e6',
                                    width: '40px',
                                    backgroundColor: '#f8f9fa'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.length === sortedData.length && sortedData.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                            )}

                            {visibleColumns.map((column) => {
                                const isSortable = sortable && column.sortable !== false
                                const isSorted = sortConfig.column === column.id
                                const align = column.align || 'left'

                                return (
                                    <th
                                        key={column.id}
                                        onClick={() => isSortable && handleSort(column.id)}
                                        style={{
                                            padding: '0.75rem',
                                            textAlign: align,
                                            borderRight: '1px solid #dee2e6',
                                            width: column.width,
                                            cursor: isSortable ? 'pointer' : 'default',
                                            userSelect: 'none',
                                            background: isSorted ? '#e3f2fd' : '#f8f9fa',
                                            position: 'relative'
                                        }}
                                        title={isSortable ? 'Sıralamaq üçün klikləyin' : ''}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start'
                                        }}>
                                            <span>{column.label}</span>
                                            {isSortable && (
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    color: isSorted ? '#1976d2' : '#999',
                                                    fontWeight: isSorted ? 'bold' : 'normal'
                                                }}>
                                                    {isSorted ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '⇅'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>

                    <tbody>
                        {sortedData.map((row, index) => {
                            const rowId = getRowId(row)
                            const isSelected = selectedRows.includes(rowId)

                            return (
                                <tr
                                    key={rowId}
                                    onClick={(e) => handleRowClick(row, rowId, e)}
                                    style={{
                                        background: isSelected ? '#e3f2fd' : index % 2 === 0 ? 'white' : '#f8f9fa',
                                        cursor: selectable || onRowClick ? 'pointer' : 'default',
                                        borderBottom: '1px solid #dee2e6'
                                    }}
                                >
                                    {selectable && (
                                        <td style={{
                                            padding: '0.75rem',
                                            borderRight: '1px solid #dee2e6'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => { }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </td>
                                    )}

                                    {visibleColumns.map((column) => {
                                        const value = (row as any)[column.id]
                                        const align = column.align || 'left'

                                        return (
                                            <td
                                                key={column.id}
                                                style={{
                                                    padding: '0.75rem',
                                                    textAlign: align,
                                                    borderRight: '1px solid #dee2e6',
                                                    userSelect: 'text',
                                                    cursor: 'text'
                                                }}
                                                onClick={(e) => {
                                                    // Mətni seç
                                                    const range = document.createRange();
                                                    const selection = window.getSelection();
                                                    range.selectNodeContents(e.currentTarget);
                                                    selection?.removeAllRanges();
                                                    selection?.addRange(range);

                                                    // Event propagation dayandır ki, row click-ə təsir etməsin (əgər lazımdırsa)
                                                    // Amma row da seçilməlidir, ona görə dayandırmırıq.
                                                }}
                                            >
                                                {column.render ? column.render(value, row) : value}
                                            </td>
                                        )
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}

            {!loading && sortedData.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                    Məlumat yoxdur
                </div>
            )}
        </div>
    )
}
