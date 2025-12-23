import React, { useState } from 'react'
import { useDashboardStore } from '../../store/dashboardStore'
import { AddWidgetModal } from './AddWidgetModal'

interface DashboardToolbarProps {
    tabId: string
}

export const DashboardToolbar: React.FC<DashboardToolbarProps> = ({ tabId }) => {
    const { updateTab, addWidget, tabs } = useDashboardStore()
    const [showAddModal, setShowAddModal] = useState(false)

    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return null

    const handleRenameTab = () => {
        const newTitle = prompt('Yeni tab adı:', tab.title)
        if (newTitle) updateTab(tabId, { title: newTitle })
    }

    const handleAddWidget = (type: 'quick_access' | 'overdue_invoices', data: any) => {
        if (type === 'quick_access') {
            addWidget(tabId, {
                type: 'quick_access',
                title: data.title,
                icon: data.icon,
                color: '#667eea',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                pageId: data.pageId,
                position: { x: 0, y: 0, w: 1, h: 1 }
            })
        } else {
            addWidget(tabId, {
                type: 'overdue_invoices',
                title: 'Müddəti bitmiş ödənişlər',
                icon: '⚠️',
                position: { x: 0, y: 0, w: tab.gridSettings.columns, h: 2 }
            })
        }
        setShowAddModal(false)
    }

    return (
        <div style={{
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            border: '1px solid #dee2e6',
            flexWrap: 'wrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
            <div style={{ fontWeight: '600', color: '#333' }}>Dizayn Paneli:</div>

            {/* Tab Controls */}
            <button
                onClick={handleRenameTab}
                style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'white',
                    border: '1px solid #ddd',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                }}
            >
                ✏️ Adı Dəyiş
            </button>

            <div style={{ height: '24px', width: '1px', background: '#ccc' }}></div>

            {/* Grid Settings */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.9rem', color: '#666' }}>Sütun Sayı:</span>
                <select
                    value={tab.gridSettings.columns}
                    onChange={(e) => updateTab(tabId, { gridSettings: { ...tab.gridSettings, columns: Number(e.target.value) } })}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        background: 'white'
                    }}
                >
                    {[2, 3, 4, 5, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n} Sütun</option>)}
                </select>
            </div>

            <div style={{ height: '24px', width: '1px', background: '#ccc' }}></div>

            {/* Add Widgets */}
            <button
                onClick={() => setShowAddModal(true)}
                style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
            >
                + Widget Əlavə Et
            </button>

            {showAddModal && (
                <AddWidgetModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleAddWidget}
                />
            )}
        </div>
    )
}
