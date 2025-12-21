import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useAuthStore } from '../store/authStore'
import { useWindowStore } from '../store/windowStore'
import { ordersAPI } from '../services/api'
import type { SaleInvoice } from '../../../shared/types'
import { calculateDaysDifference } from '../utils/dateUtils'

// Import page components
import { AlisQaimeleriContent } from './Qaimeler/Alis'
import { SatisQaimeleriContent } from './Qaimeler/Satis'
import Hesablar from './Hesablar'
import Mehsullar from './Mehsullar'
import PartnerManager from '../components/PartnerManager'
import KassaMedaxil from './Kassa/Medaxil'
import KassaMexaric from './Kassa/Mexaric'
import { SupplierDiscountDocuments, ProductDiscountDocuments } from './Discounts/DiscountDocuments'
import Admin from './Admin'

interface QuickAccessCardProps {
  title: string
  icon: string
  color: string
  gradient: string
  onClick: () => void
}

function QuickAccessCard({ title, icon, color, gradient, onClick }: QuickAccessCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: gradient,
        borderRadius: '12px',
        padding: '2rem 1.5rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        minHeight: '160px',
        justifyContent: 'center',
        border: `2px solid ${color}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)'
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ fontSize: '3rem' }}>{icon}</div>
      <h3 style={{
        margin: 0,
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        {title}
      </h3>
    </div>
  )
}

export default function Home() {
  const { isAuthenticated, user } = useAuthStore()
  const { openPageWindow } = useWindowStore()
  const [overdueInvoices, setOverdueInvoices] = useState<SaleInvoice[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadOverdueInvoices()
    }
  }, [isAuthenticated])

  const loadOverdueInvoices = async () => {
    try {
      setLoading(true)
      const invoices = await ordersAPI.getAll()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const overdue = invoices.filter(invoice => {
        if (!invoice.payment_date) return false
        const paymentDate = new Date(invoice.payment_date)
        paymentDate.setHours(0, 0, 0, 0)
        return calculateDaysDifference(today, paymentDate) < 0
      })

      setOverdueInvoices(overdue)
    } catch (err) {
      console.error('Müddəti bitmiş ödənişlər yüklənərkən xəta:', err)
    } finally {
      setLoading(false)
    }
  }

  const quickAccessItems = [
    {
      title: 'Satış Qaiməsi',
      icon: '📄',
      color: '#4CAF50',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
      onClick: () => openPageWindow('qaimeler-satis', 'Satış Qaimələri', '📄', <SatisQaimeleriContent />)
    },
    {
      title: 'Alış Qaiməsi',
      icon: '📋',
      color: '#2196F3',
      gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
      onClick: () => openPageWindow('qaimeler-alis', 'Alış Qaimələri', '📋', <AlisQaimeleriContent />)
    },
    {
      title: 'Məhsullar',
      icon: '📦',
      color: '#FF9800',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
      onClick: () => openPageWindow('anbar', 'Məhsullar', '📦', <Mehsullar />)
    },
    {
      title: 'Tərəfdaşlar',
      icon: '👥',
      color: '#9C27B0',
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
      onClick: () => openPageWindow('partners', 'Tərəfdaşlar', '👥', <PartnerManager filterType="ALL" />, { width: 1200, height: 800 })
    },
    {
      title: 'Hesablar',
      icon: '💰',
      color: '#FFC107',
      gradient: 'linear-gradient(135deg, #FFC107 0%, #FFA000 100%)',
      onClick: () => openPageWindow('hesablar', 'Hesablar', '💰', <Hesablar />)
    },
    {
      title: 'Kassa Mədaxil',
      icon: '💵',
      color: '#00BCD4',
      gradient: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
      onClick: () => openPageWindow('kassa-medaxil', 'Kassa Mədaxil', '💵', <KassaMedaxil />)
    },
    {
      title: 'Kassa Məxaric',
      icon: '💸',
      color: '#F44336',
      gradient: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)',
      onClick: () => openPageWindow('kassa-mexaric', 'Kassa Məxaric', '💸', <KassaMexaric />)
    },
    {
      title: 'Təchizatçı Faizləri',
      icon: '📉',
      color: '#607D8B',
      gradient: 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)',
      onClick: () => openPageWindow('discount-supplier', 'Təchizatçı Faizləri', '📉', <SupplierDiscountDocuments />)
    },
    {
      title: 'Məhsul Faizləri',
      icon: '🏷️',
      color: '#795548',
      gradient: 'linear-gradient(135deg, #795548 0%, #5D4037 100%)',
      onClick: () => openPageWindow('discount-product', 'Məhsul Faizləri', '🏷️', <ProductDiscountDocuments />)
    },
  ]

  // Add Admin card only for admin users
  if (user?.is_admin) {
    quickAccessItems.push({
      title: 'Admin Panel',
      icon: '⚙️',
      color: '#673AB7',
      gradient: 'linear-gradient(135deg, #673AB7 0%, #512DA8 100%)',
      onClick: () => openPageWindow('admin', 'Admin Panel', '⚙️', <Admin />)
    })
  }

  return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700'
          }}>
            🏢 MobilSayt Dashboard
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#666', margin: 0 }}>
            Sürətli keçidlər və əməliyyat idarəsi
          </p>
        </div>

        {/* Quick Access Grid */}
        {isAuthenticated && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            {quickAccessItems.map((item, index) => (
              <QuickAccessCard
                key={index}
                title={item.title}
                icon={item.icon}
                color={item.color}
                gradient={item.gradient}
                onClick={item.onClick}
              />
            ))}
          </div>
        )}

        {/* Overdue Invoices Section */}
        {isAuthenticated && (
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              marginBottom: '1rem',
              color: '#dc3545',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              ⚠️ Müddəti bitmiş ödənişlər
            </h2>
            {loading ? (
              <p>Yüklənir...</p>
            ) : overdueInvoices.length === 0 ? (
              <div style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
                borderRadius: '12px',
                color: '#155724',
                textAlign: 'center',
                fontSize: '1.1rem',
                fontWeight: '500',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                ✅ Müddəti bitmiş ödəniş yoxdur
              </div>
            ) : (
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '2px solid #ffc107'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #ffc107 0%, #ffb300 100%)', color: '#fff' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', borderRadius: '8px 0 0 0' }}>Faktura №</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Müştəri</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Məbləğ</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Son ödəniş tarixi</th>
                      <th style={{ padding: '1rem', textAlign: 'center', borderRadius: '0 8px 0 0' }}>Keçib</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueInvoices.map((invoice, idx) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const paymentDate = invoice.payment_date ? new Date(invoice.payment_date) : null
                      let daysOverdue = 0
                      if (paymentDate) {
                        paymentDate.setHours(0, 0, 0, 0)
                        daysOverdue = Math.abs(calculateDaysDifference(today, paymentDate))
                      }

                      return (
                        <tr key={invoice.id} style={{
                          background: idx % 2 === 0 ? '#f8f9fa' : '#fff',
                          transition: 'background 0.2s'
                        }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fff3cd'}
                          onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#f8f9fa' : '#fff'}
                        >
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #dee2e6' }}>{invoice.invoice_number}</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #dee2e6' }}>{invoice.customers?.name || '-'}</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>
                            {invoice.total_amount ? Number(invoice.total_amount).toFixed(2) : '0.00'} ₼
                          </td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                            {paymentDate ? paymentDate.toLocaleDateString('az-AZ') : '-'}
                          </td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #dee2e6', textAlign: 'center', color: '#dc3545', fontWeight: 'bold' }}>
                            {daysOverdue} gün
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'linear-gradient(135deg, #ffc107 0%, #ffb300 100%)', fontWeight: 'bold', color: '#fff' }}>
                      <td colSpan={2} style={{ padding: '1rem', textAlign: 'right', borderRadius: '0 0 0 8px' }}>Cəmi:</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {overdueInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0).toFixed(2)} ₼
                      </td>
                      <td colSpan={2} style={{ padding: '1rem', borderRadius: '0 0 8px 0' }}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Login prompt for unauthenticated users */}
        {!isAuthenticated && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            color: '#fff'
          }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Xoş gəlmisiniz!</h2>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
              Davam etmək üçün zəhmət olmasa giriş edin
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
