import React, { useState } from 'react'
import { ColumnConfig } from './UniversalTable'

interface TableSettingsModalProps {
  columns: ColumnConfig[]
  onSave: (columns: ColumnConfig[]) => void
  onClose: () => void
}

export default function TableSettingsModal({ columns, onSave, onClose }: TableSettingsModalProps) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(
    columns.map(col => ({ ...col }))
  )

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

  const handleSave = () => {
    onSave(localColumns)
    onClose()
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
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '700px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0 }}>Məhsul Cədvəli Ayarları</h3>
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

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #dee2e6'
        }}>
          <button style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderBottom: '3px solid #007bff',
            background: 'white',
            color: '#007bff',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            Sütunlar
          </button>
          <button style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'white',
            color: '#666',
            cursor: 'pointer'
          }}>
            Funksiyalar
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem'
        }}>
          {/* Varsayılanlara qayt button */}
          <div style={{ marginBottom: '1rem' }}>
            <button style={{
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
              {localColumns.map((column) => (
                <tr key={column.id} style={{
                  borderBottom: '1px solid #dee2e6'
                }}>
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
                      justifyContent: 'center'
                    }}>
                      <button style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}>
                        ↑
                      </button>
                      <button style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}>
                        ↓
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            Bağla
          </button>
        </div>
      </div>
    </div>
  )
}
