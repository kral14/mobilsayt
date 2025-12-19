import { useEffect } from 'react'
import { useFooterStore } from '../store/footerStore'
import { useWindow } from '../context/WindowContext'

interface UniversalFooterProps {
    totalRecords?: number
    selectedCount?: number
    customContent?: React.ReactNode
}

/**
 * UniversalFooter - Bridge component for Global Footer
 * 
 * Bu komponent artıq birbaşa UI render etmir. 
 * Bunun əvəzinə, props-ları (totalRecords, selectedCount, customContent) 
 * Global Footer Store-a ötürür.
 * 
 * Yalnız aktiv pəncərənin məlumatları Global Footer-də göstərilir.
 */
export default function UniversalFooter({
    totalRecords,
    selectedCount,
    customContent
}: UniversalFooterProps) {
    const { setFooterData } = useFooterStore()
    const { isActive } = useWindow()

    useEffect(() => {
        // console.log('[UniversalFooter] isActive:', isActive, 'total:', totalRecords)
        if (isActive) {
            // console.log('[UniversalFooter] Setting Global Footer Data')
            setFooterData({
                totalRecords,
                selectedCount,
                customContent,
                isVisible: true
            })
        }
    }, [isActive, totalRecords, selectedCount, customContent, setFooterData])

    // Render nothing, UI is handled by GlobalFooter in Layout.tsx
    return null
}
