
interface ConfirmationModalProps {
    message: string
    onConfirm: () => void
    onCancel: () => void
    confirmText?: string
    cancelText?: string
    confirmColor?: string
}

export default function ConfirmationModal({
    message,
    onConfirm,
    onCancel,
    confirmText = 'Bəli',
    cancelText = 'Xeyr',
    confirmColor = '#dc3545'
}: ConfirmationModalProps) {
    return (
        <div style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            background: 'white'
        }}>
            <p style={{
                fontSize: '1.2rem',
                textAlign: 'center',
                marginBottom: '2rem',
                color: '#333'
            }}>
                {message}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '0.75rem 2rem',
                        border: '1px solid #ddd',
                        background: '#f8f9fa',
                        color: '#333',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    style={{
                        padding: '0.75rem 2rem',
                        border: 'none',
                        background: confirmColor,
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    )
}
