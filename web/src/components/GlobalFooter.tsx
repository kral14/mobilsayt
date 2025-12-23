import NotificationBell from './NotificationBell'
import { useState, useRef, useEffect } from 'react'
import NotificationPanel from './NotificationPanel'
import { useNotificationStore } from '../store/notificationStore'
import { useFooterStore } from '../store/footerStore'
import { useLocation } from 'react-router-dom'
import { useDashboardStore } from '../store/dashboardStore'

interface GlobalFooterProps {
    taskbarHeight?: number
}

import { useWindowStore } from '../store/windowStore'

export default function GlobalFooter({ taskbarHeight = 25 }: GlobalFooterProps) {
    const { totalRecords, selectedCount, customContent, isVisible } = useFooterStore()
    const [showNotificationPanel, setShowNotificationPanel] = useState(false)
    const [isPinned, setIsPinned] = useState(false)
    const { notifications, markAsRead, clearAll } = useNotificationStore()
    const { isEditMode, toggleEditMode } = useDashboardStore()
    const { windows } = useWindowStore()
    const location = useLocation()

    const isDashboard = location.pathname === '/' || location.pathname === '/web' || location.pathname === '/web/'

    // Check if any window is open and visible (not minimized)
    const hasOpenWindows = Array.from(windows.values()).some(w => !w.isMinimized && w.isVisible !== false)

    const footerRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const bellRef = useRef<HTMLDivElement>(null)
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
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <style>{`
                        @keyframes shake-pulse {
                            0% { transform: scale(1) rotate(0deg); }
                            20% { transform: scale(1.1) rotate(-10deg); }
                            40% { transform: scale(1.1) rotate(10deg); }
                            60% { transform: scale(1.1) rotate(-10deg); }
                            80% { transform: scale(1.1) rotate(10deg); }
                            100% { transform: scale(1) rotate(0deg); }
                        }
                        @keyframes typing {
                            from { width: 0; }
                            to { width: 100%; }
                        }
                        @keyframes blink {
                            from, to { border-color: transparent; }
                            50% { border-color: #00cec9; }
                        }
                    `}</style>

                    {/* Integrated Animated Notification */}
                    <div ref={bellRef}>
                        {notifications.some(n => !n.read) ? (
                            <div
                                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    gap: '8px',
                                    color: '#2d3436' // Qara mətn
                                }}
                            >
                                <div style={{
                                    animation: 'shake-pulse 0.8s infinite ease-in-out',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e67e22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                </div>
                                <div style={{
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    borderRight: '2px solid #e67e22',
                                    width: '0',
                                    animation: 'typing 2.5s steps(30, end) forwards, blink 0.5s step-end infinite',
                                    fontWeight: '600',
                                    fontSize: '0.75rem',
                                    color: '#2d3436' // Qara mətn
                                }}>
                                    {notifications.find(n => !n.read)?.message || 'Sizə yeni mesajınız var!'}
                                </div>
                            </div>
                        ) : (
                            <NotificationBell onClick={() => setShowNotificationPanel(!showNotificationPanel)} />
                        )}
                    </div>

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

                    {/* Customize Button (Only on Dashboard with no open windows) */}
                    {isDashboard && !hasOpenWindows && (
                        <button
                            onClick={toggleEditMode}
                            style={{
                                padding: '2px 10px',
                                borderRadius: '4px',
                                background: isEditMode ? '#e74c3c' : '#3498db',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.7rem',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            {isEditMode ? (
                                <><span>💾</span> Yadda Saxla</>
                            ) : (
                                <><span>⚙️</span> Dashboard-ı Özəlləşdir</>
                            )}
                        </button>
                    )}
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
