import { Supplier, Customer } from '@shared/types'

export interface InvoiceItem {
    product_id: number | null
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
    discount_auto?: number
    discount_manual?: number
    vat_rate?: number
    unit?: string
    searchTerm?: string
    // Flat fields from backend
    product_code?: string
    product_barcode?: string
    product_unit?: string
}

export interface TableColumnConfig {
    id: string
    label: string
    visible?: boolean
    width?: number
    order?: number
    align?: 'left' | 'right' | 'center'
}

export interface FunctionSettings {
    enableColumnDrag?: boolean
    enableColumnResize?: boolean
}

export interface ModalData {
    id: string
    invoiceId: number | null
    position: { x: number, y: number }
    x: number
    y: number
    size: { width: number, height: number }
    width: number
    height: number
    isMaximized: boolean
    zIndex: number
    minimized: boolean
    isActive?: boolean
    invoiceType?: 'sale' | 'purchase'
    data: {
        selectedSupplierId?: number | null
        selectedSupplier?: Supplier | null
        selectedCustomerId?: number | null
        selectedCustomer?: Customer | null
        invoiceItems: InvoiceItem[]
        notes: string
        paymentDate?: string
        invoiceNumber?: string
        invoiceDate?: string
    }
}
