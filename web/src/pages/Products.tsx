import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import ProtectedRoute from '../components/ProtectedRoute'
import { productsAPI, productDiscountsAPI } from '../services/api'
import type { Product } from '../../../shared/types'

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Discount Modal State
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [discounts, setDiscounts] = useState<any[]>([])
  const [discountsLoading, setDiscountsLoading] = useState(false)
  const [newDiscount, setNewDiscount] = useState({
    percentage: '',
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productsAPI.getAll()
      setProducts(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Məhsullar yüklənərkən xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDiscountModal = async (product: Product) => {
    setSelectedProduct(product)
    setShowDiscountModal(true)
    // Load discounts
    try {
      setDiscountsLoading(true)
      const data = await productDiscountsAPI.getAll(product.id)
      setDiscounts(data)
    } catch (error) {
      console.error('Error loading discounts:', error)
      alert('Endirimlər yüklənərkən xəta baş verdi')
    } finally {
      setDiscountsLoading(false)
    }
    // Set default dates
    const today = new Date().toISOString().split('T')[0]
    setNewDiscount({
      percentage: '',
      start_date: today,
      end_date: today
    })
  }

  const handleAddDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    try {
      await productDiscountsAPI.create(selectedProduct.id, {
        percentage: parseFloat(newDiscount.percentage),
        start_date: new Date(newDiscount.start_date).toISOString(),
        end_date: new Date(newDiscount.end_date).toISOString()
      })

      // Reload discounts
      const data = await productDiscountsAPI.getAll(selectedProduct.id)
      setDiscounts(data)

      // Reset form
      setNewDiscount(prev => ({ ...prev, percentage: '' }))
    } catch (error) {
      console.error('Error adding discount:', error)
      alert('Endirim əlavə edilərkən xəta baş verdi')
    }
  }

  const handleDeleteDiscount = async (id: number) => {
    if (!selectedProduct || !confirm('Bu endirimi silmək istədiyinizə əminsiniz?')) return

    try {
      await productDiscountsAPI.delete(id)
      // Reload discounts
      const data = await productDiscountsAPI.getAll(selectedProduct.id)
      setDiscounts(data)
    } catch (error) {
      console.error('Error deleting discount:', error)
      alert('Endirim silinərkən xəta baş verdi')
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ marginBottom: '2rem' }}>Məhsullar</h1>

          {loading && <p>Yüklənir...</p>}
          {error && (
            <div style={{ background: '#ffebee', color: '#c62828', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {!loading && !error && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {products.length === 0 ? (
                <p>Hələ məhsul yoxdur</p>
              ) : (
                products.map((product) => {
                  const warehouse = (product as any).warehouse?.[0]
                  return (
                    <div
                      key={product.id}
                      style={{
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '1rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <h3 style={{ marginBottom: '0.5rem' }}>{product.name}</h3>
                      {product.description && (
                        <p style={{ color: '#666', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{product.description}</p>
                      )}
                      <div style={{ marginBottom: '0.5rem' }}>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>
                          {product.sale_price || 0} AZN
                        </p>
                        {product.purchase_price && (
                          <p style={{ fontSize: '0.9rem', color: '#999', textDecoration: 'line-through' }}>
                            Alış: {product.purchase_price} AZN
                          </p>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem', flex: 1 }}>
                        <p>Vahid: {product.unit || 'ədəd'}</p>
                        {product.barcode && <p>Barkod: {product.barcode}</p>}
                        {product.code && <p>Kod: {product.code}</p>}
                        {warehouse && <p>Anbar: {warehouse.quantity || 0} {product.unit || 'ədəd'}</p>}
                      </div>

                      <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                        <button
                          onClick={() => handleOpenDiscountModal(product)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            background: '#ff9800',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          🏷️ Endirimlər
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Discount Modal */}
          {showDiscountModal && selectedProduct && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
            }}>
              <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '600px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>Endirimlər: {selectedProduct.name}</h2>
                  <button onClick={() => setShowDiscountModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                {/* Add New Discount Form */}
                <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Yeni Endirim</h3>
                  <form onSubmit={handleAddDiscount} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Faiz (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={newDiscount.percentage}
                        onChange={e => setNewDiscount({ ...newDiscount, percentage: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Başlanğıc</label>
                      <input
                        type="date"
                        required
                        value={newDiscount.start_date}
                        onChange={e => setNewDiscount({ ...newDiscount, start_date: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Bitmə</label>
                      <input
                        type="date"
                        required
                        value={newDiscount.end_date}
                        onChange={e => setNewDiscount({ ...newDiscount, end_date: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                    </div>
                    <button type="submit" style={{ padding: '0.5rem 1rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Əlavə et
                    </button>
                  </form>
                </div>

                {/* Discount List */}
                {discountsLoading ? (
                  <p>Yüklənir...</p>
                ) : discounts.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666', padding: '1rem' }}>Aktiv endirim yoxdur</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#eee', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem' }}>Faiz</th>
                        <th style={{ padding: '0.5rem' }}>Başlanğıc</th>
                        <th style={{ padding: '0.5rem' }}>Bitmə</th>
                        <th style={{ padding: '0.5rem' }}>Status</th>
                        <th style={{ padding: '0.5rem' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {discounts.map(discount => {
                        const isActive = new Date(discount.end_date) >= new Date()
                        return (
                          <tr key={discount.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 'bold', color: '#d32f2f' }}>{discount.percentage}%</td>
                            <td style={{ padding: '0.5rem' }}>{new Date(discount.start_date).toLocaleDateString()}</td>
                            <td style={{ padding: '0.5rem' }}>{new Date(discount.end_date).toLocaleDateString()}</td>
                            <td style={{ padding: '0.5rem' }}>
                              {isActive ? <span style={{ color: 'green' }}>Aktiv</span> : <span style={{ color: 'gray' }}>Bitib</span>}
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                              <button
                                onClick={() => handleDeleteDiscount(discount.id)}
                                style={{ background: '#ef5350', color: 'white', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                Sil
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
