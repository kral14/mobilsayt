import { useNotificationStore } from '../store/notificationStore'

interface NotificationBellProps {
    onClick: () => void
}

export default function NotificationBell({ onClick }: NotificationBellProps) {
    const notifications = useNotificationStore(state => state.notifications)
    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <button
            onClick={onClick}
            style={{
                position: 'relative',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.5rem',
                padding: '0.5rem',
                color: 'white',
                transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title="Bildirişlər"
        >
            🔔
            {unreadCount > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    background: '#ff4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    )
}
