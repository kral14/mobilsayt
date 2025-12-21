
import React, { useState, useEffect } from 'react'
import { ColumnConfig } from './UniversalTable'

export interface FunctionSettings {
  enableColumnDrag?: boolean
  enableColumnResize?: boolean
}

export interface TableSettingsModalProps {
  isOpen?: boolean
  columns: ColumnConfig[]
  onColumnsChange: (columns: ColumnConfig[]) => void
  onSave?: (columns: ColumnConfig[]) => void // Backward compatibility if needed
  onSaveAsDefault?: () => void
  onClose: () => void
  title?: string
  defaultColumns?: ColumnConfig[]
  functionSettings?: FunctionSettings
  onFunctionSettingsChange?: (settings: FunctionSettings) => void
  showFunctionsTab?: boolean
  customFunctionContent?: React.ReactNode
  embedded?: boolean
}

export default function TableSettingsModal({
  isOpen,
  columns,
  onColumnsChange,
  onSave,
  onClose,
  title = "Cədvəl Ayarları",
  defaultColumns,
  functionSettings,
  onFunctionSettingsChange,
  showFunctionsTab = false,
  customFunctionContent,
  embedded = false,
  onSaveAsDefault
}: TableSettingsModalProps) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(
    columns.map(col => ({ ...col }))
  )
  const [activeTab, setActiveTab] = useState<'columns' | 'functions'>('columns')
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null)

  useEffect(() => {
    setLocalColumns(columns.map(col => ({ ...col })))
  }, [columns])

  const handleToggleVisible = (id: string) => {
    setLocalColumns(prev =>
      prev.map(col =>
        col.id === id ? { ...col, visible: !col.visible } : col
      )
    )
  }

  const handleWidthChange = (id: string, width: number) => {
    setLocalColumns(prev =>
      prev.map(col =>
        col.id === id ? { ...col, width } : col
      )
    )
  }

  const handleReset = () => {
    if (defaultColumns) {
      setLocalColumns(defaultColumns.map(col => ({ ...col })))
    }
  }

  const handleSave = () => {
    onColumnsChange(localColumns)
    if (onSave) onSave(localColumns)
    onClose()
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedColumnId(id)
    e.dataTransfer.effectAllowed = 'move'
    // Ghost image customization if needed
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedColumnId || draggedColumnId === targetId) return

    const sourceIndex = localColumns.findIndex(col => col.id === draggedColumnId)
    const targetIndex = localColumns.findIndex(col => col.id === targetId)

    if (sourceIndex === -1 || targetIndex === -1) return

    // Reorder locally for visual feedback
    const newColumns = [...localColumns]
    const [draggedColumn] = newColumns.splice(sourceIndex, 1)
    newColumns.splice(targetIndex, 0, draggedColumn)

    // Update order property
    const reorderedColumns = newColumns.map((col, index) => ({
      ...col,
      order: index
    }))

    setLocalColumns(reorderedColumns)
  }

  const handleDragEnd = () => {
    setDraggedColumnId(null)
  }

  if (isOpen === false) return null

  const content = (
    <div style={{
      backgroundColor: 'white',
      borderRadius: embedded ? '0' : '8px',
      width: embedded ? '100%' : '700px',
      height: embedded ? '100%' : undefined,
      maxHeight: embedded ? 'none' : '80vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: embedded ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }} onClick={e => e.stopPropagation()}>
      {/* Header */}
      {!embedded && (
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #dee2e6'
      }}>
        <button
          onClick={() => setActiveTab('columns')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderBottom: activeTab === 'columns' ? '3px solid #007bff' : 'none',
            background: 'white',
            color: activeTab === 'columns' ? '#007bff' : '#666',
            fontWeight: activeTab === 'columns' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}>
          Sütunlar
        </button>
        {showFunctionsTab && (
          <button
            onClick={() => setActiveTab('functions')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderBottom: activeTab === 'functions' ? '3px solid #007bff' : 'none',
              background: 'white',
              color: activeTab === 'functions' ? '#007bff' : '#666',
              fontWeight: activeTab === 'functions' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}>
            Funksiyalar
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1rem'
      }}>
        {activeTab === 'columns' && (
          <>
            {/* Varsayılanlara qayt button */}
            {defaultColumns && (
              <div style={{ marginBottom: '1rem' }}>
                <button
                  onClick={handleReset}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                  <span>↺</span>
                  <span>Varsayılanlara qayt</span>
                </button>
              </div>
            )}

            {/* Table */}
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#f8f9fa',
                  borderBottom: '2px solid #dee2e6'
                }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Sütun</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Göstər</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Genişlik</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Yer</th>
                </tr>
              </thead>
              <tbody>
                {localColumns.sort((a, b) => (a.order || 0) - (b.order || 0)).map((column) => (
                  <tr
                    key={column.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, column.id)}
                    onDragOver={(e) => handleDragOver(e, column.id)}
                    onDragEnd={handleDragEnd}
                    style={{
                      borderBottom: '1px solid #dee2e6',
                      background: draggedColumnId === column.id ? '#f0f0f0' : 'white',
                      cursor: 'move'
                    }}
                  >
                    <td style={{ padding: '0.75rem' }}>{column.label}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={column.visible !== false}
                        onChange={() => handleToggleVisible(column.id)}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          accentColor: '#9c27b0'
                        }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}>
                        <input
                          type="number"
                          value={column.width || 100}
                          onChange={(e) => handleWidthChange(column.id, parseInt(e.target.value))}
                          style={{
                            width: '80px',
                            padding: '0.25rem',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            textAlign: 'center'
                          }}
                        />
                        <span style={{ color: '#666' }}>px</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{
                        display: 'flex',
                        gap: '0.25rem',
                        justifyContent: 'center',
                        cursor: 'grab'
                      }}>
                        <span style={{ fontSize: '1.2rem', color: '#999' }}>☰</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {activeTab === 'functions' && (
          <div>
            {/* Varsayılanlara qayt button */}
            {defaultColumns && (
              <div style={{ marginBottom: '1rem' }}>
                <button
                  onClick={handleReset}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                  <span>↺</span>
                  <span>Varsayılanlara qayt</span>
                </button>
              </div>
            )}

            {functionSettings && onFunctionSettingsChange && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', border: '1px solid #eee', borderRadius: '4px' }}>
                  <input
                    type="checkbox"
                    checked={functionSettings.enableColumnDrag !== false} // Default true
                    onChange={(e) => onFunctionSettingsChange({ ...functionSettings, enableColumnDrag: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#007bff' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Cədvəl başlıqlarının yerini dəyişmək</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>Sütun başlıqlarını sürüşdürərək yerini dəyişməyə icazə ver</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', border: '1px solid #eee', borderRadius: '4px' }}>
                  <input
                    type="checkbox"
                    checked={functionSettings.enableColumnResize !== false} // Default true
                    onChange={(e) => onFunctionSettingsChange({ ...functionSettings, enableColumnResize: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#007bff' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Sütunların ölçüsünü dəyişmək</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>Sütun kənarlarından tutaraq enini dəyişməyə icazə ver</div>
                  </div>
                </label>
              </div>
            )}
            {onSaveAsDefault && (
              <button
                onClick={onSaveAsDefault}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginTop: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <span>💾</span>
                Varsayılan kimi saxla
              </button>
            )}
            {customFunctionContent}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={handleSave}
          style={{
            padding: '0.5rem 2rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Yadda Saxla
        </button>
      </div>
    </div>
  )

  if (embedded) {
    return content
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }} onClick={onClose}>
      {content}
    </div>
  )
}
