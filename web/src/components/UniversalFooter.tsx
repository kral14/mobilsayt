import React from 'react'

interface UniversalFooterProps {
    totalRecords?: number
    selectedCount?: number
    customContent?: React.ReactNode
}

/**
 * UniversalFooter - Universal footer komponenti
 * 
 * Pəncərənin aşağısında statistika və əlavə məlumat göstərir.
 * Sticky positioning ilə həmişə görünür.
 */
export default function UniversalFooter({
    totalRecords,
    selectedCount,
    customContent
}: UniversalFooterProps) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 1rem',
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #dee2e6',
            fontSize: '0.875rem',
            color: '#6c757d',
            flexShrink: 0,
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            border: '2px solid orange' // DEBUG: Footer
        }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
                {totalRecords !== undefined && (
                    <span>
                        <strong>Cəmi:</strong> {totalRecords}
                    </span>
                )}
                {selectedCount !== undefined && selectedCount > 0 && (
                    <span>
                        <strong>Seçilmiş:</strong> {selectedCount}
                    </span>
                )}
            </div>

            {customContent && (
                <div>
                    {customContent}
                </div>
            )}
        </div>
    )
}
