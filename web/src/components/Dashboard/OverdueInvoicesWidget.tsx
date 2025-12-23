import { useState, useEffect } from 'react'
import { ordersAPI } from '../../services/api'
import type { SaleInvoice } from '../../../../shared/types'
import { calculateDaysDifference } from '../../utils/dateUtils'

interface OverdueInvoicesWidgetProps {
    isEditMode?: boolean
}

export const OverdueInvoicesWidget: React.FC<OverdueInvoicesWidgetProps> = ({ isEditMode }) => {
    const [overdueInvoices, setOverdueInvoices] = useState<SaleInvoice[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadOverdueInvoices()
    }, [])

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

    return (
        <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '2px solid #ffc107',
            height: '100%',
            overflow: 'auto',
            pointerEvents: isEditMode ? 'none' : 'auto'
        }}>
            <h2 style={{
                fontSize: '1.2rem',
                marginBottom: '1rem',
                color: '#dc3545',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: 0
            }}>
                ⚠️ Müddəti bitmiş ödənişlər
            </h2>

            {loading ? (
                <p>Yüklənir...</p>
            ) : overdueInvoices.length === 0 ? (
                <div style={{
                    padding: '1rem',
                    background: '#d4edda',
                    borderRadius: '8px',
                    color: '#155724',
                    textAlign: 'center'
                }}>
                    ✅ Müddəti bitmiş ödəniş yoxdur
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#ffc107', color: '#fff' }}>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Faktura №</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Müştəri</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Məbləğ</th>
                                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Gecikmə</th>
                            </tr>
                        </thead>
                        <tbody>
                            {overdueInvoices.slice(0, 5).map((invoice) => {
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                const paymentDate = invoice.payment_date ? new Date(invoice.payment_date) : null
                                let daysOverdue = 0
                                if (paymentDate) {
                                    paymentDate.setHours(0, 0, 0, 0)
                                    daysOverdue = Math.abs(calculateDaysDifference(today, paymentDate))
                                }

                                return (
                                    <tr key={invoice.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.5rem' }}>{invoice.invoice_number}</td>
                                        <td style={{ padding: '0.5rem' }}>{invoice.customers?.name || '-'}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                                            {Number(invoice.total_amount || 0).toFixed(2)} ₼
                                        </td>
                                        <td style={{ padding: '0.5rem', textAlign: 'center', color: '#dc3545' }}>
                                            {daysOverdue} gün
                                        </td>
                                    </tr>
                                )
                            })}
                            {overdueInvoices.length > 5 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '0.5rem', color: '#666' }}>
                                        Və daha {overdueInvoices.length - 5} faktura...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
