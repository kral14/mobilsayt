import React, { useRef, useEffect } from 'react'
import type { Product } from '@shared/types'

interface ProductSelectCellProps {
    productName: string
    productId: number | null
    searchTerm: string
    searchResults: Product[]
    isPurchase: boolean
    isFocused: boolean
    onFocus: () => void
    onBlur: () => void
    onSearchChange: (value: string) => void
    onSelect: (product: Product) => void
    onClear: () => void
    onOpenSelect: () => void
    onOpenDetails: (productId: number, productName: string) => void
    [key: string]: any
}

export default function ProductSelectCell({
    productName,
    productId,
    searchTerm,
    searchResults,
    isPurchase,
    isFocused,
    onFocus,
    onBlur,
    onSearchChange,
    onSelect,
    onClear,
    onOpenSelect,
    onOpenDetails,
    ...props
}: ProductSelectCellProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    // Sync focus with isFocused prop (e.g. when transition from Selected -> Search)
    useEffect(() => {
        if (isFocused && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isFocused, productId]) // Re-run when view mode toggles

    // Handle blur with delay to allow clicking on dropdown
    const handleBlur = (e: React.FocusEvent) => {
        // e.persist() // React 17+ doesn't need persist, but safe to ignore
        const relatedTarget = e.relatedTarget as HTMLElement

        // If clicking inside the cell components (dropdown, buttons), don't treat as blur
        if (relatedTarget &&
            (relatedTarget.closest('.product-dropdown') || relatedTarget.closest('.product-action-btn'))
        ) {
            return
        }

        onBlur()
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        onFocus()
        e.target.select()
    }

    if (productId) {
        return (
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: '#fff', // Selected state background
                    borderColor: isFocused ? '#80bdff' : '#ddd',
                    boxShadow: isFocused ? '0 0 0 0.2rem rgba(0,123,255,.25)' : 'none',
                }}
                onFocus={onFocus}
                onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        onBlur()
                    }
                }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={productName}
                    onChange={(e) => {
                        onSearchChange(e.target.value)
                    }}
                    onFocus={handleFocus}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        width: '100%',
                        padding: '0.25rem 0.5rem',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        textAlign: 'left',
                        height: '30px',
                        boxSizing: 'border-box',
                        background: 'transparent'
                    }}
                    className="product-input-selected"
                    {...props}
                />

                {isFocused && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            paddingRight: '2px', // Slight padding for buttons
                            backgroundColor: '#fff',
                            height: '100%',
                            flexShrink: 100, // High shrink priority
                            minWidth: 0,
                            overflow: 'hidden'
                        }}
                    >
                        <button
                            onMouseDown={(e) => {
                                console.log(`[${new Date().toISOString()}] [ProductSelectCell] Details button MouseDown ${productId}`)
                                e.preventDefault() // Prevent focus loss if needed, though stopPropagation is usually enough for the blur check
                                e.stopPropagation()
                                onOpenDetails(productId, productName)
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                padding: '0 4px',
                                color: '#495057',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '24px',
                                width: '24px',
                                flexShrink: 0 // Prevent button itself from squishing weirdly
                            }}
                            tabIndex={-1}
                            title="Məhsul detalları"
                        >
                            🔍
                        </button>
                        <button
                            onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onOpenSelect()
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                padding: '0 4px',
                                color: '#495057',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '24px',
                                width: '24px',
                                lineHeight: 0.8
                            }}
                            tabIndex={-1}
                            title="Məhsul seç"
                        >
                            ⋯
                        </button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: '100%',
                border: '1px solid #ddd',
                borderRadius: '4px',
                borderColor: isFocused ? '#80bdff' : '#ddd',
                boxShadow: isFocused ? '0 0 0 0.2rem rgba(0,123,255,.25)' : 'none',
                background: '#fff'
            }}
        >
            <input
                ref={inputRef}
                type="text"
                placeholder="Məhsul adını yazın..."
                value={searchTerm || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                style={{
                    flex: 1,
                    minWidth: 0,
                    width: '100%',
                    padding: '0.25rem 0.5rem', // Standard padding
                    border: 'none', // Removed border
                    borderRadius: '4px', // Keep radius but inner
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                    height: '30px', // Slightly less than container to fit? Or inherit. 32-2=30 roughly.
                    outline: 'none',
                    background: 'transparent'
                }}
                {...props}
            />

            {/* Action Buttons - Flex Item now */}
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: '4px', flexShrink: 100, minWidth: 0, overflow: 'hidden' }}>
                <button
                    className="product-action-btn"
                    onClick={(e) => {
                        e.stopPropagation()
                        onOpenSelect()
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0 2px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold',
                        color: '#495057',
                        flexShrink: 0 // Prevent button squish
                    }}
                    tabIndex={-1} // Skip tab focus for button inside input
                    title="Məhsul seç"
                >
                    ...
                </button>
            </div>

            {searchResults.length > 0 && (
                <div
                    className="product-dropdown"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        marginTop: '0.25rem',
                        maxHeight: '200px',
                        overflow: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    {searchResults.map(product => (
                        <div
                            key={product.id}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onSelect(product)
                            }}
                            style={{
                                padding: '0.75rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f0f0f0'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f8f9fa'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'white'
                            }}
                        >
                            <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                            <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                {product.code && <span>Kod: {product.code} </span>}
                                {product.barcode && <span>Barkod: {product.barcode}</span>}
                            </div>
                            {isPurchase
                                ? (product.purchase_price && (
                                    <div style={{ fontSize: '0.875rem', color: '#28a745', fontWeight: 'bold', marginTop: '0.25rem' }}>
                                        Qiymət: {Number(product.purchase_price).toFixed(2)} ₼
                                    </div>
                                ))
                                : product.sale_price && (
                                    <div style={{ fontSize: '0.875rem', color: '#28a745', fontWeight: 'bold', marginTop: '0.25rem' }}>
                                        Qiymət: {Number(product.sale_price).toFixed(2)} ₼
                                    </div>
                                )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
