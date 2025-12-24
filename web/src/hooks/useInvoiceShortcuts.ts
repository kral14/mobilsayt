import { useEffect } from 'react'
import { ModalData } from '../components/InvoiceTypes'

interface UseInvoiceShortcutsProps {
    isActive: boolean
    isVisible: boolean
    isMinimized: boolean
    modalId: string
    localData: ModalData['data']
    setLocalData: React.Dispatch<React.SetStateAction<ModalData['data']>>
    selectedItemIndices: number[]
    onClose: (modalId: string) => void
    onSave?: (modalId: string, data: ModalData['data']) => Promise<void>
    onPrint?: (modalId: string, data: ModalData['data']) => void
    openProductsSelect: (index: number) => void
    handleAddEmptyRow: () => void
    onDeleteSelected: () => void
}

export const useInvoiceShortcuts = ({
    isActive,
    isVisible,
    isMinimized,
    modalId,
    localData,
    setLocalData,
    selectedItemIndices,
    onClose,
    onSave,
    onPrint,
    openProductsSelect,
    handleAddEmptyRow,
    onDeleteSelected
}: UseInvoiceShortcutsProps) => {

    useEffect(() => {
        if (!isVisible || isMinimized || !isActive) {
            return
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            // ESC: Close Modal
            if (e.key === 'Escape' || e.key === 'Esc') {
                console.log('[InvoiceModal] ESC detected - closing modal:', modalId)
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()
                onClose(modalId)
                return
            }

            const target = e.target as HTMLElement
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

            // Ctrl+S: Save
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                e.preventDefault()
                if (onSave) onSave(modalId, localData)
                return
            }

            // Ctrl+P: Print
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault()
                if (onPrint) onPrint(modalId, localData)
                return
            }

            // F4: Product Select
            if (e.key === 'F4') {
                e.preventDefault()
                if (isInput) {
                    const input = target as HTMLInputElement
                    const rowIdxAttr = input.getAttribute('data-row-index')
                    if (rowIdxAttr) {
                        openProductsSelect(parseInt(rowIdxAttr))
                        return
                    }
                }
                if (selectedItemIndices.length === 1) {
                    openProductsSelect(selectedItemIndices[0])
                }
                return
            }

            // If input logic prevents other shortcuts, return here
            if (isInput) {
                // Special case: Delete inside input can trigger row delete if input is empty
                if (e.key === 'Delete' && selectedItemIndices.length > 0) {
                    const val = (target as HTMLInputElement).value
                    if (val) return // If has value, let default delete happen
                } else {
                    return
                }
            }

            // Insert: Add Row
            if (e.key === 'Insert') {
                e.preventDefault()
                handleAddEmptyRow()
                return
            }

            // Delete: Remove Row(s)
            if (e.key === 'Delete' && selectedItemIndices.length > 0) {
                // If input logic prevents other shortcuts, return here (already checked above)
                // But we need to check the special case again or valid it comes here

                // If we are in an input, and it has value, "Delete" usually deletes text.
                // The check at line 88 handles "Delete inside input can trigger row delete if input is empty"
                // So if we reached here, it means either:
                // 1. Not in input
                // 2. In input but input is empty

                e.preventDefault()
                onDeleteSelected()
                return
            }

            // F9: Copy Row(s)
            if (e.key === 'F9') {
                e.preventDefault()
                if (selectedItemIndices.length > 0) {
                    const sortedIndices = [...selectedItemIndices].sort((a, b) => a - b)
                    const newItems = [...localData.invoiceItems]
                    const copiedItems = sortedIndices.map(index => ({ ...newItems[index] }))
                    setLocalData(prev => ({ ...prev, invoiceItems: [...newItems, ...copiedItems] }))
                }
                return
            }
        }

        // Capture phase to catch Esc before others if needed, but standard bubbling is usually fine.
        // However original code used capture for one useEffect and bubble for another.
        // Let's use capture to be safe for shortcuts like global hotkeys.
        window.addEventListener('keydown', handleKeyDown, true)
        return () => window.removeEventListener('keydown', handleKeyDown, true)
    }, [isActive, isVisible, isMinimized, modalId, localData, selectedItemIndices, onClose, onSave, onPrint, handleAddEmptyRow, openProductsSelect, onDeleteSelected])
}
