import { useState, useEffect } from 'react'
import ProductSelectCell from './ProductSelectCell'
import { productsAPI } from '../services/api'
import type { Product } from '../../../shared/types'
import { useWindowStore } from '../store/windowStore'
import Mehsullar from '../pages/Mehsullar'

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

    useEffect(() => {
        if (value) {
            setSearchTerm(value.name)
        } else {
            setSearchTerm('')
        }
    }, [value])

    const handleSearch = async (term: string) => {
        setSearchTerm(term)
        if (!term.trim()) {
            setSearchResults([])
            return
        }

        try {
            const allProducts = await productsAPI.getAll()
            const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term.toLowerCase()))
            setSearchResults(filtered)
        } catch (e) {
            console.error(e)
        }
    }

    const openProductSelectWindow = () => {
        const windowId = 'product-select-filter-window'
        useWindowStore.getState().openPageWindow(
            windowId,
            'Məhsul Seçimi',
            '📦',
            <Mehsullar
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
            onOpenDetails={() => { }} // Optional
            placeholder={placeholder}
            tags={tags}
            {...rest}
        />
    )
}
