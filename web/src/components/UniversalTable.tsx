import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useWindowStore } from '../store/windowStore'
import TableSettingsModal, { FunctionSettings } from './TableSettingsModal'

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
    tableId?: string // Unique ID for persistence
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
 * Özünü idarə edən (self-contained) cədvəl:
 * - Sütunların yerinin dəyişdirilməsi (Drag & Drop)
 * - Sütunların ölçüsünün dəyişdirilməsi (Resize)
 * - Ayarların yadda saxlanması (LocalStorage) - tableId varsa
 * - Context Menu (Sağ klik) ilə ayarlar pəncərəsi
 */
// Define ref interface
export interface UniversalTableRef {
    openSettings: () => void
}

/**
 * UniversalTable - Universal cədvəl komponenti
 * 
 * Özünü idarə edən (self-contained) cədvəl:
 * - Sütunların yerinin dəyişdirilməsi (Drag & Drop)
 * - Sütunların ölçüsünün dəyişdirilməsi (Resize)
 * - Ayarların yadda saxlanması (LocalStorage) - tableId varsa
 * - Context Menu (Sağ klik) ilə ayarlar pəncərəsi
 */
const UniversalTable = React.forwardRef<UniversalTableRef, UniversalTableProps<any>>(({
    tableId,
    data,
    columns: initialColumns,
    loading = false,
    selectable = true,
    sortable = true,
    getRowId,
    onRowSelect,
    onRowClick
}, ref) => {
    // Columns configuration state
    const [columns, setColumns] = useState<ColumnConfig[]>(() => {
        // Load from local storage if tableId is present
        if (tableId) {
            try {
                const saved = localStorage.getItem(`table-config-${tableId}`)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    // Merge saved config with initial columns (only accept user preferences)
                    return initialColumns.map(col => {
                        const savedCol = parsed.find((p: any) => p.id === col.id)
                        if (savedCol) {
                            return {
                                ...col,
                                width: savedCol.width ?? col.width,
                                visible: savedCol.visible ?? col.visible,
                                order: savedCol.order ?? col.order
                            }
                        }
                        return col
                    }).sort((a, b) => (a.order || 0) - (b.order || 0))
                }
            } catch (e) {
                console.error('Table config load error', e)
            }
        }
        return initialColumns.map((col, index) => ({ ...col, order: index }))
    })

    // Sync columns when props change (fixes HMR and dynamic column updates)
    useEffect(() => {
        if (tableId) {
            try {
                const saved = localStorage.getItem(`table-config-${tableId}`)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    // Merge saved config with initial columns (only accept user preferences)
                    const reconciled = initialColumns.map(col => {
                        const savedCol = parsed.find((p: any) => p.id === col.id)
                        if (savedCol) {
                            return {
                                ...col,
                                width: savedCol.width ?? col.width,
                                visible: savedCol.visible ?? col.visible,
                                order: savedCol.order ?? col.order
                            }
                        }
                        return col
                    }).sort((a, b) => (a.order || 0) - (b.order || 0))
                    setColumns(reconciled)
                    return
                }
            } catch (e) {
                console.error('Table config sync error', e)
            }
        }
        setColumns(initialColumns.map((col, index) => ({ ...col, order: index })))
    }, [initialColumns, tableId])

    const [selectedRows, setSelectedRows] = useState<(number | string)[]>([])
    const [sortConfig, setSortConfig] = useState<{ column: string | null; direction: 'asc' | 'desc' }>({
        column: null,
        direction: 'asc'
    })

    const [functionSettings, setFunctionSettings] = useState<FunctionSettings>({
        enableColumnDrag: true,
        enableColumnResize: true
    })

    // Save columns to local storage
    const saveColumns = (newColumns: ColumnConfig[]) => {
        setColumns(newColumns)
        if (tableId) {
            const toSave = newColumns.map(({ render, ...rest }) => rest) // Don't save functions
            localStorage.setItem(`table-config-${tableId}`, JSON.stringify(toSave))
        }
    }

    const openSettings = () => {
        // Open settings via WindowStore
        useWindowStore.getState().openPageWindow(
            `table-settings-${tableId || 'default'}`,
            'Cədvəl Ayarları',
            '⚙️',
            <TableSettingsModal
                columns={columns}
                onColumnsChange={saveColumns}
                onClose={() => useWindowStore.getState().closeWindow(`table-settings-${tableId || 'default'}`)}
                embedded={true}
                defaultColumns={initialColumns}
                showFunctionsTab={true}
                functionSettings={functionSettings}
                onFunctionSettingsChange={(settings) => {
                    setFunctionSettings(settings)
                    if (tableId) {
                        // Load current to preserve columns if needed, though usually we have them.
                        // We are changing functions, columns shouldn't change here.
                        // But to be safe, we read or just save generic structure.
                        // We need to transition from Array-only storage to Object storage.
                        const current = localStorage.getItem(`table-config-${tableId}`)
                        let newConfig: any = { functions: settings }
                        if (current) {
                            try {
                                const parsed = JSON.parse(current)
                                if (Array.isArray(parsed)) {
                                    newConfig.columns = parsed
                                } else {
                                    newConfig = { ...parsed, functions: settings }
                                }
                            } catch (e) { }
                        }
                        localStorage.setItem(`table-config-${tableId}`, JSON.stringify(newConfig))
                    }
                }}
                onSaveAsDefault={() => {
                    if (tableId) {
                        const colsToSave = columns.map(({ render, ...rest }) => rest)
                        const config = {
                            columns: colsToSave,
                            functions: functionSettings
                        }
                        localStorage.setItem(`table-config-${tableId}`, JSON.stringify(config))
                        alert('Ayarlar varsayılan olaraq saxlanıldı!')
                    }
                }}
            />,
            { width: 700, height: 600 }
        )
    }

    // Expose openSettings via ref
    React.useImperativeHandle(ref, () => ({
        openSettings
    }))

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        openSettings()
    }

    // Ctrl+A - Select All
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Log all Ctrl presses to debug
            if (e.ctrlKey || e.metaKey) {
                console.log('[UniversalTable] Ctrl key detected. Code:', e.code, 'Key:', e.key)
            }

            if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'a' || e.code === 'KeyA')) {
                const target = e.target as HTMLElement
                console.log('[UniversalTable] Ctrl+A candidate. Target:', target.tagName)

                // Allow checkboxes and buttons, block text inputs
                if (
                    target.matches('textarea, [contenteditable="true"]') ||
                    (target.matches('input') && !['checkbox', 'radio', 'button', 'submit', 'image', 'range', 'color'].includes((target as HTMLInputElement).type))
                ) {
                    console.log('[UniversalTable] Blocked by input focus')
                    return
                }

                console.log('[UniversalTable] Executing Select All. Rows:', data.length)
                e.preventDefault()
                e.stopPropagation()
                const allIds = data.map(row => getRowId(row))
                setSelectedRows(allIds)
            }
        }

        window.addEventListener('keydown', handleKeyDown, true)
        return () => window.removeEventListener('keydown', handleKeyDown, true)
    }, [data, getRowId])

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
        setLastClickTime(now)
        setLastClickedId(id)
    }

    // --- Resizing Logic ---
    const resizingRef = useRef<{ startX: number, startWidth: number, columnId: string } | null>(null)

    const handleResizeStart = (e: React.MouseEvent, columnId: string, currentWidth: number) => {
        e.preventDefault()
        e.stopPropagation()
        resizingRef.current = {
            startX: e.pageX,
            startWidth: currentWidth || 100,
            columnId
        }
        document.addEventListener('mousemove', handleResizeMove)
        document.addEventListener('mouseup', handleResizeEnd)
    }

    const handleResizeMove = (e: MouseEvent) => {
        if (!resizingRef.current) return
        const { startX, startWidth, columnId } = resizingRef.current
        const diff = e.pageX - startX
        const newWidth = Math.max(5, startWidth + diff) // Min width 5px

        setColumns(prev => prev.map(col =>
            col.id === columnId ? { ...col, width: newWidth } : col
        ))
    }

    const handleResizeEnd = () => {
        if (resizingRef.current) {
            setColumns(prev => {
                saveColumns(prev) // Persist
                return prev
            })
        }
        resizingRef.current = null
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
    }

    const handleAutoResize = (e: React.MouseEvent, columnId: string) => {
        e.stopPropagation()
        e.preventDefault()

        const column = columns.find(c => c.id === columnId)
        if (!column) return

        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) return

        context.font = '14px Inter, system-ui, sans-serif'
        let maxWidth = 0

        // Measure header (label + sort icon space + padding)
        const headerWidth = context.measureText(column.label).width + 40
        maxWidth = Math.max(maxWidth, headerWidth)

        // Measure content (first 50 rows for performance)
        const rowsToCheck = sortedData.slice(0, 50)
        rowsToCheck.forEach(row => {
            const value = (row as any)[columnId]
            // If explicit render, we can't easily measure. Fallback to raw value.
            if (value != null) {
                const str = String(value)
                const width = context.measureText(str).width + 24 // + padding
                maxWidth = Math.max(maxWidth, width)
            }
        })

        // Clamp width
        const finalWidth = Math.max(50, Math.min(500, Math.ceil(maxWidth)))

        const newCols = columns.map(col =>
            col.id === columnId ? { ...col, width: finalWidth } : col
        )
        setColumns(newCols)
        saveColumns(newCols)
    }

    // --- Drag & Drop Logic (Headers) ---
    const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null)

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedColumnId(id)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault()
        if (!draggedColumnId || draggedColumnId === targetId) return

        const sourceIndex = columns.findIndex(col => col.id === draggedColumnId)
        const targetIndex = columns.findIndex(col => col.id === targetId)

        if (sourceIndex === -1 || targetIndex === -1) return

        // Reorder
        const newCols = [...columns]
        const [moved] = newCols.splice(sourceIndex, 1)
        newCols.splice(targetIndex, 0, moved)

        // Update order indices
        const reordered = newCols.map((c, i) => ({ ...c, order: i }))
        setColumns(reordered)
    }

    const handleDragEnd = () => {
        setDraggedColumnId(null)
        saveColumns(columns) // Persist final order
    }
    const visibleColumns = useMemo(() => columns.filter(col => col.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0)), [columns])

    return (
        <div style={{
            flex: 1,
            overflow: 'auto',
            minHeight: 0,
            backgroundColor: 'white'
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
                    backgroundColor: 'white',
                    tableLayout: 'fixed' // Important for resizing
                }}>
                    <thead>
                        <tr
                            onContextMenu={handleContextMenu}
                            style={{
                                background: '#f8f9fa',
                                borderBottom: '2px solid #dee2e6',
                                position: 'sticky',
                                top: 0,
                                zIndex: 10
                            }}
                        >
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
                                const isDraggable = functionSettings.enableColumnDrag !== false
                                const isResizable = functionSettings.enableColumnResize !== false

                                return (
                                    <th
                                        key={column.id}
                                        draggable={isDraggable}
                                        onDragStart={isDraggable ? (e) => handleDragStart(e, column.id) : undefined}
                                        onDragOver={isDraggable ? (e) => handleDragOver(e, column.id) : undefined}
                                        onDragEnd={isDraggable ? handleDragEnd : undefined}
                                        onClick={() => isSortable && handleSort(column.id)}
                                        style={{
                                            padding: '0.75rem',
                                            textAlign: 'center', // Always center headers
                                            borderRight: '1px solid #dee2e6',
                                            width: column.width,
                                            cursor: isSortable ? 'pointer' : 'default',
                                            userSelect: 'none',
                                            background: isSorted ? '#e3f2fd' : (draggedColumnId === column.id ? '#e9ecef' : '#f8f9fa'),
                                            position: 'relative',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'clip'
                                        }}
                                        title={isSortable ? 'Sıralamaq üçün klikləyin. Yerini dəyişmək üçün sürüşdürün.' : ''}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            justifyContent: 'center', // Always center
                                            height: '100%'
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

                                        {/* Resize Handle */}
                                        {isResizable && (
                                            <div
                                                onMouseDown={(e) => handleResizeStart(e, column.id, column.width || 100)}
                                                onDoubleClick={(e) => handleAutoResize(e, column.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    position: 'absolute',
                                                    right: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: '5px',
                                                    cursor: 'col-resize',
                                                    zIndex: 1
                                                }}
                                                className="resize-handle"
                                            />
                                        )}
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

                                        return (
                                            <td
                                                key={column.id}
                                                style={{
                                                    padding: '0.75rem',
                                                    textAlign: 'center',
                                                    borderRight: '1px solid #dee2e6',
                                                    userSelect: 'text',
                                                    cursor: 'text',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap',
                                                    textOverflow: 'clip'
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

})

export default UniversalTable
