import { useState } from 'react'

interface FilterSaveModalProps {
    existingPresets: string[]
    onSave: (name: string) => void
    onCancel: () => void
}

export default function FilterSaveModal({ existingPresets, onSave, onCancel }: FilterSaveModalProps) {
    const [name, setName] = useState('')
    const [selected, setSelected] = useState<string | null>(null)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '10px', boxSizing: 'border-box' }}>
            <div style={{ paddingBottom: '5px', fontWeight: 'bold', color: '#666' }}>
                Daha əvvəl yadda saxlanılanlar:
            </div>

            <div style={{
                flex: 1,
                border: '1px solid #ccc',
                background: 'white',
                overflowY: 'auto',
                marginBottom: '10px'
            }}>
                {existingPresets.length === 0 && <div style={{ padding: '10px', color: '#999', fontStyle: 'italic' }}>Yadda saxlanılan filtr yoxdur</div>}

                {existingPresets.map(preset => (
                    <div
                        key={preset}
                        onClick={() => {
                            setSelected(preset)
                            setName(preset)
                        }}
                        style={{
                            padding: '4px 8px',
                            cursor: 'pointer',
                            background: selected === preset ? '#3f8cb5' : 'transparent',
                            color: selected === preset ? 'white' : 'black',
                        }}
                    >
                        {preset}
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.9rem', color: '#333' }}>Filtrin adı:</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value)
                        setSelected(null)
                    }}
                    style={{
                        width: '100%',
                        padding: '5px',
                        border: '1px solid #ccc',
                        borderRadius: '3px',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '15px' }}>
                <button
                    onClick={() => {
                        if (name.trim()) onSave(name)
                    }}
                    style={{
                        padding: '6px 12px',
                        background: '#f0ad4e',
                        border: '1px solid #eea236',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        color: '#333'
                    }}
                >
                    Yadda saxla
                </button>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '6px 12px',
                        background: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '3px',
                        cursor: 'pointer'
                    }}
                >
                    Ləğv et
                </button>
            </div>
        </div>
    )
}
