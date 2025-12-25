import React from 'react'

interface ConfirmWindowProps {
    message: string
    onConfirm: () => void
    onCancel: () => void
}

export const ConfirmWindow: React.FC<ConfirmWindowProps> = ({ message, onConfirm, onCancel }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
            padding: '20px'
        }}>
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                fontSize: '16px',
                color: '#333'
            }}>
                {message}
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '15px',
                paddingTop: '20px',
                borderTop: '1px solid #eee'
            }}>
                <button
                    onClick={onConfirm}
                    style={{
                        minWidth: '100px',
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Bəli, Sil
                </button>
                <button
                    onClick={onCancel}
                    style={{
                        minWidth: '100px',
                        padding: '8px 16px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Xeyr
                </button>
            </div>
        </div>
    )
}
