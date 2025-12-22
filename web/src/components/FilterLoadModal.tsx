import { useState, useEffect } from 'react'

interface FilterLoadModalProps {
    presets: string[]
    onSelect: (name: string) => void
    onCancel: () => void
    onDelete?: (name: string) => void
}

export default function FilterLoadModal({ presets, onSelect, onCancel, onDelete }: FilterLoadModalProps) {
    const [selected, setSelected] = useState<string | null>(null)
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, preset: string } | null>(null)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selected && onDelete) {
                if (confirm(`"${selected}" filtrini silmək istədiyinizə əminsiniz?`)) {
                    onDelete(selected)
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selected, onDelete])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '10px', boxSizing: 'border-box' }}>
            <div style={{
                flex: 1,
                border: '1px solid #ccc',
                background: 'white',
                overflowY: 'auto',
                marginBottom: '10px'
            }}>
                {presets.length === 0 && <div style={{ padding: '10px', color: '#999', fontStyle: 'italic' }}>Yadda saxlanılan filtr yoxdur</div>}

                {presets.map(preset => (
                    <div
                        key={preset}
                        onClick={() => setSelected(preset)}
                        onDoubleClick={() => onSelect(preset)}
                        onContextMenu={(e) => {
                            e.preventDefault()
                            // Adjust coordinates if close to edge
                            const x = e.clientX
                            const y = e.clientY
                            setContextMenu({ x, y, preset })
                            setSelected(preset)
                        }}
                        style={{
                            padding: '4px 8px',
                            cursor: 'pointer',
                            background: selected === preset ? '#3f8cb5' : 'transparent',
                            color: selected === preset ? 'white' : 'black',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            userSelect: 'none'
                        }}
                    >
                        <span>{preset}</span>
                    </div>
                ))}
            </div>

            {contextMenu && (
                <>
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                        onClick={() => setContextMenu(null)}
                        onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
                    />
                    <div style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        background: 'white',
                        border: '1px solid #ccc',
                        boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
                        zIndex: 1000,
                        padding: '2px',
                        minWidth: '120px',
                        borderRadius: '2px'
                    }}>
                        <div
                            onClick={() => {
                                if (onDelete && confirm(`"${contextMenu.preset}" filtrini silmək istədiyinizə əminsiniz?`)) {
                                    onDelete(contextMenu.preset)
                                }
                                setContextMenu(null)
                            }}
                            className="context-menu-item"
                            style={{
                                padding: '5px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.9rem',
                                color: '#333'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#e7f3ff'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                            <span style={{ color: 'red', fontWeight: 'bold' }}>✕</span> Sil <span style={{ marginLeft: 'auto', color: '#999', fontSize: '0.8rem' }}>Del</span>
                        </div>
                    </div>
                </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '5px' }}>
                <button
                    onClick={() => {
                        if (selected) onSelect(selected)
                    }}
                    disabled={!selected}
                    style={{
                        padding: '6px 12px',
                        background: selected ? '#f0ad4e' : '#eee',
                        border: '1px solid #eea236',
                        borderRadius: '3px',
                        cursor: selected ? 'pointer' : 'default',
                        fontWeight: 'bold',
                        color: '#333',
                        opacity: selected ? 1 : 0.6
                    }}
                >
                    Seç
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
