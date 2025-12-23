import React, { useState, useMemo } from 'react'
import { Category } from '../../../shared/types'

interface MoveToCategoryModalProps {
    categories: Category[]
    onClose: () => void
    onConfirm: (targetCategoryId: number | null) => void // null = Root
    confirmLabel?: string
    cancelLabel?: string
}

export default function MoveToCategoryModal({
    categories,
    onClose,
    onConfirm,
    confirmLabel = "Seç (Köçür)",
    cancelLabel = "Ləğv et"
}: MoveToCategoryModalProps) {
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

    const tree = useMemo(() => {
        const buildTree = (parentId: number | null): Category[] => {
            return categories
                .filter(c => c.parent_id === parentId)
                .map(c => ({ ...c, children: buildTree(c.id) }))
        }
        return buildTree(null)
    }, [categories])

    const toggleExpand = (id: number) => {
        const newSet = new Set(expandedIds)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setExpandedIds(newSet)
    }

    const renderNode = (category: Category, level: number = 0) => {
        const hasChildren = category.children && category.children.length > 0
        const isExpanded = expandedIds.has(category.id)
        const isSelected = selectedId === category.id

        return (
            <div key={category.id}>
                <div
                    style={{
                        padding: '4px 8px',
                        paddingLeft: `${level * 20 + 8}px`,
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#3b82f6' : 'transparent',
                        color: isSelected ? 'white' : 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '4px'
                    }}
                    onClick={() => setSelectedId(category.id)}
                >
                    <span
                        style={{
                            marginRight: '6px',
                            cursor: 'pointer',
                            visibility: hasChildren ? 'visible' : 'hidden',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            display: 'inline-block'
                        }}
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(category.id)
                        }}
                    >
                        ▶
                    </span>
                    <span style={{ marginRight: '6px' }}>📁</span>
                    <span>{category.name}</span>
                </div>
                {isExpanded && hasChildren && (
                    <div>
                        {category.children!.map((child: Category) => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
            {/* Toolbar / Header */}
            <div style={{
                padding: '10px',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                gap: '10px',
                background: '#f9fafb'
            }}>
                <button
                    onClick={() => onConfirm(selectedId)}
                    style={{
                        padding: '6px 12px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {confirmLabel}
                </button>
                <button
                    onClick={onClose}
                    style={{
                        padding: '6px 12px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    {cancelLabel}
                </button>
            </div>

            {/* Tree Area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
                <div
                    style={{
                        padding: '4px 8px',
                        cursor: 'pointer',
                        backgroundColor: selectedId === null ? '#3b82f6' : 'transparent',
                        color: selectedId === null ? 'white' : 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '2px',
                        borderRadius: '4px'
                    }}
                    onClick={() => setSelectedId(null)}
                >
                    <span style={{ width: '14px', marginRight: '6px' }}></span>
                    <span style={{ marginRight: '6px' }}>🏠</span>
                    <span>Ana Səhifə (Root)</span>
                </div>
                {tree.map(node => renderNode(node))}
            </div>
        </div>
    )
}
