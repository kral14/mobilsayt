
import { useState, useEffect } from 'react'
import ProductSelectCell from './ProductSelectCell'
import { productsAPI } from '../services/api'
import type { Product } from '../../../shared/types'

interface ProductSelectInputProps {
    value: Product | null
    onChange: (product: Product | null) => void
    multiple?: boolean // If true, maybe we handle differently, but usually this input selects ONE product.
}

export default function ProductSelectInput({ value, onChange }: ProductSelectInputProps) {
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
            // Assuming productsAPI.getAll supports search
            // If not, we might need a specific search endpoint or filter locally if list is small?
            // Usually APIs support search. Let's assume getAll has params or we filter client side if needed.
            // Check productsAPI usage elsewhere: productsAPI.getAll() returns all?
            // In Mehsullar.tsx: loadProducts calls getAll().
            // Let's assume for now we search locally or call API.
            // Ideally we'd debounce this.

            // productsAPI.getAll() returns all products directly.
            // We filter client-side for now as API doesn't seem to support search query yet.
            const allProducts = await productsAPI.getAll()
            const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term.toLowerCase()))
            setSearchResults(filtered)
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <ProductSelectCell
            productName={searchTerm}
            productId={value?.id || null}
            searchTerm={searchTerm}
            searchResults={searchResults}
            isPurchase={false} // Or true, affects color. Neutral?
            isFocused={isFocused}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
                setIsFocused(false)
                // If not selected, maybe clear valid text? 
                // ProductSelectCell usually handles this validation by parent.
                // If value is null and text is typed but not selected, we might want to revert logic.
                if (!value) setSearchTerm('')
                else setSearchTerm(value.name)
            }}
            onSearchChange={handleSearch}
            onSelect={(product) => {
                onChange(product)
                setSearchResults([])
                setIsFocused(false)
            }}
            onClear={() => onChange(null)}
            onOpenSelect={() => {
                // Could open a full product list modal if advanced select needed
                // For now, allow text search
                // Or simulate focus to show dropdown
                handleSearch('')
            }}
            onOpenDetails={() => { }} // Optional
        />
    )
}
