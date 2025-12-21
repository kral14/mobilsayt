import NotificationBell from './NotificationBell'
import { useState, useRef, useEffect } from 'react'
import NotificationPanel from './NotificationPanel'
import { useNotificationStore } from '../store/notificationStore'
import { useFooterStore } from '../store/footerStore'

interface GlobalFooterProps {
    taskbarHeight?: number
}

export default function GlobalFooter({ taskbarHeight = 25 }: GlobalFooterProps) {
    const { totalRecords, selectedCount, customContent, isVisible } = useFooterStore()
    const [showNotificationPanel, setShowNotificationPanel] = useState(false)
    const [isPinned, setIsPinned] = useState(false) // Pin state
    const { notifications, markAsRead, clearAll } = useNotificationStore()
    const footerRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null) // Ref for panel
    const bellRef = useRef<HTMLDivElement>(null) // Ref for bell wrapper
    const footerHeight = 25

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            // If panel is closed or pinned, do nothing (unless close button or toggle is clicked, handled separately)
            if (!showNotificationPanel || isPinned) return

            const target = event.target as Node
            // Check if click is outside panel AND outside bell button
            if (panelRef.current && !panelRef.current.contains(target) &&
                bellRef.current && !bellRef.current.contains(target)) {
                setShowNotificationPanel(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showNotificationPanel, isPinned])

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
                    <div ref={bellRef}>
                        <NotificationBell onClick={() => setShowNotificationPanel(!showNotificationPanel)} />
                    </div>
                </div>
            </div>

            {/* Notification Panel */}
            {showNotificationPanel && (
                <div
                    ref={panelRef}
                    style={{
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
                        isPinned={isPinned}
                        onTogglePin={() => setIsPinned(!isPinned)}
                    />
                </div>
            )}
        </>
    )
}
