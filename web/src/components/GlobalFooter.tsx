import NotificationBell from './NotificationBell'
import { useState, useRef } from 'react'
import NotificationPanel from './NotificationPanel'
import { useNotificationStore } from '../store/notificationStore'
import { useFooterStore } from '../store/footerStore'

interface GlobalFooterProps {
    taskbarHeight?: number
}

export default function GlobalFooter({ taskbarHeight = 25 }: GlobalFooterProps) {
    const { totalRecords, selectedCount, customContent, isVisible } = useFooterStore()
    const [showNotificationPanel, setShowNotificationPanel] = useState(false)
    const { notifications, markAsRead, clearAll } = useNotificationStore()
    const footerRef = useRef<HTMLDivElement>(null)
    const footerHeight = 25

    if (!isVisible) return null

    return (
        <>
            <div
                ref={footerRef}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 1rem',
                    backgroundColor: '#f8f9fa',
                    borderTop: '1px solid #dee2e6',
                    fontSize: '0.75rem',
                    color: '#6c757d',
                    position: 'fixed',
                    bottom: `${taskbarHeight}px`, // Taskbar-ın üstündə
                    left: 0,
                    width: '100%',
                    zIndex: 10000, // Taskbar-dan (10001) bir az aşağı, amma pəncərələrdən yuxarı? Yox, Layout.tsx-də taskbar 10001-dir.
                    // Əgər taskbar 10001-dirsə, footer də yüksək olmalıdır ki, pəncərələrin üstündə qalsın.
                    // Pəncərələr workspace içindədir. Global footer workspace-dən kənardadır.
                    height: '25px',
                    boxSizing: 'border-box'
                }}
            >
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {totalRecords !== undefined && (
                        <span>
                            <strong>Cəmi:</strong> {totalRecords}
                        </span>
                    )}
                    {selectedCount !== undefined && selectedCount > 0 && (
                        <span>
                            <strong>Seçilmiş:</strong> {selectedCount}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {customContent && (
                        <div>
                            {customContent}
                        </div>
                    )}

                    {/* Notification Bell */}
                    <NotificationBell onClick={() => setShowNotificationPanel(!showNotificationPanel)} />
                </div>
            </div>

            {/* Notification Panel */}
            {showNotificationPanel && (
                <div style={{
                    position: 'fixed',
                    bottom: `${taskbarHeight + footerHeight}px`,
                    right: '20px',
                    width: '400px',
                    maxHeight: `calc(100vh - ${taskbarHeight + footerHeight + 90}px)`,
                    zIndex: 10002
                }}>
                    <NotificationPanel
                        notifications={notifications}
                        isOpen={showNotificationPanel}
                        onClose={() => setShowNotificationPanel(false)}
                        onMarkAsRead={markAsRead}
                        onClearAll={clearAll}
                    />
                </div>
            )}
        </>
    )
}
