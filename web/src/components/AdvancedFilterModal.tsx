
import { useState, useEffect } from 'react'
import ProductSelectInput from './ProductSelectInput'
import UniversalToolBar from './UniversalToolBar'
import MultiValueEditor from './MultiValueEditorModal'
import type { Product } from '../../../shared/types'

interface FilterRule {
    component: string // 'product' | others
    condition: 'equals' | 'in' | 'not_equals' | 'not_in'
    value: any
}

interface AdvancedFilterModalProps {
    isOpen: boolean // Not strictly needed if managed by window store, but good for local dev
    onClose: () => void
    onApply: (rules: FilterRule[]) => void
}

export default function AdvancedFilterModal({ onClose, onApply }: AdvancedFilterModalProps) {
    const [rules, setRules] = useState<FilterRule[]>([])
    const [selectedRules, setSelectedRules] = useState<number[]>([])

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

    const handleAddComponent = (component: string) => {
        // Toggle logic: if exists, remove it. If not, add it.
        const existingIndex = rules.findIndex(r => r.component === component)
        if (existingIndex >= 0) {
            // If already exists, just select it
            setSelectedRules([existingIndex])
        } else {
            setRules([...rules, { component, condition: 'equals', value: null }])
        }
    }

    const updateRule = (index: number, field: keyof FilterRule, val: any) => {
        setRules(prevRules => {
            const newRules = [...prevRules]
            newRules[index] = { ...newRules[index], [field]: val }
            // specific logic: if switching between single/multi, value format might change
            if (field === 'condition') {
                if (val === 'in' || val === 'not_in') {
                    if (!Array.isArray(newRules[index].value)) {
                        newRules[index].value = newRules[index].value ? [newRules[index].value] : []
                    }
                } else {
                    // Single
                    if (Array.isArray(newRules[index].value)) {
                        newRules[index].value = newRules[index].value[0] || null
                    }
                }
            }
            return newRules
        })
    }

    const [activeComponentDropdown, setActiveComponentDropdown] = useState<number | null>(null)

    const components = [
        { id: 'product', label: 'Məhsul' },
        { id: 'code', label: 'Məhsul kodu' },
        { id: 'barcode', label: 'Barkod' },
        { id: 'article', label: 'Artikul' },
        { id: 'brand', label: 'Brend' },
        { id: 'model', label: 'Model' },
        { id: 'category', label: 'Kateqoriya' }
    ]

    return (
        <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
            <UniversalToolBar
                onAdd={() => { }} // Placeholder for adding new filter
                onDelete={handleDeleteSelected}
                onSearch={() => { }} // Placeholder for search
            />
            <div style={{ flex: 1, display: 'flex', borderBottom: '1px solid #ddd' }}>
                {/* Left Side: Component List */}
                <div style={{ width: '250px', borderRight: '1px solid #ddd', padding: '1rem', background: '#f8f9fa' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Komponentlər</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {components.map(comp => (
                            <div
                                key={comp.id}
                                onClick={() => handleAddComponent(comp.id)}
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

                {/* Right Side: Active Filters Configuration */}
                <div style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Seçilmiş Filtrlər</h3>
                    {rules.length === 0 && <div style={{ color: '#999' }}>Sol tərəfdən komponent seçin...</div>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {rules.map((rule, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedRules(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}
                                style={{
                                    padding: '0.5rem',
                                    borderBottom: '1px solid #eee',
                                    background: selectedRules.includes(idx) ? '#e7f1ff' : 'white',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>

                                    {/* Component Selector */}
                                    <div style={{ position: 'relative', width: '200px' }} onClick={e => e.stopPropagation()}>
                                        <div style={{
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            padding: '0.35rem 0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            background: '#f9f9f9',
                                            height: '38px',
                                            boxSizing: 'border-box'
                                        }}>
                                            <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                                                {components.find(c => c.id === rule.component)?.label}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setActiveComponentDropdown(activeComponentDropdown === idx ? null : idx)
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    color: '#666',
                                                    padding: '0 4px'
                                                }}
                                            >
                                                ...
                                            </button>
                                        </div>

                                        {/* Dropdown */}
                                        {activeComponentDropdown === idx && (
                                            <>
                                                <div
                                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                                                    onClick={() => setActiveComponentDropdown(null)}
                                                />
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    width: '100%',
                                                    background: 'white',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    marginTop: '4px',
                                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                                    zIndex: 1000,
                                                    maxHeight: '200px',
                                                    overflow: 'auto'
                                                }}>
                                                    {components.map(c => (
                                                        <div
                                                            key={c.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                updateRule(idx, 'component', c.id)
                                                                updateRule(idx, 'value', null) // Reset value on type change
                                                                setActiveComponentDropdown(null)
                                                            }}
                                                            style={{
                                                                padding: '0.5rem',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid #eee',
                                                                background: rule.component === c.id ? '#e7f1ff' : 'white'
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

                                    {/* Condition Select */}
                                    <select
                                        value={rule.condition}
                                        onClick={e => e.stopPropagation()}
                                        onChange={(e) => updateRule(idx, 'condition', e.target.value)}
                                        style={{
                                            padding: '0.35rem 0.5rem',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd',
                                            height: '38px',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <option value="equals">1 seçim</option>
                                        <option value="in">1-dən çox seçim</option>
                                        <option value="not_equals">1 seçimi nəzərə alma</option>
                                        <option value="not_in">1-dən çox seçimi nəzərə alma</option>
                                    </select>

                                    {/* Input Area */}
                                    <div style={{ flex: 1, minWidth: 0 }} onClick={e => e.stopPropagation()}>
                                        {rule.component === 'product' ? (
                                            <>
                                                {(rule.condition === 'equals' || rule.condition === 'not_equals') ? (
                                                    <ProductSelectInput
                                                        value={rule.value}
                                                        onChange={(val) => updateRule(idx, 'value', val)}
                                                    />
                                                ) : (
                                                    /* Multiple Select Logic */
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <ProductSelectInput
                                                            value={null}
                                                            onChange={(val) => {
                                                                if (val) {
                                                                    const current = Array.isArray(rule.value) ? rule.value : []
                                                                    if (!current.find((p: Product) => p.id === val.id)) {
                                                                        updateRule(idx, 'value', [...current, val])
                                                                    }
                                                                }
                                                            }}
                                                            // Custom placeholder for multiple add
                                                            placeholder={Array.isArray(rule.value) && rule.value.length > 0 ? "Jurnala bax..." : "Məhsul əlavə et..."}
                                                            // Pass rendered tags
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
                                                            // Override "..." button to open Multi-Value Editor
                                                            onOpenSelect={() => {
                                                                const windowId = 'multi-value-editor-' + idx
                                                                import('../store/windowStore').then(({ useWindowStore }) => {
                                                                    useWindowStore.getState().openPageWindow(
                                                                        windowId,
                                                                        'Çoxlu Seçim',
                                                                        '📝',
                                                                        <div style={{ width: '100%', height: '100%' }}>
                                                                            <MultiValueEditor
                                                                                initialValues={Array.isArray(rule.value) ? rule.value : []}
                                                                                onSave={(values) => {
                                                                                    updateRule(idx, 'value', values)
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
                                                )}
                                            </>
                                        ) : (
                                            <input
                                                type="text"
                                                value={rule.value || ''}
                                                onChange={(e) => updateRule(idx, 'value', e.target.value)}
                                                placeholder={components.find(c => c.id === rule.component)?.label + ' yazın...'}
                                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', height: '38px', boxSizing: 'border-box' }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', background: 'white' }}>
                <button onClick={onClose} style={{ padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>Bağla</button>
                <button
                    onClick={() => {
                        onApply(rules)
                        onClose() // usually handled by caller but safe here
                    }}
                    style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', background: '#007bff', color: 'white', cursor: 'pointer' }}
                >
                    Tətbiq et
                </button>
            </div>
        </div>
    )
}
