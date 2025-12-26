import React, { useRef, useEffect, useState } from 'react'
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
    tags?: React.ReactNode
    isLoading?: boolean
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
    tags,
    isLoading,
    ...props
}: ProductSelectCellProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [showDropdown, setShowDropdown] = useState(false)

    useEffect(() => {
        if (isFocused && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isFocused, productId])

    const handleBlur = (e: React.FocusEvent) => {
        const relatedTarget = e.relatedTarget as HTMLElement
        if (relatedTarget &&
            (relatedTarget.closest('.product-dropdown') || relatedTarget.closest('.product-action-btn'))
        ) {
            return
        }
        setShowDropdown(false)
        onBlur()
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        onFocus()
        setShowDropdown(true)
        e.target.select()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'F4') {
            e.preventDefault()
            onOpenSelect()
        }
        if (props.onKeyDown) {
            props.onKeyDown(e)
        }
    }

    return (
        <div
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'nowrap',
                width: '100%',
                maxWidth: '100%',
                border: '1px solid #ddd',
                borderRadius: '4px',
                borderColor: isFocused ? '#80bdff' : '#ddd',
                boxShadow: isFocused ? '0 0 0 0.2rem rgba(0,123,255,.25)' : 'none',
                background: '#fff',
                padding: '2px',
                height: '38px',
                minWidth: 0
            }}
        >
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>

            {tags && <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '4px', marginRight: '4px', overflow: 'hidden', maxWidth: '80%' }}>{tags}</div>}

            <input
                ref={inputRef}
                type="text"
                placeholder="Məhsul adını yazın..."
                value={searchTerm || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
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
                    textAlign: 'left',
                    boxSizing: 'border-box',
                    height: '30px',
                    outline: 'none',
                    background: 'transparent'
                }}
                {...props}
            />

            {isLoading && (
                <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #007bff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    marginRight: '6px',
                    flexShrink: 0
                }} />
            )}

            <div style={{ display: 'flex', alignItems: 'center', paddingRight: '4px', flexShrink: 0, minWidth: 0 }}>
                {isFocused && (
                    productId ? (
                        <>
                            <button
                                className="product-action-btn"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onOpenDetails(productId, productName)
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#007bff',
                                    fontSize: '1rem',
                                    padding: '0 4px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                tabIndex={-1}
                                title="Məhsul kartı"
                            >
                                🔍
                            </button>
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
                                    color: '#495057',
                                    fontSize: '1.2rem',
                                    padding: '0 4px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold'
                                }}
                                tabIndex={-1}
                                title="Məhsul seçimi"
                            >
                                ⋮
                            </button>
                        </>
                    ) : (
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
                                flexShrink: 0
                            }}
                            tabIndex={-1}
                            title="Məhsul seç"
                        >
                            ...
                        </button>
                    )
                )}
            </div>

            {showDropdown && searchResults.length > 0 && (
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
                                setShowDropdown(false)
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
