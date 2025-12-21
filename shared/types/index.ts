// Ortaq TypeScript tipləri - Web və Backend üçün

export interface User {
  id: number
  email: string
  full_name?: string
  role?: string
  is_admin?: boolean
  is_active?: boolean
  created_at: Date | null
  updated_at?: Date | null
}

export interface Customer {
  id: number
  code: string | null
  name: string
  phone: string | null
  email: string | null
  address: string | null
  balance: number | null
  permanent_discount: number | null
  folder_id: number | null
  is_active: boolean | null
  type: 'BUYER' | 'SUPPLIER' | 'BOTH' | null
  created_at: Date | null
  updated_at: Date | null
}

export interface Category {
  id: number
  name: string
  parent_id: number | null
  created_at: Date | null
  updated_at: Date | null
  children?: Category[]
  _count?: {
    products: number
  }
}

export interface Product {
  id: number
  name: string
  barcode: string | null
  description: string | null
  unit: string | null
  purchase_price: number | null
  sale_price: number | null
  code: string | null
  article: string | null
  category_id: number | null
  type: string | null
  brand: string | null
  model: string | null
  color: string | null
  size: string | null
  weight: number | null
  country: string | null
  manufacturer: string | null
  warranty_period: number | null
  production_date: Date | string | null
  expiry_date: Date | string | null
  min_stock: number | null
  max_stock: number | null
  tax_rate: number | null
  is_active: boolean | null
  created_at: Date | null
  updated_at: Date | null
  category?: Category | null
  stock_quantity?: number | null
}

export interface Warehouse {
  id: number
  product_id: number | null
  quantity: number | null
  updated_at: Date | null
}

export interface SaleInvoice {
  id: number
  invoice_number: string
  customer_id: number | null
  total_amount: number | null
  invoice_date: Date | null
  payment_date: Date | null
  notes: string | null
  is_active: boolean | null
  created_at: Date | null
  customers?: Customer | null
  sale_invoice_items?: SaleInvoiceItem[]
}

export interface SaleInvoiceItem {
  id: number
  invoice_id: number | null
  product_id: number | null
  quantity: number
  unit_price: number
  total_price: number
  discount_auto?: number | null
  discount_manual?: number | null
  products?: Product | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
  phone?: string
}

export interface AuthResponse {
  token: string
  user: User
  customer?: Customer | null
}

export interface CreateOrderRequest {
  customer_id?: number
  items: {
    product_id: number
    quantity: number
    unit_price: number
    total_price: number
    discount_auto?: number
    discount_manual?: number
  }[]
  notes?: string
  payment_date?: string
  invoice_number?: string
  invoice_date?: string
  is_active?: boolean
}


export interface Supplier {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  balance: number | null
  permanent_discount: number | null
  created_at: Date | null
  updated_at: Date | null
}

export interface PurchaseInvoice {
  id: number
  invoice_number: string
  supplier_id: number | null
  total_amount: number | null
  invoice_date: Date | null
  payment_date: Date | null
  notes: string | null
  is_active: boolean | null
  created_at: Date | null
  suppliers?: Supplier | null
  purchase_invoice_items?: PurchaseInvoiceItem[]
}

export interface PurchaseInvoiceItem {
  id: number
  invoice_id: number | null
  product_id: number | null
  quantity: number
  unit_price: number
  total_price: number
  discount_auto?: number | null
  discount_manual?: number | null
  products?: Product | null
}

export interface WarehouseLocation {
  id: number
  name: string
}

export interface DiscountDocumentItem {
  id: number
  document_id: number
  product_id: number | null
  discount_percent: number
  description: string | null
  product?: Product | null
}

export interface DiscountDocument {
  id: number
  document_number: string
  document_date: Date | string
  start_date?: Date | string
  end_date?: Date | string
  type: 'SUPPLIER' | 'PRODUCT' | 'CUSTOMER'
  entity_id: number | null
  is_active: boolean
  notes: string | null
  created_at: Date | null
  items?: DiscountDocumentItem[]
}
