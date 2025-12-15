export interface ConfirmDialogProps {
    isOpen: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    discardText?: string
    onConfirm: () => void | Promise<void>
    onDiscard?: () => void | Promise<void>
    onCancel: () => void
    showDiscard?: boolean
    modalZIndex?: number // Qaimənin z-index-i
}

export default function ConfirmDialog({
    isOpen,
    title = 'Dəyişikliklər yadda saxlanılmayıb!',
    message = 'Pəncərəni bağlasanız edilən dəyişikliklər itəcək. Nə etmək istəyirsiniz?',
    confirmText = 'Yadda saxla',
    cancelText = 'İmtina',
    discardText = 'Yadda saxlama',
    onConfirm,
    onDiscard,
    onCancel,
    showDiscard = true,
    modalZIndex = 1000
}: ConfirmDialogProps) {
    if (!isOpen) return null

    const handleConfirm = async () => {
        await onConfirm()
    }

    const handleDiscard = async () => {
        if (onDiscard) {
            await onDiscard()
        }
    }

    // Təsdiq dialogu qaimənin içində, amma ən üstdə olmalıdır
    const dialogZIndex = 9999

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: dialogZIndex
            }}
            onClick={(e) => {
                // Overlay-ə klik edildikdə heç nə etmə
                e.stopPropagation()
            }}
        >
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                padding: '24px',
                width: '450px',
                maxWidth: '90%'
            }}>
                <h3 style={{
                    marginTop: 0,
                    marginBottom: '16px',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#333',
                    textAlign: 'center'
                }}>{title}</h3>
                <p style={{
                    marginBottom: '24px',
                    fontSize: '14px',
                    color: '#666',
                    lineHeight: '1.5',
                    textAlign: 'center'
                }}>{message}</p>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px'
                }}>
                    <button
                        onClick={handleConfirm}
                        style={{
                            padding: '10px 20px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#218838'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#28a745'}
                    >
                        {confirmText}
                    </button>
                    {showDiscard && onDiscard && (
                        <button
                            onClick={handleDiscard}
                            style={{
                                padding: '10px 20px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#c82333'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#dc3545'}
                        >
                            {discardText}
                        </button>
                    )}
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '10px 20px',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#5a6268'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#6c757d'}
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    )
}
