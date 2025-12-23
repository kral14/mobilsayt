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
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title="Bildirişlər"
        >
            <style>{`
                @keyframes pulse-once {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
            `}</style>

            <div style={{
                animation: unreadCount > 0 ? 'shake-pulse 0.8s infinite ease-in-out' : 'none',
                display: 'flex',
                alignItems: 'center'
            }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={unreadCount > 0 ? "#e67e22" : "#95a5a6"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
            </div>

            {unreadCount > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: '#ff4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 1
                }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    )
}
