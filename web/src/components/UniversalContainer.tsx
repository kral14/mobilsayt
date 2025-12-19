import React from 'react'

interface UniversalContainerProps {
    children: React.ReactNode
    padding?: string
}

/**
 * UniversalContainer - Universal content container komponenti
 * 
 * Pəncərənin içərisində content-i düzgün yerləşdirir:
 * - UniversalNavbar: sticky top
 * - UniversalTable: flex 1, scrollable
 * - UniversalFooter: sticky bottom
 * 
 * İstifadə:
 * <UniversalContainer>
 *   <UniversalNavbar ... />
 *   <UniversalTable ... />
 *   <UniversalFooter ... />
 * </UniversalContainer>
 */
export default function UniversalContainer({
    children,
    padding = '5px 15px'
}: UniversalContainerProps) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            padding,
            overflow: 'hidden',
            position: 'relative',
            // border: '2px solid red', // DEBUG: Container - Removed
            gap: '1px'
        }}>
            {children}
        </div>
    )
}
