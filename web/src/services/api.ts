import axios from 'axios'
import type { LoginRequest, RegisterRequest, AuthResponse, Product, SaleInvoice, CreateOrderRequest, User, Customer, PurchaseInvoice, Supplier, WarehouseLocation, DiscountDocument, DiscountDocumentItem } from '@shared/types'

// API URL-i müəyyən et
// API URL-i müəyyən et
const getApiBaseUrl = () => {
  // 1. Environment variable (Netlify/Render üçün)
  let apiUrl = import.meta.env.VITE_API_URL

  if (apiUrl) {
    // Əgər protokol (http/https) yoxdursa, https:// əlavə et (Render 'host' property-si yalnız domain verir)
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      apiUrl = `https://${apiUrl}`
    }

    // Sondakı '/' işarəsini sil
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1)
    }

    // Əgər istifadəçi '/api' yazıbsa, onu sil ki, biz təkrar əlavə etməyək (və ya əksinə, varsa saxla)
    // Amma ən etibarlısı: həmişə təmiz domain götürüb '/api' əlavə etməkdir
    if (apiUrl.endsWith('/api')) {
      // Olduğu kimi saxla, düzgündür
    } else {
      // '/api' yoxdursa əlavə et
      apiUrl = `${apiUrl}/api`
    }

    console.log('[API] Using configured VITE_API_URL:', apiUrl)
    return apiUrl
  }

  // 2. Development: localhost check
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  if (isLocalhost) {
    console.log('[API] Using localhost fallback')
    return 'http://localhost:5000/api'
  }

  // 3. Digər hallar (Production amma env var yoxdur)
  // Render-də Frontend və Backend eyni yerdədirsə, '/api' kifayətdir (proxy ilə)
  console.log('[API] VITE_API_URL tapılmadı, relative path "/api" istifadə edilir.')
  return '/api'
}

const API_BASE_URL = getApiBaseUrl()
console.log('[API] Final API Base URL:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token əlavə etmək üçün interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data)
    return response.data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('customer')
  },
}

// Products API
export const productsAPI = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products')
    return response.data
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`)
    return response.data
  },

  create: async (data: {
    name: string
    barcode?: string
    description?: string
    unit?: string
    purchase_price?: number
    sale_price?: number
    code?: string
    warranty_period?: number
    production_date?: string
    expiry_date?: string
    is_active?: boolean
  }): Promise<Product> => {
    const response = await api.post<Product>('/products', data)
    return response.data
  },

  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    const response = await api.put<Product>(`/products/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`)
  },
}

// Categories API
export const categoriesAPI = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/categories')
    return response.data
  },

  create: async (data: { name: string; parent_id?: number }): Promise<any> => {
    const response = await api.post<any>('/categories', data)
    return response.data
  },

  update: async (id: string, data: { name: string; parent_id?: number }): Promise<any> => {
    const response = await api.put<any>(`/categories/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`)
  },

  moveProducts: async (product_ids: number[], category_id: number | null): Promise<void> => {
    await api.post('/categories/move-products', { product_ids, category_id })
  },

}

// Product Discounts API
export const productDiscountsAPI = {
  create: async (productId: number, data: { percentage: number; start_date: string; end_date: string }): Promise<any> => {
    const response = await api.post(`/products/${productId}/discounts`, data)
    return response.data
  },

  getAll: async (productId: number): Promise<any[]> => {
    const response = await api.get(`/products/${productId}/discounts`)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/discounts/${id}`)
  },
}

// Orders API (Sale Invoices)
export const ordersAPI = {
  getAll: async (): Promise<SaleInvoice[]> => {
    const response = await api.get<SaleInvoice[]>('/orders')
    return response.data
  },

  getById: async (id: string): Promise<SaleInvoice> => {
    const response = await api.get<SaleInvoice>(`/orders/${id}`)
    return response.data
  },

  create: async (data: CreateOrderRequest): Promise<SaleInvoice> => {
    const response = await api.post<SaleInvoice>('/orders', data)
    return response.data
  },

  update: async (id: string, data: { customer_id?: number; items?: any[]; notes?: string; payment_date?: string; invoice_number?: string; invoice_date?: string }): Promise<SaleInvoice> => {
    const response = await api.put<SaleInvoice>(`/orders/${id}`, data)
    return response.data
  },

  updateStatus: async (id: string, is_active: boolean): Promise<SaleInvoice> => {
    const response = await api.patch<SaleInvoice>(`/orders/${id}/status`, { is_active })
    return response.data
  },
}

// Purchase Invoices API
export const purchaseInvoicesAPI = {
  getAll: async (): Promise<PurchaseInvoice[]> => {
    const response = await api.get<PurchaseInvoice[]>('/purchase-invoices')
    return response.data
  },

  getById: async (id: string): Promise<PurchaseInvoice> => {
    const response = await api.get<PurchaseInvoice>(`/purchase-invoices/${id}`)
    return response.data
  },

  create: async (data: {
    supplier_id?: number
    items: {
      product_id: number
      quantity: number
      unit_price: number
      total_price: number
    }[]
    notes?: string
    invoice_date?: string
    payment_date?: string
  }): Promise<PurchaseInvoice> => {
    console.log('[API] purchaseInvoicesAPI.create çağırıldı')
    console.log('[API] Request URL:', '/purchase-invoices')
    console.log('[API] Request method: POST')
    console.log('[API] Request data:', data)
    try {
      const response = await api.post<PurchaseInvoice>('/purchase-invoices', data)
      console.log('[API] purchaseInvoicesAPI.create cavabı:', response.data)
      console.log('[API] Response status:', response.status)
      return response.data
    } catch (error: any) {
      console.error('[API] purchaseInvoicesAPI.create xətası:', error)
      console.error('[API] Error response:', error.response)
      console.error('[API] Error response data:', error.response?.data)
      throw error
    }
  },

  update: async (id: string, data: { supplier_id?: number; items?: any[]; notes?: string; is_active?: boolean; invoice_date?: string; payment_date?: string }): Promise<PurchaseInvoice> => {
    console.log('[API] purchaseInvoicesAPI.update çağırıldı')
    console.log('[API] Request URL:', `/purchase-invoices/${id}`)
    console.log('[API] Request method: PATCH')
    console.log('[API] Request data:', data)
    try {
      const response = await api.patch<PurchaseInvoice>(`/purchase-invoices/${id}`, data)
      console.log('[API] purchaseInvoicesAPI.update cavabı:', response.data)
      console.log('[API] Response status:', response.status)
      return response.data
    } catch (error: any) {
      console.error('[API] purchaseInvoicesAPI.update xətası:', error)
      console.error('[API] Error response:', error.response)
      console.error('[API] Error response data:', error.response?.data)
      throw error
    }
  },

  updateStatus: async (id: string, is_active: boolean): Promise<PurchaseInvoice> => {
    console.log('[API] purchaseInvoicesAPI.updateStatus çağırıldı')
    console.log('[API] Request URL:', `/purchase-invoices/${id}/status`)
    console.log('[API] Request method: PATCH')
    console.log('[API] Request data:', { is_active })
    try {
      const response = await api.patch<PurchaseInvoice>(`/purchase-invoices/${id}/status`, { is_active })
      console.log('[API] purchaseInvoicesAPI.updateStatus cavabı:', response.data)
      console.log('[API] Response status:', response.status)
      return response.data
    } catch (error: any) {
      console.error('[API] purchaseInvoicesAPI.updateStatus xətası:', error)
      console.error('[API] Error response:', error.response)
      console.error('[API] Error response data:', error.response?.data)
      throw error
    }
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/purchase-invoices/${id}`)
  },
}

// Customers API
export const customersAPI = {
  getAll: async (): Promise<Customer[]> => {
    const response = await api.get<Customer[]>('/customers')
    return response.data
  },

  create: async (data: Partial<Customer>): Promise<Customer> => {
    const response = await api.post<Customer>('/customers', data)
    return response.data
  },

  update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const response = await api.put<Customer>(`/customers/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`)
  },
}

// Customer Folders API
export const customerFoldersAPI = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/customer-folders')
    return response.data
  },

  create: async (data: { name: string; parent_id?: number | null }): Promise<any> => {
    const response = await api.post<any>('/customer-folders', data)
    return response.data
  },

  update: async (id: string, data: { name: string; parent_id?: number | null }): Promise<any> => {
    const response = await api.put<any>(`/customer-folders/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/customer-folders/${id}`)
  },
}

// Suppliers API
export const suppliersAPI = {
  getAll: async (): Promise<Supplier[]> => {
    const response = await api.get<Supplier[]>('/suppliers')
    return response.data
  },
}

// User API
export const userAPI = {
  getProfile: async (): Promise<{ user: User; customer: Customer | null }> => {
    const response = await api.get<{ user: User; customer: Customer | null }>('/users/profile')
    return response.data
  },

  updateProfile: async (data: { name?: string; phone?: string; address?: string }): Promise<{ user: User; customer: Customer }> => {
    const response = await api.put<{ user: User; customer: Customer }>('/users/profile', data)
    return response.data
  },
}

// Warehouses API
export const warehousesAPI = {
  getAll: async (): Promise<WarehouseLocation[]> => {
    const response = await api.get<WarehouseLocation[]>('/warehouses')
    return response.data
  },
}

export default api

// Discount Documents API
export const discountDocumentsAPI = {
  getAll: async (params?: { type?: string; entity_id?: number; active_only?: boolean }): Promise<DiscountDocument[]> => {
    const response = await api.get<DiscountDocument[]>('/documents/discounts', { params })
    return response.data
  },

  getById: async (id: number | string): Promise<DiscountDocument> => {
    const response = await api.get<DiscountDocument>(`/documents/discounts/${id}`)
    return response.data
  },

  create: async (data: Partial<DiscountDocument> & { items: Partial<DiscountDocumentItem>[] }): Promise<DiscountDocument> => {
    const response = await api.post<DiscountDocument>('/documents/discounts', data)
    return response.data
  },

  getActive: async (type: 'SUPPLIER' | 'PRODUCT', entityId: number): Promise<DiscountDocument | null> => {
    const response = await api.get<DiscountDocument[]>('/documents/discounts', {
      params: { type, entity_id: entityId, active_only: true }
    })

    // Server returns sorted by date desc. We need the first one that is currently valid time-wise.
    const now = new Date()
    const validDoc = response.data.find(doc => {
      const s = doc.start_date ? new Date(doc.start_date) : null
      const e = doc.end_date ? new Date(doc.end_date) : null

      if (s && now < s) return false // Too early
      if (e && now > e) return false // Expired
      return true
    })

    return validDoc || null
  },

  getAllActive: async (type: 'SUPPLIER' | 'PRODUCT', entityId?: number | null): Promise<DiscountDocument[]> => {
    const params: any = { type, active_only: true }
    if (entityId) params.entity_id = entityId

    const response = await api.get<DiscountDocument[]>('/documents/discounts', { params })
    return response.data
  },

  update: async (id: number | string, data: Partial<DiscountDocument> & { items: Partial<DiscountDocumentItem>[] }): Promise<DiscountDocument> => {
    const response = await api.put<DiscountDocument>(`/documents/discounts/${id}`, data)
    return response.data
  },

  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/documents/discounts/${id}`)
  }
}
