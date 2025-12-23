
import React, { useState, useEffect } from 'react'
import ProductSelectInput from './ProductSelectInput'
import PartnerSelect from './PartnerSelect'
import UniversalToolBar from './UniversalToolBar'
import FilterSaveModal from './FilterSaveModal'
import FilterLoadModal from './FilterLoadModal'
import { useWindowStore } from '../store/windowStore'
import { useNotificationStore } from '../store/notificationStore'
import { useWindow } from '../context/WindowContext'

import MultiValueEditor from './MultiValueEditorModal'
import type { Product, Customer, Supplier } from '../../../shared/types'
import { customersAPI } from '../services/api'
import DatePeriodPicker from './DatePeriodPicker'

const DateRuleInput = ({ value, onChange }: { value: any, onChange: (val: any) => void }) => {
    const [isOpen, setIsOpen] = useState(false)
    const ref = React.useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const displayValue = () => {
        if (!value) return 'Tarix seçin...'
        if (value.startDate && value.endDate) return `${value.startDate} - ${value.endDate}`
        if (value.startDate) return `${value.startDate} - ...`
        if (value.endDate) return `... - ${value.endDate}`
        return 'Tarix seçin...'
    }

    return (
        <div ref={ref} style={{ position: 'relative', width: '100%' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    height: '38px',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    justifyContent: 'space-between'
                }}
            >
                <span>{displayValue()}</span>
                <span>📅</span>
            </div>
            {isOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, marginTop: '5px' }}>
                    <DatePeriodPicker
                        value={value}
                        onChange={(val) => {
                            onChange(val)
                            setIsOpen(false)
                        }}
                        onClose={() => setIsOpen(false)}
                    />
                </div>
            )}
        </div>
    )
}

export interface FilterComponentConfig {
    id: string
    label: string
    type?: 'text' | 'number' | 'date' | 'select' | 'product' | 'partner'
    options?: { value: any, label: string }[]
    partnerType?: 'BUYER' | 'SUPPLIER' | 'ALL'
}

export interface FilterRule {
    component: string
    condition: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'not_contains' | 'starts_with' | 'not_starts_with' | 'greater' | 'greater_or_equal' | 'less' | 'less_or_equal' | 'is_set' | 'is_not_set' | 'in_group' | 'not_in_group'
    value: any
}

interface AdvancedFilterModalProps {
    isOpen?: boolean
    onClose: () => void
    onApply: (rules: FilterRule[]) => void
    filterComponents?: FilterComponentConfig[]
    toolbarId?: string // Unique ID for this modal's toolbar context
    initialRules?: FilterRule[] // Pre-populate with saved filters
}



const DEFAULT_PRODUCT_COMPONENTS: FilterComponentConfig[] = [
    { id: 'product', label: 'Məhsul', type: 'product' },
    { id: 'code', label: 'Məhsul kodu', type: 'text' },
    { id: 'barcode', label: 'Barkod', type: 'text' },
    { id: 'article', label: 'Artikul', type: 'text' },
    { id: 'brand', label: 'Brend', type: 'text' },
    { id: 'model', label: 'Model', type: 'text' },
    { id: 'category', label: 'Kateqoriya', type: 'text' }
]

export default function AdvancedFilterModal({ onClose, onApply, filterComponents = DEFAULT_PRODUCT_COMPONENTS, toolbarId = 'advanced-filter-general', initialRules = [] }: AdvancedFilterModalProps) {
    const windowContext = useWindow()
    const handleClose = windowContext?.close || onClose

    const [rules, setRules] = useState<FilterRule[]>(initialRules)
    const [selectedRules, setSelectedRules] = useState<number[]>([])
    const [partners, setPartners] = useState<(Customer | Supplier)[]>([])

    // Fetch partners if any component is of type 'partner'
    useEffect(() => {
        const hasPartner = filterComponents.some(c => c.type === 'partner')
        if (hasPartner) {
            customersAPI.getAll().then(setPartners).catch(console.error)
        }
    }, [filterComponents])

    // Keyboard support for Delete
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedRules.length > 0) {
                handleDeleteSelected()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedRules])

    const handleDeleteSelected = () => {
        setRules(rules.filter((_, i) => !selectedRules.includes(i)))
        setSelectedRules([])
    }

    const handleAddEmptyRow = () => {
        setRules([...rules, { component: '', condition: 'equals', value: null }])
    }

    // --- Auto-save Rules Management ---
    const getAutoSaveKey = () => `filter-autosave-${toolbarId}`
    const getSelectionSaveKey = () => `filter-autosave-selection-${toolbarId}`

    const [isLoaded, setIsLoaded] = useState(false)

    // Load auto-saved rules on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(getAutoSaveKey())
            if (saved) {
                setRules(JSON.parse(saved))
            }

            const savedSelection = localStorage.getItem(getSelectionSaveKey())
            if (savedSelection) {
                setSelectedRules(JSON.parse(savedSelection))
            }
        } catch (e) {
            console.error('Error loading auto-saved filters:', e)
        }
        setIsLoaded(true)
    }, [])

    // Save rules whenever they change
    useEffect(() => {
        try {
            // Only save if rules are different from empty/default to avoid overwriting with empty on initial mount before load
            // But actually we want to save empty if user deleted everything.
            // To differentiate initial mount (empty) vs user cleared (empty), we could check if we have loaded yet.
            // For simplicity, just saving whatever is in 'rules' after initial load is fine, but we need to be careful not to overwrite persisted data with [] on first render.
            // However, since we load in a useEffect, the initial render has [], avoiding overwriting immediately requires a check.

            // Let's use a ref or just simple approach: 
            // The loading effect runs once. 
            // This saving effect runs on 'rules' change.
            // If we load data, 'setRules' triggers this effect? Yes.
            // So if we load data, it saves it back. harmless.
            // If no data, it saves []. persistent. 
            // The only issue is if 'rules' is [] initially and we overwrite a saved list before loading it?
            // No, the load effect runs after mount. The save effect also runs after mount. 
            // They might race? standard React useEffect order is: render -> effects.
            // Better to trigger save only after initial load is done.
            if (isLoaded) {
                localStorage.setItem(getAutoSaveKey(), JSON.stringify(rules))
                localStorage.setItem(getSelectionSaveKey(), JSON.stringify(selectedRules))
            }
        } catch (e) {
            console.error(e)
        }
    }, [rules, selectedRules, isLoaded])
    // ---------------------------------

    // --- Preset Management ---
    const getStorageKey = () => `filter-presets-${toolbarId}`

    const loadPresets = (): Record<string, FilterRule[]> => {
        try {
            const saved = localStorage.getItem(getStorageKey())
            return saved ? JSON.parse(saved) : {}
        } catch (e) {
            console.error(e)
            return {}
        }
    }

    const savePresets = (presets: Record<string, FilterRule[]>) => {
        localStorage.setItem(getStorageKey(), JSON.stringify(presets))
    }

    const handleSaveMenu = () => {
        const presets = loadPresets()
        const modalId = 'filter-save-modal'

        useWindowStore.getState().openPageWindow(
            modalId,
            'Filtri yadda saxla',
            '💾',
            <FilterSaveModal
                existingPresets={Object.keys(presets)}
                onSave={(name) => {
                    const currentPresets = loadPresets()
                    currentPresets[name] = rules
                    savePresets(currentPresets)
                    useNotificationStore.getState().addNotification('success', 'Uğurlu', `Filtr "${name}" yadda saxlanıldı`)
                    useWindowStore.getState().closePageWindow(modalId)
                }}
                onCancel={() => useWindowStore.getState().closePageWindow(modalId)}
            />,
            { width: 400, height: 400 }
        )
    }

    const handleLoadMenu = () => {
        const presets = loadPresets()
        const modalId = 'filter-load-modal'

        useWindowStore.getState().openPageWindow(
            modalId,
            'Filtri seç',
            '📂',
            <FilterLoadModal
                presets={Object.keys(presets)}
                onSelect={(name) => {
                    const currentPresets = loadPresets()
                    if (currentPresets[name]) {
                        setRules(currentPresets[name])
                        useNotificationStore.getState().addNotification('success', 'Uğurlu', `Filtr "${name}" tətbiq edildi`)
                    }
                    useWindowStore.getState().closePageWindow(modalId)
                }}
                onDelete={(name) => {
                    const currentPresets = loadPresets()
                    delete currentPresets[name]
                    savePresets(currentPresets)
                    useWindowStore.getState().closePageWindow(modalId)
                    // Re-open to refresh list (a bit hacky but works for now)
                    setTimeout(handleLoadMenu, 0)
                }}
                onCancel={() => useWindowStore.getState().closePageWindow(modalId)}
            />,
            { width: 400, height: 400 }
        )
    }
    // -------------------------

    const updateRule = (index: number, field: keyof FilterRule, val: any) => {
        // Auto-enable filter when modified
        setSelectedRules(prev => {
            if (!prev.includes(index)) {
                return [...prev, index]
            }
            return prev
        })

        setRules(prevRules => {
            const newRules = [...prevRules]
            newRules[index] = { ...newRules[index], [field]: val }
            if (field === 'condition') {
                if (field === 'condition') {
                    const textOps = ['contains', 'not_contains', 'starts_with', 'not_starts_with']
                    const isNewTextOp = textOps.includes(val)
                    const isOldTextOp = textOps.includes(prevRules[index].condition)

                    // If switching between text-mode and object-mode, clear value because types are incompatible (string vs object)
                    if (isNewTextOp !== isOldTextOp) {
                        newRules[index].value = null
                    }
                    // Handle Multi-select vs Single-select transition
                    else if (val === 'in' || val === 'not_in') {
                        if (!Array.isArray(newRules[index].value)) {
                            // If we have a single value, wrap it?
                            // But if we just cleared it above due to text switch, it will be null.
                            // If we didn't clear it (e.g. Equals -> In), we wrap.
                            if (newRules[index].value) {
                                newRules[index].value = [newRules[index].value]
                            } else {
                                newRules[index].value = []
                            }
                        }
                    } else {
                        // Single select
                        if (Array.isArray(newRules[index].value)) {
                            newRules[index].value = newRules[index].value[0] || null
                        }
                    }
                }
            }
            return newRules
        })
    }

    // Dropdown for component selection within the row
    const [activeRowDropdown, setActiveRowDropdown] = useState<number | null>(null)

    const renderInput = (rule: FilterRule, index: number) => {
        const compConfig = filterComponents.find(c => c.id === rule.component)

        // If no component selected yet
        if (!compConfig) {
            return <div style={{ color: '#999', fontStyle: 'italic', userSelect: 'none', padding: '0.5rem' }}>Komponent seçilməyib</div>
        }

        const type = compConfig.type || 'text'

        const isMulti = rule.condition === 'in' || rule.condition === 'not_in' || rule.condition === 'in_group' || rule.condition === 'not_in_group'

        // If condition is "Filled" or "Not Filled", no input needed
        if (rule.condition === 'is_set' || rule.condition === 'is_not_set') {
            return <div style={{ color: '#aaa', fontStyle: 'italic', padding: '0.5rem' }}>Dəyər tələb olunmur</div>
        }

        if (type === 'product') {
            // Check if text operation is selected
            const isTextOp = ['contains', 'not_contains', 'starts_with', 'not_starts_with'].includes(rule.condition)

            if (isTextOp) {
                // For text operations, show simple text input
                return (
                    <input
                        type="text"
                        value={typeof rule.value === 'string' ? rule.value : (rule.value?.name || '')}
                        onChange={(e) => updateRule(index, 'value', e.target.value)}
                        placeholder="Mətn daxil edin..."
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }}
                    />
                )
            }

            // For other operations, show product selector
            if (isMulti) {
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <ProductSelectInput
                            value={null}
                            onChange={(val) => {
                                if (val) {
                                    const current = Array.isArray(rule.value) ? rule.value : []
                                    if (!current.find((p: Product) => p.id === val.id)) {
                                        updateRule(index, 'value', [...current, val])
                                    }
                                }
                            }}
                            placeholder={Array.isArray(rule.value) && rule.value.length > 0 ? "Jurnala bax..." : "Məhsul əlavə et..."}
                            tags={
                                Array.isArray(rule.value) && rule.value.length > 0 && (
                                    <>
                                        {rule.value.slice(0, 2).map((p: Product) => (
                                            <span key={p.id} style={{ background: '#e7f3ff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #cce5ff', whiteSpace: 'nowrap' }}>
                                                {p.name}
                                            </span>
                                        ))}
                                        {rule.value.length > 2 && (
                                            <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'bold', padding: '0 4px', whiteSpace: 'nowrap' }}>
                                                ... (+{rule.value.length - 2})
                                            </span>
                                        )}
                                    </>
                                )
                            }
                            onOpenSelect={() => {
                                const windowId = 'multi-value-editor-' + index
                                import('../store/windowStore').then(({ useWindowStore }) => {
                                    useWindowStore.getState().openPageWindow(
                                        windowId,
                                        'Çoxlu Seçim',
                                        '📝',
                                        <div style={{ width: '100%', height: '100%' }}>
                                            <MultiValueEditor
                                                initialValues={Array.isArray(rule.value) ? rule.value : []}
                                                onSave={(values) => {
                                                    updateRule(index, 'value', values)
                                                    useWindowStore.getState().closePageWindow(windowId)
                                                }}
                                                onCancel={() => useWindowStore.getState().closePageWindow(windowId)}
                                            />
                                        </div>,
                                        { width: 600, height: 500 }
                                    )
                                })
                            }}
                        />
                    </div>
                )
            } else {
                return (
                    <ProductSelectInput
                        value={rule.value}
                        onChange={(val) => updateRule(index, 'value', val)}
                    />
                )
            }
        }

        if (type === 'partner') {
            const isTextOp = ['contains', 'not_contains', 'starts_with', 'not_starts_with'].includes(rule.condition)

            if (isTextOp) {
                return (
                    <input
                        type="text"
                        value={typeof rule.value === 'string' ? rule.value : (rule.value?.name || '')}
                        onChange={(e) => updateRule(index, 'value', e.target.value)}
                        placeholder="Ad üzrə axtar..."
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', height: '38px', boxSizing: 'border-box' }}
                    />
                )
            }

            if (!isMulti) {
                return (
                    <PartnerSelect
                        partners={partners}
                        value={rule.value}
                        onChange={(val) => updateRule(index, 'value', val)}
                        filterType={compConfig?.partnerType || 'ALL'}
                        label={null}
                        style={{ width: '100%' }}
                    />
                )
            } else {
                return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', border: '1px solid #ddd', borderRadius: '4px', padding: '4px', minHeight: '38px', alignItems: 'center' }}>
                        {Array.isArray(rule.value) && rule.value.map((p: any) => (
                            <span key={p.id} style={{ background: '#e7f3ff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #cce5ff' }}>
                                {p.name}
                                <button onClick={(e) => {
                                    e.stopPropagation()
                                    updateRule(index, 'value', rule.value.filter((x: any) => x.id !== p.id))
                                }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666', fontSize: '1rem', lineHeight: 0.5 }}>×</button>
                            </span>
                        ))}
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <PartnerSelect
                                partners={partners}
                                value={null}
                                onChange={(val) => {
                                    if (val) {
                                        const current = Array.isArray(rule.value) ? rule.value : []
                                        if (!current.find((p: any) => p.id === val.id)) {
                                            updateRule(index, 'value', [...current, val])
                                        }
                                    }
                                }}
                                filterType={compConfig?.partnerType || 'ALL'}
                                placeholder="Əlavə et..."
                                label={null}
                                style={{ width: '100%', border: 'none' }}
                            />
                        </div>
                    </div>
                )
            }
        }

        if (type === 'select') {
            if (isMulti) {
                return <div style={{ color: 'orange' }}>Çoxlu seçim bu tip üçün hələ hazır deyil</div>
            }
            return (
                <select
                    value={rule.value || ''}
                    onChange={(e) => updateRule(index, 'value', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', height: '38px' }}
                >
                    <option value="">Seçin...</option>
                    {compConfig?.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            )
        }

        if (type === 'date') {
            return (
                <DateRuleInput
                    value={rule.value}
                    onChange={(val) => updateRule(index, 'value', val)}
                />
            )
        }

        return (
            <input
                type={type === 'number' ? 'number' : 'text'}
                value={rule.value || ''}
                onChange={(e) => updateRule(index, 'value', e.target.value)}
                placeholder={compConfig?.label + ' yazın...'}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', height: '38px', boxSizing: 'border-box' }}
            />
        )
    }

    return (
        <div style={{ display: 'flex', height: '100%', flexDirection: 'column', position: 'relative' }}>
            <UniversalToolBar
                toolbarId={toolbarId}
                onAdd={handleAddEmptyRow}
                onDelete={handleDeleteSelected}
                onSaveFilter={handleSaveMenu}
                onSelectFilter={handleLoadMenu}
                onSearch={() => { }}
            />

            <div style={{ flex: 1, display: 'flex', borderBottom: '1px solid #ddd' }}>

                <div style={{ width: '250px', borderRight: '1px solid #ddd', padding: '1rem', background: '#f8f9fa' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Komponentlər</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {filterComponents.map(comp => (
                            <div
                                key={comp.id}
                                onClick={() => {
                                    // Add specific component directly from sidebar
                                    setRules([...rules, { component: comp.id, condition: 'equals', value: null }])
                                }}
                                style={{
                                    padding: '0.5rem',
                                    background: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: rules.find(r => r.component === comp.id) ? 'bold' : 'normal',
                                    backgroundColor: rules.find(r => r.component === comp.id) ? '#e7f1ff' : 'white',
                                    borderColor: rules.find(r => r.component === comp.id) ? '#007bff' : '#ddd'
                                }}
                            >
                                {comp.label} {rules.find(r => r.component === comp.id) && '✓'}
                            </div>
                        ))}
                    </div>
                </div>


                <div style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Seçilmiş Filtrlər</h3>
                    {rules.length === 0 && <div style={{ color: '#999' }}>Siyahı boşdur. + düyməsi ilə əlavə edin...</div>}

                    {/* Column Headers */}
                    {rules.length > 0 && (
                        <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                            padding: '0.5rem 0.25rem',
                            borderBottom: '2px solid #ddd',
                            marginBottom: '0.5rem',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            color: '#666'
                        }}>
                            <div style={{ width: '20px' }}></div> {/* Checkbox space */}
                            <div style={{ width: '220px' }}>Komponent</div>
                            <div style={{ width: '160px' }}>Şərt</div>
                            <div style={{ flex: 1 }}>Dəyər</div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {rules.map((rule, idx) => {
                            const compConfig = filterComponents.find(c => c.id === rule.component)
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        padding: '0.25rem',
                                        borderBottom: '1px solid #eee',
                                        background: selectedRules.includes(idx) ? '#e7f1ff' : 'white',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        {/* Checkbox for selection */}
                                        <input
                                            type="checkbox"
                                            checked={selectedRules.includes(idx)}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedRules(prev => [...prev, idx])
                                                else setSelectedRules(prev => prev.filter(i => i !== idx))
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        />

                                        <div style={{ position: 'relative', width: '220px' }}>
                                            <div style={{
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                padding: '0 0.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: '#fff',
                                                height: '32px',
                                                boxSizing: 'border-box'
                                            }}>
                                                <span style={{ fontWeight: '500', fontSize: '0.9rem', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                                    {compConfig?.label || ''}
                                                </span>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setActiveRowDropdown(activeRowDropdown === idx ? null : idx)
                                                        }}
                                                        title="Komponenti dəyiş"
                                                        style={{
                                                            background: '#eee',
                                                            border: '1px solid #ccc',
                                                            borderRadius: '2px',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            color: '#666',
                                                            padding: '0 4px',
                                                            fontSize: '0.8rem',
                                                            height: '20px',
                                                            lineHeight: '18px'
                                                        }}
                                                    >
                                                        ...
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            // Clear component and value to "reset" the row
                                                            updateRule(idx, 'component', '')
                                                            updateRule(idx, 'value', null)
                                                        }}
                                                        title="Komponenti sil"
                                                        style={{
                                                            background: '#fee',
                                                            border: '1px solid #fcc',
                                                            borderRadius: '2px',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            color: 'red',
                                                            padding: '0 4px',
                                                            fontSize: '0.8rem',
                                                            height: '20px',
                                                            lineHeight: '18px'
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>

                                            {activeRowDropdown === idx && (
                                                <>
                                                    <div
                                                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                                                        onClick={() => setActiveRowDropdown(null)}
                                                    />
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        left: 0,
                                                        width: '100%',
                                                        background: 'white',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        marginTop: '2px',
                                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                                        zIndex: 1000,
                                                        maxHeight: '200px',
                                                        overflow: 'auto'
                                                    }}>
                                                        {filterComponents.map(c => (
                                                            <div
                                                                key={c.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    updateRule(idx, 'component', c.id)
                                                                    updateRule(idx, 'value', null)
                                                                    setActiveRowDropdown(null)
                                                                }}
                                                                style={{
                                                                    padding: '0.5rem',
                                                                    cursor: 'pointer',
                                                                    borderBottom: '1px solid #eee',
                                                                    background: rule.component === c.id ? '#e7f1ff' : 'white',
                                                                    fontSize: '0.9rem'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = rule.component === c.id ? '#e7f1ff' : '#f8f9fa'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = rule.component === c.id ? '#e7f1ff' : 'white'}
                                                            >
                                                                {c.label}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <select
                                            value={rule.condition}
                                            onChange={(e) => updateRule(idx, 'condition', e.target.value as any)}
                                            style={{
                                                padding: '0 0.5rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ddd',
                                                height: '32px',
                                                boxSizing: 'border-box',
                                                fontSize: '0.9rem',
                                                maxWidth: '160px'
                                            }}
                                        >
                                            <optgroup label="Ümumi">
                                                <option value="equals">Bərabərdir</option>
                                                <option value="not_equals">Bərabər deyil</option>
                                            </optgroup>
                                            <optgroup label="Siyahı Əməliyyatları">
                                                <option value="in">Siyahıda var</option>
                                                <option value="not_in">Siyahıda yoxdur</option>
                                            </optgroup>
                                            <optgroup label="Mətn Əməliyyatları">
                                                <option value="contains">Tərkibində var</option>
                                                <option value="not_contains">Tərkibində yoxdur</option>
                                                <option value="starts_with">İlə başlayır</option>
                                                <option value="not_starts_with">İlə başlamır</option>
                                            </optgroup>
                                            <optgroup label="Rəqəm Əməliyyatları">
                                                <option value="greater">Böyükdür</option>
                                                <option value="greater_or_equal">Böyükdür və ya bərabərdir</option>
                                                <option value="less">Kiçikdir</option>
                                                <option value="less_or_equal">Kiçikdir və ya bərabərdir</option>
                                            </optgroup>
                                            <optgroup label="Mövcudluq Yoxlaması">
                                                <option value="is_set">Doludur</option>
                                                <option value="is_not_set">Dolu deyil</option>
                                            </optgroup>
                                            <optgroup label="Qrup Əməliyyatları">
                                                <option value="in_group">Qrupdadır</option>
                                                <option value="not_in_group">Qrupda deyil</option>
                                            </optgroup>
                                        </select>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {renderInput(rule, idx)}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', background: 'white' }}>
                <button onClick={handleClose} style={{ padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>Bağla</button>
                <button
                    onClick={() => {
                        // Filter out empty rules, and keep only SELECTED (checked) rules
                        const activeRules = rules.filter((r, idx) =>
                            r.component &&
                            r.component.trim() !== '' &&
                            selectedRules.includes(idx)
                        )
                        onApply(activeRules)
                        handleClose()
                    }}
                    style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', background: '#007bff', color: 'white', cursor: 'pointer' }}
                >
                    Tətbiq et
                </button>
            </div>
        </div>
    )

}
