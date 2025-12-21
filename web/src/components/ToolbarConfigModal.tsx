import { useState, useContext } from 'react'
import WindowContext from '../context/WindowContext'

interface ToolbarConfigModalProps {
    availableTools: { key: string, label: string, icon: React.ReactNode }[]
    visibleTools: string[]
    onSave: (visibleTools: string[]) => void
    onClose?: () => void
}

export default function ToolbarConfigModal({ availableTools, visibleTools, onSave, onClose }: ToolbarConfigModalProps) {
    const windowContext = useContext(WindowContext)
    const handleClose = windowContext?.close || onClose || (() => { })

    // Initialize lists
    // Right list: currently visible tools, in order, BUT only those that are actually available
    const [rightList, setRightList] = useState<string[]>(() => {
        const availableKeys = new Set(availableTools.map(t => t.key))
        return visibleTools.filter(key => availableKeys.has(key))
    })

    const [selectedLeft, setSelectedLeft] = useState<Set<string>>(new Set())
    const [selectedRight, setSelectedRight] = useState<Set<string>>(new Set())

    // Derive left list from availableTools and rightList
    const leftList = availableTools
        .filter(t => !rightList.includes(t.key))
        .map(t => t.key)

    const getTool = (key: string) => availableTools.find(t => t.key === key) || { key, label: key, icon: '?' }

    const moveToRight = () => {
        const toMove = Array.from(selectedLeft)
        setRightList([...rightList, ...toMove])
        setSelectedLeft(new Set())
    }

    const moveToLeft = () => {
        const toMove = new Set(selectedRight)
        setRightList(rightList.filter(key => !toMove.has(key)))
        setSelectedRight(new Set())
    }

    const toggleLeft = (key: string) => {
        const newSet = new Set(selectedLeft)
        if (newSet.has(key)) newSet.delete(key)
        else newSet.add(key)
        setSelectedLeft(newSet)
    }

    const toggleRight = (key: string) => {
        const newSet = new Set(selectedRight)
        if (newSet.has(key)) newSet.delete(key)
        else newSet.add(key)
        setSelectedRight(newSet)
    }

    const selectAllLeft = () => setSelectedLeft(new Set(leftList))
    const clearLeft = () => setSelectedLeft(new Set())

    const selectAllRight = () => setSelectedRight(new Set(rightList))
    const clearRight = () => setSelectedRight(new Set())

    const renderHeader = (title: string, onSelectAll: () => void, onClear: () => void) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{title}</div>
            <div style={{ display: 'flex', gap: '4px' }}>
                <button
                    onClick={onSelectAll}
                    title="Hamısını seç"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px' }}
                >
                    ☑️
                </button>
                <button
                    onClick={onClear}
                    title="Seçimləri ləğv et"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px' }}
                >
                    ☒
                </button>
            </div>
        </div>
    )

    const renderItem = (key: string, selectedSet: Set<string>, toggleFn: (k: string) => void) => {
        const tool = getTool(key)
        const isSelected = selectedSet.has(key)
        return (
            <div
                key={key}
                onClick={() => toggleFn(key)}
                style={{
                    padding: '0.5rem',
                    cursor: 'pointer',
                    background: isSelected ? '#e6f7ff' : 'transparent',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}
            >
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => { }} // Handled by div click
                    style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '1.2rem', width: '24px', textAlign: 'center' }}>{tool.icon}</span>
                <span>{tool.label}</span>
            </div>
        )
    }

    const moveUp = () => {
        if (selectedRight.size === 0) return
        const indices = rightList
            .map((key, i) => selectedRight.has(key) ? i : -1)
            .filter(i => i !== -1)
            .sort((a, b) => a - b)

        if (indices.length === 0 || indices[0] === 0) return // Already at top or empty

        const newList = [...rightList]
        for (const i of indices) {
            // Swap with previous
            const temp = newList[i - 1]
            newList[i - 1] = newList[i]
            newList[i] = temp
        }
        setRightList(newList)
    }

    const moveDown = () => {
        if (selectedRight.size === 0) return
        const indices = rightList
            .map((key, i) => selectedRight.has(key) ? i : -1)
            .filter(i => i !== -1)
            .sort((a, b) => b - a) // Process from bottom to top

        if (indices.length === 0 || indices[0] === rightList.length - 1) return // Already at bottom

        const newList = [...rightList]
        for (const i of indices) {
            // Swap with next
            const temp = newList[i + 1]
            newList[i + 1] = newList[i]
            newList[i] = temp
        }
        setRightList(newList)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem', boxSizing: 'border-box' }}>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
                Alətlər panelini fərdiləşdirin. Sol tərəfdən seçib sağ tərəfə əlavə edin.
            </p>

            <div style={{ display: 'flex', flex: 1, gap: '1rem', minHeight: 0 }}>
                {/* Left List: Available */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {renderHeader('Mövcud Alətlər', selectAllLeft, clearLeft)}
                    <div style={{
                        flex: 1,
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        overflowY: 'auto',
                        background: 'white'
                    }}>
                        {leftList.map(key => renderItem(key, selectedLeft, toggleLeft))}
                        {leftList.length === 0 && <div style={{ padding: '1rem', color: '#999', textAlign: 'center', fontSize: '0.85rem' }}>Bütün alətlər əlavə edilib</div>}
                    </div>
                </div>

                {/* Shuttle Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
                    <button
                        onClick={moveToRight}
                        disabled={selectedLeft.size === 0}
                        style={{
                            padding: '0.5rem',
                            cursor: selectedLeft.size > 0 ? 'pointer' : 'default',
                            opacity: selectedLeft.size > 0 ? 1 : 0.5,
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            background: '#f8f9fa'
                        }}
                        title="Seçilənləri əlavə et"
                    >
                        →
                    </button>
                    <button
                        onClick={moveToLeft}
                        disabled={selectedRight.size === 0}
                        style={{
                            padding: '0.5rem',
                            cursor: selectedRight.size > 0 ? 'pointer' : 'default',
                            opacity: selectedRight.size > 0 ? 1 : 0.5,
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            background: '#f8f9fa'
                        }}
                        title="Seçilənləri çıxar"
                    >
                        ←
                    </button>
                </div>

                {/* Right List: Selected */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {renderHeader('Seçilmiş Alətlər', selectAllRight, clearRight)}
                    <div style={{ display: 'flex', flex: 1, gap: '0.5rem', minHeight: 0 }}>
                        <div style={{
                            flex: 1,
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            overflowY: 'auto',
                            background: 'white'
                        }}>
                            {rightList.map(key => renderItem(key, selectedRight, toggleRight))}
                            {rightList.length === 0 && <div style={{ padding: '1rem', color: '#999', textAlign: 'center', fontSize: '0.85rem' }}>Heç bir alət seçilməyib</div>}
                        </div>

                        {/* Reorder Controls */}
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
                            <button
                                onClick={moveUp}
                                disabled={selectedRight.size === 0}
                                style={{
                                    padding: '0.5rem',
                                    cursor: selectedRight.size > 0 ? 'pointer' : 'default',
                                    opacity: selectedRight.size > 0 ? 1 : 0.5,
                                    borderRadius: '4px',
                                    border: '1px solid #ccc',
                                    background: '#f8f9fa'
                                }}
                                title="Yuxarı"
                            >
                                ⬆️
                            </button>
                            <button
                                onClick={moveDown}
                                disabled={selectedRight.size === 0}
                                style={{
                                    padding: '0.5rem',
                                    cursor: selectedRight.size > 0 ? 'pointer' : 'default',
                                    opacity: selectedRight.size > 0 ? 1 : 0.5,
                                    borderRadius: '4px',
                                    border: '1px solid #ccc',
                                    background: '#f8f9fa'
                                }}
                                title="Aşağı"
                            >
                                ⬇️
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '1rem', borderTop: '1px solid #ddd', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                    onClick={handleClose}
                    style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        background: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Ləğv et
                </button>
                <button
                    onClick={() => {
                        onSave(rightList)
                        handleClose()
                    }}
                    style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#007bff',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Yadda saxla
                </button>
            </div>
        </div>
    )
}
