
import { useState } from 'react'
import ProductSelectInput from './ProductSelectInput'
import UniversalToolBar from './UniversalToolBar'
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


    // Temporary state for the currently editing rule for "Product"
    // In a real app we might allow multiple rules. User description implies configuring "the" filter.
    // "sol terefde komponentleri secirik sag terefde ise onu idare edirik"
    // "meselen secdik mehsul dusur sag terefe" -> "we select product, it falls to right side"
    // This implies we Add it to the active filters.

    // Let's implement active rules state.

    const handleAddComponent = (component: string) => {
        // Check if already exists? Or allow multiple?
        // Let's allow one for now for simplicity unless multi needed.
        if (!rules.find(r => r.component === component)) {
            setRules([...rules, { component, condition: 'equals', value: null }])
        }
    }

    const updateRule = (index: number, field: keyof FilterRule, val: any) => {
        const newRules = [...rules]
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
        setRules(newRules)
    }

    const removeRule = (index: number) => {
        setRules(rules.filter((_, i) => i !== index))
    }

    const components = [
        { id: 'product', label: 'Məhsul' }
        // Add more later: Category, Price...
    ]

    return (
        <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
            <UniversalToolBar
                onAdd={() => { }} // Placeholder for adding new filter
                onDelete={() => { }} // Placeholder for delete
                onSearch={(term) => { }} // Placeholder for search
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
                                    fontWeight: rules.find(r => r.component === comp.id) ? 'bold' : 'normal'
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
                            <div key={idx} style={{
                                border: '1px solid #eee',
                                padding: '1rem',
                                borderRadius: '8px',
                                background: 'white',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <strong>{components.find(c => c.id === rule.component)?.label}</strong>
                                    <button
                                        onClick={() => removeRule(idx)}
                                        style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {/* Condition Select */}
                                    <select
                                        value={rule.condition}
                                        onChange={(e) => updateRule(idx, 'condition', e.target.value)}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd'
                                        }}
                                    >
                                        <option value="equals">1 seçim</option>
                                        <option value="in">1-dən çox seçim</option>
                                        <option value="not_equals">1 seçimi nəzərə alma</option>
                                        <option value="not_in">1-dən çox seçimi nəzərə alma</option>
                                    </select>

                                    {/* Input Area */}
                                    <div style={{ flex: 1 }}>
                                        {rule.component === 'product' && (
                                            <>
                                                {(rule.condition === 'equals' || rule.condition === 'not_equals') ? (
                                                    <ProductSelectInput
                                                        value={rule.value}
                                                        onChange={(val) => updateRule(idx, 'value', val)}
                                                    />
                                                ) : (
                                                    /* Multiple Select Logic */
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                            {Array.isArray(rule.value) && rule.value.map((p: Product, pIdx: number) => (
                                                                <span key={p.id} style={{ background: '#e7f3ff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    {p.name}
                                                                    <span
                                                                        style={{ cursor: 'pointer', fontWeight: 'bold' }}
                                                                        onClick={() => {
                                                                            const newVal = rule.value.filter((_: any, i: number) => i !== pIdx)
                                                                            updateRule(idx, 'value', newVal)
                                                                        }}
                                                                    >×</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <ProductSelectInput
                                                            value={null}
                                                            onChange={(val) => {
                                                                if (val) {
                                                                    const current = Array.isArray(rule.value) ? rule.value : []
                                                                    // prevent duplicates?
                                                                    if (!current.find((p: Product) => p.id === val.id)) {
                                                                        updateRule(idx, 'value', [...current, val])
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </>
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
