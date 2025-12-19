import { Notification } from './NotificationToast'

interface NotificationPanelProps {
    notifications: Notification[]
    isOpen: boolean
    onClose: () => void
    onMarkAsRead: (id: number) => void
    onClearAll: () => void
}

export default function NotificationPanel({
    notifications,
    isOpen,
    onClose,
    onMarkAsRead,
    onClearAll
}: NotificationPanelProps) {
    if (!isOpen) return null

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Header */}
            <div style={{
                padding: '1rem',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
                    Bildirişlər {unreadCount > 0 && `(${unreadCount})`}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {notifications.length > 0 && (
                        <button
                            onClick={onClearAll}
                            style={{
                                padding: '0.25rem 0.75rem',
                                fontSize: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                background: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            Hamısını təmizlə
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: 0,
                            lineHeight: 1
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0.5rem'
            }}>
                {notifications.length === 0 ? (
                    <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: '#999'
                    }}>
                        Bildiriş yoxdur
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            onClick={() => onMarkAsRead(notification.id)}
                            style={{
                                padding: '0.75rem',
                                marginBottom: '0.5rem',
                                borderRadius: '6px',
                                backgroundColor: notification.read ? '#f8f9fa' : '#e3f2fd',
                                cursor: 'pointer',
                                border: '1px solid',
                                borderColor: notification.read ? '#e0e0e0' : '#90caf9'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '0.25rem'
                            }}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                                    {notification.title}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#666' }}>
                                    {new Date(notification.timestamp).toLocaleTimeString('az-AZ', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: '#555' }}>
                                {notification.message}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
