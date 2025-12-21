import React, { useState, useEffect } from 'react'
import type { Product, Category } from '../../../shared/types'
import { useWindow } from '../context/WindowContext'

interface ProductFormData {
    name: string
    code: string
    barcode: string
    article: string
    description: string
    unit: string
    purchase_price: string
    sale_price: string
    category_id: string
    type: string
    brand: string
    model: string
    color: string
    country: string
    manufacturer: string
    warranty_period: string
    production_date: string
    expiry_date: string
    is_active: boolean
}

interface ProductFormProps {
    product: Product | null
    categories: Category[]
    existingBarcodes: string[] // For validation
    onSubmit: (data: any) => Promise<void> // Helper to pass submit logic
}

export default function ProductForm({
    product,
    categories,
    existingBarcodes,
    onSubmit
}: ProductFormProps) {
    const windowContext = useWindow()

    try {
        console.log(`[${new Date().toISOString()}] [ProductForm] Rendered. Product:`, product ? product.name : 'null')
    } catch (e) { console.error('Error logging in ProductForm', e) }

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        code: '',
        barcode: '',
        article: '',
        description: '',
        unit: 'ədəd',
        purchase_price: '',
        sale_price: '',
        category_id: '',
        type: '',
        brand: '',
        model: '',
        color: '',
        country: '',
        manufacturer: '',
        warranty_period: '',
        production_date: '',
        expiry_date: '',
        is_active: true
    })

    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)

    // Initialize form when product changes
    useEffect(() => {
        console.log('[ProductForm] Initializing with product:', product)
        if (product) {
            let productionDateStr = ''
            let expiryDateStr = ''

            if (product.production_date) {
                try {
                    const prodDate = new Date(product.production_date)
                    if (!isNaN(prodDate.getTime())) {
                        productionDateStr = prodDate.toISOString().split('T')[0]
                    }
                } catch (e) {
                    console.error('Production date parse error:', e)
                }
            }

            if (product.expiry_date) {
                try {
                    const expDate = new Date(product.expiry_date)
                    if (!isNaN(expDate.getTime())) {
                        expiryDateStr = expDate.toISOString().split('T')[0]
                    }
                } catch (e) {
                    console.error('Expiry date parse error:', e)
                }
            }

            setFormData({
                name: product.name || '',
                code: product.code || '',
                barcode: product.barcode || '',
                article: product.article || '',
                description: product.description || '',
                unit: product.unit || 'ədəd',
                purchase_price: product.purchase_price?.toString() || '',
                sale_price: product.sale_price?.toString() || '',
                category_id: product.category_id?.toString() || '',
                type: product.type || '',
                brand: product.brand || '',
                model: product.model || '',
                color: product.color || '',
                country: product.country || '',
                manufacturer: product.manufacturer || '',
                warranty_period: product.warranty_period?.toString() || '',
                production_date: productionDateStr,
                expiry_date: expiryDateStr,
                is_active: product.is_active !== null ? product.is_active : true
            })
        } else {
            // Reset logic for new product
            setFormData({
                name: '',
                code: '',
                barcode: '',
                article: '',
                description: '',
                unit: 'ədəd',
                purchase_price: '',
                sale_price: '',
                category_id: '',
                type: '',
                brand: '',
                model: '',
                color: '',
                country: '',
                manufacturer: '',
                warranty_period: '',
                production_date: '',
                expiry_date: '',
                is_active: true
            })
        }
    }, [product])

    const calculateDateDifference = (startDate: Date, endDate: Date) => {
        let years = endDate.getFullYear() - startDate.getFullYear()
        let months = endDate.getMonth() - startDate.getMonth()
        let days = endDate.getDate() - startDate.getDate()

        if (days < 0) {
            const lastDayOfPrevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate()
            days += lastDayOfPrevMonth
            months--
        }

        if (months < 0) {
            months += 12
            years--
        }

        return { years, months, days }
    }

    const generateBarcode = () => {
        const timestamp = Date.now().toString()
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        return `BC${timestamp.slice(-8)}${random}`
    }

    const handleBarcodeChange = (barcode: string) => {
        setFormData(prev => {
            let code = prev.code
            if (barcode && barcode.length >= 6 && !prev.code) {
                code = barcode.slice(-6)
            }
            return { ...prev, barcode, code }
        })
    }

    const handleAutoGenerateBarcode = () => {
        let newBarcode = generateBarcode()
        while (existingBarcodes.includes(newBarcode)) {
            newBarcode = generateBarcode()
        }
        handleBarcodeChange(newBarcode)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            alert('Məhsul adı məcburidir')
            return
        }

        // Pass data to parent logic
        await onSubmit(formData)
    }

    const renderCategoryOptions = (categories: Category[], prefix = '') => {
        return categories.map(cat => (
            <React.Fragment key={cat.id}>
                <option value={cat.id.toString()}>
                    {prefix}{cat.name}
                </option>
                {cat.children && cat.children.length > 0 &&
                    renderCategoryOptions(cat.children, prefix + '  ')
                }
            </React.Fragment>
        ))
    }

    return (
        <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto', background: 'white' }}>
            <div style={{ maxWidth: '100%', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                        {product ? 'Məhsul Redaktə Et' : 'Yeni Məhsul Əlavə Et'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Məhsul adı <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem'
                            }}
                            placeholder="Məhsul adını daxil edin"
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Artikul
                        </label>
                        <input
                            type="text"
                            value={formData.article}
                            onChange={(e) => setFormData({ ...formData, article: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem'
                            }}
                            placeholder="Artikul"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Kod
                            </label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    background: formData.barcode && !formData.code ? '#f0f0f0' : 'white'
                                }}
                                placeholder="Avtomatik (barkodun son 6 rəqəmi)"
                                readOnly={!!formData.barcode && !formData.code}
                                title={formData.barcode && !formData.code ? 'Barkodun son 6 rəqəmi avtomatik təyin olunur' : ''}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Barkod
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={formData.barcode}
                                    onChange={(e) => handleBarcodeChange(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '1rem'
                                    }}
                                    placeholder="Barkod"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowBarcodeScanner(true)}
                                    style={{
                                        padding: '0.75rem',
                                        background: '#17a2b8',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '45px'
                                    }}
                                    title="Barkod oxu"
                                >
                                    📷
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAutoGenerateBarcode}
                                    style={{
                                        padding: '0.75rem',
                                        background: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        whiteSpace: 'nowrap'
                                    }}
                                    title="Avtomatik barkod yarat"
                                >
                                    🔄
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Təsvir
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                resize: 'vertical'
                            }}
                            placeholder="Məhsul təsviri"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Vahid
                            </label>
                            <select
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="ədəd">ədəd</option>
                                <option value="kq">kq</option>
                                <option value="litr">litr</option>
                                <option value="metr">metr</option>
                                <option value="dəst">dəst</option>
                                <option value="qutu">qutu</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Alış qiyməti (AZN)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.purchase_price}
                                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Satış qiyməti (AZN) <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.sale_price}
                                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Əlavə Məlumatlar */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid #eee' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#333' }}>Əlavə Məlumatlar</h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Papka
                            </label>
                            <select
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="">Papka seçin</option>
                                {renderCategoryOptions(categories)}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Növ/Tip
                                </label>
                                <input
                                    type="text"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '1rem'
                                    }}
                                    placeholder="Növ/Tip"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Marka
                                </label>
                                <input
                                    type="text"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '1rem'
                                    }}
                                    placeholder="Marka"
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => windowContext.close()}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: '#f8f9fa',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                color: '#333'
                            }}
                        >
                            Ləğv et
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: '500'
                            }}
                        >
                            Yadda saxla
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
