import { useState, useEffect } from 'react'

export interface Notification {
    id: number
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    timestamp: Date
    read: boolean
}

interface NotificationToastProps {
    notification: Notification
    onClose: () => void
}

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
        }, 5000)

        return () => clearTimeout(timer)
    }, [onClose])

    const colors = {
        success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724', icon: '✅' },
        error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24', icon: '❌' },
        warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404', icon: '⚠️' },
        info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460', icon: 'ℹ️' }
    }

    const style = colors[notification.type]

    return (
        <div
            style={{
                position: 'fixed',
                top: '80px',
                right: isVisible ? '20px' : '-400px',
                width: '350px',
                backgroundColor: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: '8px',
                padding: '1rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'right 0.3s ease-in-out',
                zIndex: 10000
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{style.icon}</span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: style.text, marginBottom: '0.25rem' }}>
                        {notification.title}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: style.text }}>
                        {notification.message}
                    </div>
                </div>
                <button
                    onClick={() => {
                        setIsVisible(false)
                        setTimeout(onClose, 300)
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        color: style.text,
                        padding: 0,
                        lineHeight: 1
                    }}
                >
                    ×
                </button>
            </div>
        </div>
    )
}
