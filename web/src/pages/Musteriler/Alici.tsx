
import { useState, useEffect, useCallback, useMemo } from 'react'
import Layout from '../../components/Layout'
import DataTable, { ColumnConfig } from '../../components/DataTable'
import { customersAPI } from '../../services/api'
import type { Customer } from '../../../../shared/types'

export default function Alicilar() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<Partial<Customer>>({})

  // Fetch customers
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await customersAPI.getAll()
      setCustomers(data)
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  // Columns configuration
  const columns = useMemo<ColumnConfig[]>(() => [
    { id: 'code', label: 'Kod', visible: true, width: 100, order: 1 },
    { id: 'name', label: 'Ad', visible: true, width: 200, order: 2 },
    { id: 'phone', label: 'Telefon', visible: true, width: 150, order: 3 },
    { id: 'email', label: 'Email', visible: true, width: 200, order: 4 },
    {
      id: 'permanent_discount',
      label: 'Daimi Endirim %',
      visible: true,
      width: 120,
      order: 5,
      align: 'center',
      render: (value: any) => <span style={{ fontWeight: 'bold', color: '#1976d2' }}>{value || 0}%</span>
    },
    { id: 'balance', label: 'Balans', visible: true, width: 120, order: 6, align: 'right' },
    {
      id: 'is_active',
      label: 'Status',
      visible: true,
      width: 80,
      order: 7,
      align: 'center',
      render: (value: any) => value ? '✅' : '❌'
    }
  ], [])

  const handleEdit = useCallback((customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({ ...customer })
    setShowModal(true)
  }, [])

  const handleDelete = useCallback(async (ids: (number | string)[]) => {
    if (confirm(`${ids.length} müştərini silmək istədiyinizə əminsiniz?`)) {
      try {
        await Promise.all(ids.map(id => customersAPI.delete(id.toString())))
        loadCustomers()
      } catch (error) {
        console.error('Error deleting:', error)
        alert('Silinərkən xəta baş verdi')
      }
    }
  }, [loadCustomers])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id.toString(), formData)
      } else {
        await customersAPI.create(formData)
      }
      setShowModal(false)
      loadCustomers()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Yadda saxlanılarkən xəta baş verdi')
    }
  }

  const openNewModal = () => {
    setEditingCustomer(null)
    setFormData({ name: '', permanent_discount: 0, is_active: true })
    setShowModal(true)
  }

  const contextMenuActions = useMemo(() => ({
    customItems: [
      { label: 'Redaktə et', onClick: () => console.log('Edit from context menu needed') }
    ]
  }), [])

  const toolbarActions = useMemo(() => ({
    onEdit: (ids: (number | string)[]) => {
      const customer = customers.find(c => c.id === ids[0])
      if (customer) handleEdit(customer)
    },
    onDelete: (ids: (number | string)[]) => handleDelete(ids)
  }), [customers, handleEdit, handleDelete])

  return (
    <Layout>
      <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h1>Alıcılar</h1>
          <button
            onClick={openNewModal}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            + Yeni Müştəri
          </button>
        </div>

        <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <DataTable
            data={customers}
            columns={columns}
            loading={loading}
            pageId="customers-list"
            title="Müştərilər"
            getRowId={(row: Customer) => row.id}
            contextMenuActions={contextMenuActions}
            toolbarActions={toolbarActions}
            defaultColumns={columns}
          />
        </div>

        {/* Edit Modal */}
        {showModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
          }}>
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '500px', maxWidth: '90%' }}>
              <h2>{editingCustomer ? 'Müştərini Redaktə Et' : 'Yeni Müştəri'}</h2>
              <form onSubmit={handleSave}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Ad *</label>
                  <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Kod (Avtomatik)</label>
                  <input
                    type="text"
                    placeholder="Boş buraxın avtomatik yaradılacaq"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Telefon</label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                    <input
                      type="email"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Ünvan</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                    value={formData.address || ''}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1565c0' }}>Daimi Endirim %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #90caf9', borderRadius: '4px' }}
                      value={formData.permanent_discount || 0}
                      onChange={e => setFormData({ ...formData, permanent_discount: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Balans</label>
                    <input
                      type="number"
                      step="0.01"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                      value={formData.balance || 0}
                      onChange={e => setFormData({ ...formData, balance: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ padding: '0.5rem 1rem', border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Ləğv et
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '0.5rem 1rem', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Yadda saxla
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
