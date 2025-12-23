import { useState, useEffect, useRef } from 'react'
import ProductSelectCell from './ProductSelectCell'
import { productsAPI } from '../services/api'
import type { Product } from '../../../shared/types'
import { useWindowStore } from '../store/windowStore'
import Products2 from '../pages/Products2'

interface ProductSelectInputProps {
    value: Product | null
    onChange: (product: Product | null) => void
    multiple?: boolean
    placeholder?: string
    onOpenSelect?: () => void
    tags?: React.ReactNode // Allow passing tags
}

export default function ProductSelectInput({ value, onChange, placeholder, onOpenSelect, tags, ...rest }: ProductSelectInputProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<Product[]>([])
    const [isFocused, setIsFocused] = useState(false)
    const isTyping = useRef(false)

    useEffect(() => {
        if (isTyping.current) {
            isTyping.current = false
            return
        }
        if (value) {
            setSearchTerm(value.name)
        } else {
            setSearchTerm('')
        }
    }, [value])

    const handleSearch = async (term: string) => {
        isTyping.current = true
        setSearchTerm(term)

        // Reset selection if typing creates difference or just typing
        if (value) {
            onChange(null)
        }

        if (!term.trim()) {
            setSearchResults([])
            return
        }

        try {
            const allProducts = await productsAPI.getAll()
            const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term.toLowerCase()))
            setSearchResults(filtered)
        } catch (e) {
            console.error('[ProductSelectInput] Search error:', e)
        }
    }

    const openProductSelectWindow = () => {
        const windowId = 'product-select-filter-window'
        useWindowStore.getState().openPageWindow(
            windowId,
            'Məhsul Seçimi',
            '📦',
            <Products2
                onSelect={(product) => {
                    onChange(product)
                    useWindowStore.getState().closePageWindow(windowId)
                }}
            />,
            { width: 1000, height: 700 }
        )
    }

    return (
        <ProductSelectCell
            productName={value ? value.name : searchTerm}
            productId={value?.id || null}
            searchTerm={searchTerm}
            searchResults={searchResults}
            isPurchase={false}
            isFocused={isFocused}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
                setIsFocused(false)
                if (!value) setSearchTerm('')
                else setSearchTerm(value.name)
            }}
            onSearchChange={handleSearch}
            onSelect={(product) => {
                onChange(product)
                setSearchTerm(product.name) // Force update
                setSearchResults([])
                setIsFocused(false)
            }}
            onClear={() => onChange(null)}
            onOpenSelect={onOpenSelect || openProductSelectWindow}
            onOpenDetails={async (productId: number) => {
                // Fetch product details to get category_id
                try {
                    const product = await productsAPI.getById(productId.toString())
                    // Open Products2 window and navigate to product's category
                    useWindowStore.getState().openPageWindow(
                        'products2-locate',
                        'Məhsullar',
                        '📦',
                        <Products2
                            initialSelectedProductId={productId}
                            initialCategoryId={product.category_id || null}
                            onSelect={() => {
                                // Close window when user clicks on product in locate mode
                                useWindowStore.getState().closePageWindow('products2-locate')
                            }}
                        />,
                        { width: 1200, height: 800 }
                    )
                } catch (err) {
                    console.error('[ProductSelectInput] Failed to locate product:', err)
                }
            }}
            placeholder={placeholder}
            tags={tags}
            {...rest}
        />
    )
}
