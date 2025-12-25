import React, { useState } from 'react'
import { useNotificationStore } from '../store/notificationStore'
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
    const { addNotification } = useNotificationStore()

    // Debug logging for mount/unmount and notifications
    React.useEffect(() => {
        console.log('[InvoiceFooter] MOUNTED for modal:', modalId)
        return () => console.log('[InvoiceFooter] UNMOUNTED for modal:', modalId)
    }, [modalId])

    const handleSaveClick = async () => {
        if (!onSave) return
        try {
            await onSave(modalId, localData)
            // Success notification handled by parent (e.g. Satis.tsx)
        } catch (error: any) {
            console.error('Save failed:', error)
            const msg = error?.response?.data?.message || error?.message || 'Xəta baş verdi'
            addNotification('error', 'Xəta', msg)
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

        try {
            if (onSaveAndConfirm) {
                await onSaveAndConfirm(modalId, localData)
            } else if (onSave) {
                await onSave(modalId, localData)
            }
            // Success notification handled by parent
            onClose(modalId, true)
        } catch (error: any) {
            console.error('Save/Confirm failed:', error)
            const msg = error?.response?.data?.message || error?.message || 'Xəta baş verdi'
            addNotification('error', 'Xəta', msg)
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

            {/* Notification Icon & Text - MOVED TO GLOBAL FOOTER */}
            <div style={{ flex: 1 }} />

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
