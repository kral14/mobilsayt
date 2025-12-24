import React, { useState } from 'react'
import { ModalData } from './InvoiceTypes'
import { Customer, Supplier, WarehouseLocation } from '@shared/types'
import PartnerSelect from './PartnerSelect'
import SmartDateInput from './SmartDateInput'

interface InvoiceHeaderProps {
    isPurchase: boolean
    localData: ModalData['data']
    setLocalData: React.Dispatch<React.SetStateAction<ModalData['data']>>
    suppliers: Supplier[]
    customers: Customer[]
    warehouses: WarehouseLocation[]
}

const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
    isPurchase,
    localData,
    setLocalData,
    suppliers,
    customers,
    warehouses
}) => {
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null)
    const [showInvoiceDatePicker, setShowInvoiceDatePicker] = useState(false)

    return (
        <div style={{
            display: 'flex',
            gap: '0',
            alignItems: 'stretch',
            padding: '0 2px',
        }}>
            {/* Section 1: Təchizatçı & Anbar */}
            <div style={{
                flex: '1.5',
                paddingRight: '15px',
                borderRight: '1px solid #dee2e6',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {/* 1. Təchizatçı OR Müştəri */}
                {isPurchase ? (
                    <PartnerSelect
                        partners={suppliers}
                        value={localData.selectedSupplier || null}
                        onChange={(supplier) => {
                            setLocalData(prev => ({
                                ...prev,
                                selectedSupplierId: supplier?.id || null,
                                selectedSupplier: supplier as Supplier | null
                            }))
                        }}
                        placeholder="Seçin..."
                        filterType="SUPPLIER"
                        label="Təchizatçı:"
                    />
                ) : (
                    <PartnerSelect
                        partners={customers}
                        value={localData.selectedCustomer || null}
                        onChange={(customer) => {
                            setLocalData(prev => ({
                                ...prev,
                                selectedCustomerId: customer?.id || null,
                                selectedCustomer: customer as Customer | null
                            }))
                        }}
                        placeholder="Seçin..."
                        filterType="BUYER"
                        label="Müştəri:"
                    />
                )}

                {/* 4. Anbar */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '90px', fontWeight: '500', fontSize: '0.9rem', color: '#495057', flexShrink: 0 }}>
                        Anbar:
                    </label>
                    <select
                        value={selectedWarehouseId || ''}
                        onChange={(e) => setSelectedWarehouseId(Number(e.target.value) || null)}
                        style={{
                            flex: 1,
                            padding: '2px 8px',
                            border: '1px solid #e0e0e0',
                            outline: 'none',
                            boxShadow: 'none',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            height: '24px',
                            background: 'white',
                            minWidth: 0
                        }}
                    >
                        <option value="">Seçin...</option>
                        {warehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Section 2: Qaimə № & Son Öd. */}
            <div style={{
                flex: '1',
                paddingLeft: '15px',
                paddingRight: '15px',
                borderRight: '1px solid #dee2e6',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {/* 2. Qaimə № */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '80px', fontWeight: '500', fontSize: '0.9rem', color: '#495057', flexShrink: 0 }}>
                        Qaimə №:
                    </label>
                    <input
                        type="text"
                        placeholder="Avtomatik"
                        value={localData.invoiceNumber || ''}
                        readOnly
                        style={{
                            flex: 1,
                            padding: '2px 8px',
                            border: '1px solid #e0e0e0',
                            outline: 'none',
                            boxShadow: 'none',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            height: '24px',
                            background: '#f8f9fa',
                            color: '#6c757d',
                            minWidth: 0
                        }}
                    />
                </div>

                {/* 5. Son Ödəniş Tarixi */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '80px', fontWeight: '500', fontSize: '0.9rem', color: '#495057', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        Son Öd.:
                    </label>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <SmartDateInput
                            value={localData.paymentDate || new Date().toISOString()}
                            onDateChange={(isoDate) => setLocalData(prev => ({ ...prev, paymentDate: isoDate }))}
                            style={{
                                width: '100%',
                                padding: '2px 8px',
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                height: '24px',
                                background: 'white',
                                color: '#495057'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Section 3: Tarix */}
            <div style={{
                flex: '1.2',
                paddingLeft: '15px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {/* 3. Tarix */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '60px', fontWeight: '500', fontSize: '0.9rem', color: '#495057', flexShrink: 0 }}>
                        Tarix:
                    </label>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <SmartDateInput
                            value={localData.invoiceDate || new Date().toISOString()}
                            onDateChange={(isoDate) => setLocalData(prev => ({ ...prev, invoiceDate: isoDate }))}
                            style={{
                                width: '100%',
                                padding: '2px 28px 2px 8px',
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                height: '24px',
                                color: '#495057'
                            }}
                        />
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowInvoiceDatePicker(!showInvoiceDatePicker) }}
                            style={{
                                position: 'absolute',
                                right: '4px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#6c757d',
                                padding: '0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                width: '24px'
                            }}
                            title="Kalendar"
                        >
                            📅
                        </button>
                        {showInvoiceDatePicker && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '2px',
                                background: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                padding: '5px',
                                zIndex: 1000,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }} onMouseDown={e => e.preventDefault()}>
                                <input
                                    type="date"
                                    value={localData.invoiceDate ? localData.invoiceDate.split(' ')[0] : ''}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const time = localData.invoiceDate?.split(' ')[1] || '00:00:00';
                                            setLocalData(prev => ({ ...prev, invoiceDate: `${e.target.value} ${time}` }));
                                        }
                                        setShowInvoiceDatePicker(false)
                                    }}
                                    style={{ border: '1px solid #ddd', borderRadius: '3px', padding: '2px' }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InvoiceHeader
