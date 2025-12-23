import { useState, useEffect, useRef } from 'react'
import { useWindowStore } from '../store/windowStore'
import PartnerManager from './PartnerManager'
import type { Supplier, Customer } from '@shared/types'

// Union type for partners
type Partner = Supplier | Customer

interface PartnerSelectProps {
    partners: Partner[]
    value: Partner | null
    onChange: (partner: Partner | null) => void
    placeholder?: string
    filterType?: 'BUYER' | 'SUPPLIER' | 'ALL'
    disabled?: boolean
    label?: string | null
    style?: React.CSSProperties
}

export default function PartnerSelect({
    partners,
    value,
    onChange,
    placeholder = 'Seçin...',
    filterType = 'ALL',
    disabled = false,
    label = 'Tərəfdaş:',
    style
}: PartnerSelectProps) {
    // DEBUG LOGS
    console.log('[PartnerSelect] Re-render:', {
        filterType,
        partnersCount: partners?.length,
        hasValue: !!value,
        valueName: value?.name
    })

    const [searchTerm, setSearchTerm] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)

    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Filter partners based on type and search term
    const filteredPartners = partners.filter(p => {
        // Safe access to potential properties
        const pType = 'type' in p ? (p as any).type : undefined
        const pCode = 'code' in p ? (p as any).code : undefined

        // Type filter
        if (filterType !== 'ALL' && pType) {
            if (filterType === 'BUYER' && pType !== 'BUYER' && pType !== 'BOTH') return false
            if (filterType === 'SUPPLIER' && pType !== 'SUPPLIER' && pType !== 'BOTH') return false
        }

        // Search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase()
            return (
                p.name.toLowerCase().includes(term) ||
                (pCode && pCode.toLowerCase().includes(term)) ||
                (p.phone && p.phone.toLowerCase().includes(term)) ||
                ('email' in p && (p as any).email && (p as any).email.toLowerCase().includes(term))
            )
        }

        return true
    })

    // Update search term when value changes externally
    useEffect(() => {
        if (value && !showDropdown) {
            setSearchTerm(value.name)
        }
    }, [value, showDropdown])

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement

            // Check if click is on supplier dropdown
            if (target.closest('[data-supplier-dropdown="true"]')) {
                return
            }

            if (containerRef.current && !containerRef.current.contains(target)) {
                setShowDropdown(false)
                setIsFocused(false)

                // Restore selected partner name if no selection made
                if (value) {
                    setSearchTerm(value.name)
                }
                else {
                    setSearchTerm('')
                }
            }
        }

        if (showDropdown || isFocused) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showDropdown, value, isFocused])

    const handleSelect = (partner: Partner) => {
        onChange(partner)
        setSearchTerm(partner.name)
        setShowDropdown(false)
        // Keep focus? Usually yes, to allow further editing? 
        // Or maybe close is cleaner. But user wants to see buttons "inputa klik edende".
        // Selecting is an action inside.
        // Let's keep `isFocused` true, but `showDropdown` false.
        setIsFocused(true)
    }

    const handleClear = () => {
        onChange(null)
        setSearchTerm('')
        setShowDropdown(false)
        inputRef.current?.focus()
        setIsFocused(true)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setShowDropdown(true)
        setIsFocused(true)
        if (value) {
            onChange(null)
        }
    }

    const handleInputFocus = () => {
        // Show dropdown on focus
        setShowDropdown(true)
        setIsFocused(true)

        // If value exists, ensure search term matches
        if (value) {
            setSearchTerm(value.name)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'F4') {
            e.preventDefault()
            openPartnersPage()
        }
    }

    const openPartnersPage = () => {
        const { openPageWindow, closePageWindow } = useWindowStore.getState()
        const pageId = `partners-select-${filterType}`
        const pageTitle = filterType === 'SUPPLIER' ? 'Təchizatçılar' : filterType === 'BUYER' ? 'Müştərilər' : 'Tərəfdaşlar'

        openPageWindow(
            pageId,
            pageTitle,
            filterType === 'SUPPLIER' ? '📦' : '🛒',
            <PartnerManager
                filterType={filterType}
                onSelect={(partner) => {
                    handleSelect(partner)
                    closePageWindow(pageId)
                }}
            />,
            { width: 1000, height: 700 }
        )
    }

    const handleOpenDetails = (partnerToOpen: Partner | null = null) => {
        const target = partnerToOpen || value
        if (!target) return

        // NOTE: No onOpenDetails callback support needed for now as we standardizing on internal window

        const { openPageWindow } = useWindowStore.getState()
        const pageId = `partner-details-${target.id}`

        import('./PartnerForm').then(module => {
            const PartnerForm = module.default
            openPageWindow(
                pageId,
                `Kart: ${target.name}`,
                '👤',
                <div style={{ padding: '20px' }}>
                    <PartnerForm
                        initialData={target}
                        onSave={() => {
                            useWindowStore.getState().closePageWindow(pageId)
                        }}
                        onCancel={() => {
                            useWindowStore.getState().closePageWindow(pageId)
                        }}
                    />
                </div>,
                { width: 600, height: 750 } // Adjusted size for form
            )
        })
    }

    // Determine what to show
    // Show magnifier if value exists OR if there is a search term (to search)
    // AND isFocused is true
    const showDetails = (!!value || searchTerm.length > 0) && isFocused
    const showClear = searchTerm.length > 0 && isFocused

    return (
        <div style={{ display: 'flex', alignItems: 'center', ...style }}>
            {label && (
                <label style={{ width: '90px', fontWeight: '500', fontSize: '0.9rem', color: '#495057', flexShrink: 0 }}>
                    {label}
                </label>
            )}
            <div ref={containerRef} style={{ flex: 1, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <input
                        ref={inputRef}
                        type="text"
                        data-supplier-input="true"
                        placeholder={placeholder}
                        value={searchTerm} // Always bind to searchTerm for editing
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        style={{
                            width: '100%',
                            padding: '2px 90px 2px 8px', // Extra right padding for buttons
                            border: '1px solid #e0e0e0',
                            outline: 'none',
                            boxShadow: 'none',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            height: '24px'
                        }}
                    />

                    {/* Action Buttons */}
                    <div style={{
                        display: (isFocused || value) ? 'flex' : 'none', // Show if focused OR has value
                        gap: '2px',
                        position: 'absolute',
                        right: '4px',
                        height: '100%',
                        alignItems: 'center',
                        pointerEvents: 'none' // Let clicks pass through context
                    }}>
                        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
                            {/* Magnifying Glass - Open Partner Details */}
                            {showDetails && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (value) {
                                            handleOpenDetails(value)
                                        } else {
                                            // Try to find exact match
                                            const exactMatch = partners.find(p => p.name.toLowerCase().trim() === searchTerm.toLowerCase().trim())
                                            if (exactMatch) {
                                                handleSelect(exactMatch)
                                                handleOpenDetails(exactMatch)
                                            } else {
                                                alert('Zəhmət olmasa tərəfdaşı siyahıdan seçin')
                                                setShowDropdown(true)
                                            }
                                        }
                                    }}
                                    disabled={disabled}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: disabled ? '#ccc' : '#007bff',
                                        cursor: disabled ? 'not-allowed' : 'pointer',
                                        fontSize: '1rem',
                                        padding: '0 4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    title={value ? 'Tərəfdaş kartını aç' : 'Kartı açmaq üçün seçin'}
                                >
                                    🔍
                                </button>
                            )}

                            {/* Three Dots - Open Partners Page */}
                            <button
                                onClick={openPartnersPage}
                                disabled={disabled}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: disabled ? '#999' : '#6c757d',
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                    fontSize: '1.2rem',
                                    padding: '0 4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                }}
                                title={filterType === 'SUPPLIER' ? 'Təchizatçılar səhifəsi (F4)' : 'Müştərilər səhifəsi (F4)'}
                            >
                                ⋯
                            </button>

                            {/* Clear Button (X) */}
                            {showClear && (
                                <button
                                    onClick={handleClear}
                                    disabled={disabled}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: disabled ? '#999' : '#dc3545',
                                        cursor: disabled ? 'not-allowed' : 'pointer',
                                        fontSize: '1rem',
                                        padding: '0 4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    title="Təmizlə"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dropdown */}
                {showDropdown && filteredPartners.length > 0 && !disabled && (
                    <div
                        ref={dropdownRef}
                        data-supplier-dropdown="true"
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            marginTop: '2px',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            zIndex: 1000,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                    >
                        {filteredPartners.map(partner => (
                            <div
                                key={partner.id}
                                onClick={() => handleSelect(partner)}
                                style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f0f0f0',
                                    transition: 'background-color 0.15s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white'
                                }}
                            >
                                <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                                    {partner.name}
                                    {'code' in partner && (partner as any).code && (
                                        <span style={{ marginLeft: '8px', color: '#6c757d', fontSize: '0.85rem' }}>
                                            ({(partner as any).code})
                                        </span>
                                    )}
                                </div>
                                {partner.phone && (
                                    <div style={{ fontSize: '0.8rem', color: '#999' }}>
                                        {partner.phone}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
