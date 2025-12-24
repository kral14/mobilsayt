import React, { useState } from 'react'
import { ModalData } from './InvoiceTypes'

interface InvoiceFooterProps {
    localData: ModalData['data']
    setLocalData: React.Dispatch<React.SetStateAction<ModalData['data']>>
    modalId: string
    isPurchase: boolean
    onClose: (modalId: string, force?: boolean) => void
    onSave?: (modalId: string, data: ModalData['data']) => Promise<void>
    onSaveAndConfirm?: (modalId: string, data: ModalData['data']) => Promise<void>
    onPrint?: (modalId: string, data: ModalData['data']) => void
    isOKDisabled: boolean
}

const InvoiceFooter: React.FC<InvoiceFooterProps> = ({
    localData,
    setLocalData,
    modalId,
    isPurchase,
    onClose,
    onSave,
    onSaveAndConfirm,
    onPrint,
    isOKDisabled
}) => {
    const [notesFocused, setNotesFocused] = useState(false)
    const [notification, setNotification] = useState<{ status: 'success' | 'error' | null, message?: string }>({ status: null })

    // Debug logging for mount/unmount and notifications
    React.useEffect(() => {
        console.log('[InvoiceFooter] MOUNTED for modal:', modalId)
        return () => console.log('[InvoiceFooter] UNMOUNTED for modal:', modalId)
    }, [modalId])

    React.useEffect(() => {
        console.log('[InvoiceFooter] Notification State Updated:', notification)
    }, [notification])

    const handleSaveClick = async () => {
        if (!onSave) return
        setNotification({ status: null })
        try {
            await onSave(modalId, localData)
            setNotification({ status: 'success', message: 'Uğurla yadda saxlanıldı' })
        } catch (error: any) {
            console.error('Save failed:', error)
            const msg = error?.response?.data?.message || error?.message || 'Xəta baş verdi'
            setNotification({ status: 'error', message: msg })
        }
    }

    const handleOKClick = async () => {
        if (isOKDisabled) return

        // Validation (Redundant checks as disabled button prevents click, but good for safety)
        if (isPurchase && !localData.selectedSupplierId) {
            alert('Təchizatçı seçilməlidir')
            return
        }
        if (!isPurchase && !localData.selectedCustomerId) {
            alert('Müştəri seçilməlidir')
            return
        }
        const validItems = localData.invoiceItems.filter(item => item.product_id !== null)
        if (validItems.length === 0) {
            alert('Məhsul seçilməyib')
            return
        }

        setNotification({ status: null })
        try {
            if (onSaveAndConfirm) {
                await onSaveAndConfirm(modalId, localData)
            } else if (onSave) {
                await onSave(modalId, localData)
            }
            setNotification({ status: 'success', message: 'Uğurla icra edildi' })
            onClose(modalId, true)
        } catch (error: any) {
            console.error('Save/Confirm failed:', error)
            const msg = error?.response?.data?.message || error?.message || 'Xəta baş verdi'
            setNotification({ status: 'error', message: msg })
        }
    }

    return (
        <div style={{ padding: '5px 10px', marginBottom: '1px', borderTop: '1px solid #dee2e6', background: '#f8f9fa', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {/* Notes */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <textarea
                    value={localData.notes || ''}
                    onChange={(e) => setLocalData(prev => ({ ...prev, notes: e.target.value }))}
                    onFocus={() => setNotesFocused(true)}
                    onBlur={() => {
                        if (!localData.notes) setNotesFocused(false)
                    }}
                    placeholder="Qeydlər..."
                    style={{
                        width: '100%',
                        padding: '5px 8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        resize: 'none',
                        height: '35px',
                        fontFamily: 'inherit',
                        overflow: 'hidden',
                        margin: 0,
                        boxSizing: 'border-box',
                        borderColor: notesFocused ? '#86b7fe' : '#ced4da',
                        boxShadow: notesFocused ? '0 0 0 0.2rem rgba(13, 110, 253, 0.25)' : 'none',
                        outline: 'none'
                    }}
                />
            </div>

            {/* Notification Icon & Text */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginRight: '10px'
            }} title={notification.message || ''}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '35px',
                    height: '35px',
                    color: notification.status === 'success' ? '#28a745' : notification.status === 'error' ? '#dc3545' : '#ccc',
                    transition: 'color 0.3s ease'
                }}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                </div>
                {notification.status && notification.message && (
                    <span style={{
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        color: notification.status === 'success' ? '#28a745' : '#dc3545',
                        maxWidth: '250px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {notification.message}
                    </span>
                )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
                <button
                    onClick={() => onClose(modalId)}
                    style={{
                        padding: '0 16px',
                        height: '35px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        margin: 0,
                        boxSizing: 'border-box'
                    }}
                >
                    Bağla
                </button>
                <button
                    onClick={handleSaveClick}
                    disabled={!onSave}
                    style={{
                        padding: '0 16px',
                        height: '35px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: onSave ? 'pointer' : 'not-allowed',
                        fontWeight: '500',
                        margin: 0,
                        boxSizing: 'border-box',
                        opacity: onSave ? 1 : 0.6
                    }}
                    title="Yadda Saxla (Ctrl+S)"
                >
                    Yadda Saxla
                </button>
                <button
                    onClick={handleOKClick}
                    disabled={isOKDisabled}
                    style={{
                        padding: '0 16px',
                        height: '35px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isOKDisabled ? '#6c757d' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isOKDisabled ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                        opacity: isOKDisabled ? 0.6 : 1,
                        margin: 0,
                        boxSizing: 'border-box'
                    }}
                    title={isOKDisabled ? (isPurchase ? 'Təchizatçı və məhsul seçilməlidir' : 'Müştəri və məhsul seçilməlidir') : 'Yadda saxla və təsdiqlə'}
                >
                    OK
                </button>
                <button
                    onClick={() => onPrint && onPrint(modalId, localData)}
                    disabled={!onPrint}
                    style={{
                        padding: '0 16px',
                        height: '35px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: onPrint ? '#6f42c1' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: onPrint ? 'pointer' : 'not-allowed',
                        fontWeight: '500',
                        opacity: onPrint ? 1 : 0.6,
                        margin: 0,
                        boxSizing: 'border-box'
                    }}
                    title={onPrint ? "Çap et (Ctrl+P)" : "Çap funksiyası mövcud deyil"}
                >
                    Çap
                </button>
            </div>
        </div>
    )
}

export default InvoiceFooter
