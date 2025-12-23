import React from 'react'

interface QuickAccessWidgetProps {
    title: string
    icon: string
    color?: string
    gradient?: string
    onClick: () => void
    isEditMode?: boolean
}

export const QuickAccessWidget: React.FC<QuickAccessWidgetProps> = ({
    title, icon, color, gradient, onClick, isEditMode
}) => {
    return (
        <div
            onClick={!isEditMode ? onClick : undefined}
            style={{
                background: gradient || 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                borderRadius: '12px',
                padding: '1.5rem 1rem',
                cursor: isEditMode ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                height: '100%',
                justifyContent: 'center',
                border: color ? `2px solid ${color}` : '2px solid transparent',
                position: 'relative'
            }}
            onMouseEnter={(e) => {
                if (!isEditMode) {
                    e.currentTarget.style.transform = 'translateY(-5px)'
                    e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.2)'
                }
            }}
            onMouseLeave={(e) => {
                if (!isEditMode) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
                }
            }}
        >
            <div style={{ fontSize: '2.5rem' }}>{icon}</div>
            <h3 style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: '600',
                color: gradient ? '#fff' : '#333',
                textAlign: 'center',
                textShadow: gradient ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
            }}>
                {title}
            </h3>
        </div>
    )
}
