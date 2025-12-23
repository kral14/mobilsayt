
import { useState, useEffect } from 'react'
import type { Category } from '../../../shared/types'

interface CategoryTreeProps {
    categories: Category[]
    selectedCategoryId: number | null
    onSelect: (categoryId: number | null) => void
    onEdit: (category: Category) => void
    onDelete: (category: Category) => void
    onMove: (category: Category) => void
    onCreateSubCategory: (parentCategory: Category | null) => void // null for root
    onMoveProducts: (categoryId: number | null) => void
}

export default function CategoryTree({
    categories,
    selectedCategoryId,
    onSelect,
    onEdit,
    onDelete,
    onMove,
    onCreateSubCategory,
    onMoveProducts
}: CategoryTreeProps) {
    // Local state for expanded categories
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

    // Load expanded from storage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('anbar-expanded-categories')
            if (saved) {
                setExpandedCategories(new Set(JSON.parse(saved)))
            }
        } catch (e) {
            // ignore
        }
    }, [])

    const saveExpandedCategories = (expanded: Set<number>) => {
        try {
            localStorage.setItem('anbar-expanded-categories', JSON.stringify(Array.from(expanded)))
        } catch (e) {
            console.error('Error saving expanded categories:', e)
        }
    }

    const toggleExpanded = (categoryId: number) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId)
        } else {
            newExpanded.add(categoryId)
        }
        setExpandedCategories(newExpanded)
        saveExpandedCategories(newExpanded)
    }

    const buildCategoryTree = (cats: Category[], parentId: number | null = null): Category[] => {
        return cats
            .filter(cat => cat.parent_id === parentId)
            .map(cat => ({
                ...cat,
                children: buildCategoryTree(cats, cat.id)
            }))
    }

    const categoryTree = buildCategoryTree(categories)

    const CategoryTreeItem = ({ category, level = 0 }: { category: Category; level?: number }) => {
        const isExpanded = expandedCategories.has(category.id)
        const isSelected = selectedCategoryId === category.id
        const productCount = category._count?.products || 0
        const hasChildren = category.children && category.children.length > 0

        return (
            <div style={{ marginLeft: level === 1 ? '12px' : '0' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px 6px',
                        background: isSelected ? '#e3f2fd' : 'transparent',
                        borderRadius: '6px',
                        marginBottom: '1px',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        border: isSelected ? '1px solid #2196f3' : '1px solid transparent',
                        position: 'relative',
                        minHeight: '28px'
                    }}
                    onClick={() => onSelect(category.id)}
                    onDrop={(e) => {
                        e.preventDefault()
                        onMoveProducts(category.id)
                    }}
                    onDragOver={(e) => e.preventDefault()}
                >
                    {/* Expand/Collapse Icon */}
                    <span
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleExpanded(category.id)
                        }}
                        style={{
                            marginRight: '4px',
                            cursor: 'pointer',
                            visibility: productCount > 0 || hasChildren ? 'visible' : 'hidden',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            display: 'inline-block',
                            transition: 'transform 0.2s',
                            fontSize: '0.7rem',
                            color: '#666'
                        }}
                    >
                        ▶
                    </span>

                    {/* Folder Icon */}
                    <span style={{ marginRight: '6px', fontSize: '1rem' }}>
                        {isExpanded ? '📂' : '📁'}
                    </span>

                    {/* Category Name */}
                    <span style={{
                        flex: 1,
                        fontWeight: isSelected ? '600' : '400',
                        color: isSelected ? '#1976D2' : '#333',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0
                    }}>
                        {category.name}
                    </span>

                    {/* Product Count Badge */}
                    {productCount > 0 && (
                        <span style={{
                            background: isSelected ? '#1976D2' : '#eee',
                            color: isSelected ? '#fff' : '#666',
                            padding: '0.1rem 0.5rem',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            minWidth: '20px',
                            textAlign: 'center',
                            marginRight: '0.5rem'
                        }}>
                            {productCount}
                        </span>
                    )}

                    {/* Action Buttons for Selected Category */}
                    {isSelected && (
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                            <button onClick={(e) => { e.stopPropagation(); onCreateSubCategory(category) }} title="Alt papka" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>➕</button>
                            <button onClick={(e) => { e.stopPropagation(); onEdit(category) }} title="Redaktə" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✏️</button>
                            <button onClick={(e) => { e.stopPropagation(); onMove(category) }} title="Köçür" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>📦</button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(category) }} title="Sil" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
                        </div>
                    )}
                </div>

                {/* Children */}
                {isExpanded && category.children?.map((child: Category) => (
                    <CategoryTreeItem key={child.id} category={child} level={level + 1} />
                ))}
            </div>
        )
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
                <h3 style={{ margin: 0 }}>Papkalar</h3>
                <button
                    onClick={() => onCreateSubCategory(null)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2rem'
                    }}
                    title="Yeni papka"
                >
                    ➕
                </button>
            </div>

            <div
                style={{
                    padding: '0.5rem',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    background: selectedCategoryId === null ? '#e3f2fd' : 'transparent',
                    borderRadius: '6px',
                    fontWeight: selectedCategoryId === null ? '600' : '400',
                    display: 'flex',
                    alignItems: 'center',
                    border: selectedCategoryId === null ? '1px solid #2196f3' : '1px solid transparent'
                }}
                onClick={() => onSelect(null)}
                onDrop={(e) => {
                    e.preventDefault()
                    onMoveProducts(null)
                }}
                onDragOver={(e) => e.preventDefault()}
            >
                <span style={{ marginRight: '0.5rem', fontSize: '1.2rem' }}>📦</span>
                Bütün Məhsullar
            </div>

            <div style={{ overflow: 'auto', flex: 1 }}>
                {categoryTree.map(cat => (
                    <CategoryTreeItem key={cat.id} category={cat} />
                ))}
            </div>
        </div>
    )
}
