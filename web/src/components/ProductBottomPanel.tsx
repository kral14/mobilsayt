
import { Product } from '../../../shared/types'

interface ProductBottomPanelProps {
    product: Product | null | undefined
    height?: number
}

export default function ProductBottomPanel({ product, height = 180 }: ProductBottomPanelProps) {
    if (!product) {
        return (
            <div style={{ height: `${height}px`, borderTop: '1px solid #ddd', padding: '1rem', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                Məhsul seçilməyib
            </div>
        )
    }

    const warehouse = (product as any).warehouse?.[0]
    const quantity = warehouse?.quantity || product.stock_quantity || 0

    return (
        <div style={{ height: `${height}px`, borderTop: '5px solid #e0e0e0', display: 'flex', background: 'white', position: 'relative' }}>
            {/* Price Config (Left) */}
            <div style={{ flex: 1, borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '0.5rem', background: '#f8f9fa', borderBottom: '1px solid #ddd', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    Qiymət Növləri
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#fff', borderBottom: '1px solid #eee' }}>
                                <th style={{ padding: '4px 8px', textAlign: 'left', color: '#666', fontWeight: '500' }}>Növ</th>
                                <th style={{ padding: '4px 8px', textAlign: 'left', color: '#666', fontWeight: '500' }}>Valyuta</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right', color: '#666', fontWeight: '500' }}>Qiymət</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>Alış Qiyməti</td>
                                <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>AZN</td>
                                <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                                    {Number(product.purchase_price || 0).toFixed(2)}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>Satış Qiyməti</td>
                                <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>AZN</td>
                                <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 'bold', color: '#1976d2' }}>
                                    {Number(product.sale_price || 0).toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Warehouse Stocks (Right) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '0.5rem', background: '#f8f9fa', borderBottom: '1px solid #ddd', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    Anbar Qalıqları
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#fff', borderBottom: '1px solid #eee' }}>
                                <th style={{ padding: '4px 8px', textAlign: 'left', color: '#666', fontWeight: '500' }}>Anbar</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right', color: '#666', fontWeight: '500' }}>Ümumi</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right', color: '#666', fontWeight: '500' }}>Sərbəst</th>
                                <th style={{ padding: '4px 8px', textAlign: 'right', color: '#666', fontWeight: '500' }}>Rezerv</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>Əsas Anbar</td>
                                <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 'bold' }}>
                                    {quantity} {product.unit || 'ədəd'}
                                </td>
                                <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                                    {quantity} {product.unit || 'ədəd'}
                                </td>
                                <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                                    0 {product.unit || 'ədəd'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
