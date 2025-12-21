import { useState } from 'react'
import type { Product } from '../../../shared/types'
import ProductSelectInput from './ProductSelectInput'
import { AddButton, CopyButton, DeleteButton } from './ToolbarButtons'

interface MultiValueEditorModalProps {
    initialValues: Product[]
    onSave: (values: Product[]) => void
    onCancel: () => void
}

export default function MultiValueEditorModal({ initialValues, onSave, onCancel }: MultiValueEditorModalProps) {
    const [items, setItems] = useState<(Product | null)[]>(
        initialValues.length > 0 ? initialValues : [null]
    )
    const [selectedRow, setSelectedRow] = useState<number | null>(null)

    const handleUpdate = (index: number, val: Product | null) => {
        const newItems = [...items]
        newItems[index] = val
        setItems(newItems)
    }

    const handleAdd = () => {
        const newItems = [...items]
        if (selectedRow !== null) {
            newItems.splice(selectedRow + 1, 0, null)
            setSelectedRow(selectedRow + 1)
        } else {
            newItems.push(null)
            setSelectedRow(newItems.length - 1)
        }
        setItems(newItems)
    }

    const handleCopy = () => {
        if (selectedRow === null) return
        const valToCopy = items[selectedRow]
        const newItems = [...items]
        newItems.splice(selectedRow + 1, 0, valToCopy)
        setItems(newItems)
        setSelectedRow(selectedRow + 1)
    }

    const handleDelete = () => {
        if (selectedRow === null) return
        const newItems = items.filter((_, i) => i !== selectedRow)
        if (newItems.length === 0) {
            setItems([null])
            setSelectedRow(0)
        } else {
            setItems(newItems)
            if (selectedRow >= newItems.length) {
                setSelectedRow(newItems.length - 1)
            }
        }
    }

    const handleSave = () => {
        const validProducts = items.filter(p => p !== null) as Product[]
        onSave(validProducts)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f5f5' }}>
            {/* Custom Toolbar */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.5rem',
                background: '#f5f5f5',
                borderBottom: '1px solid #ddd',
                alignItems: 'center'
            }}>
                <AddButton onClick={handleAdd} />
                <CopyButton onClick={selectedRow !== null ? handleCopy : undefined} />
                <DeleteButton onClick={selectedRow !== null ? handleDelete : undefined} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px', padding: '1rem' }}>
                {items.map((item, index) => (
                    <div
                        key={index}
                        onClick={() => setSelectedRow(index)}
                        style={{
                            padding: '0.5rem',
                            background: selectedRow === index ? '#e6f7ff' : 'white',
                            border: selectedRow === index ? '1px solid #1890ff' : '1px solid transparent',
                            borderBottom: '1px solid #eee',
                            cursor: 'pointer',
                            borderRadius: '4px'
                        }}
                    >
                        <ProductSelectInput
                            value={item}
                            onChange={(val) => handleUpdate(index, val)}
                        />
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #ddd', padding: '1rem', background: 'white' }}>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '0.5rem 1.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        background: 'white',
                        cursor: 'pointer'
                    }}
                >
                    İmtina
                </button>
                <button
                    onClick={handleSave}
                    style={{
                        padding: '0.5rem 1.5rem',
                        border: 'none',
                        borderRadius: '4px',
                        background: '#28a745',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Təsdiqlə
                </button>
            </div>
        </div>
    )
}
