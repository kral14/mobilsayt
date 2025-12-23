import React from 'react'
import { TabConfig, WidgetConfig } from '../../store/dashboardStore'
import { useDashboardStore } from '../../store/dashboardStore'
import { QuickAccessWidget } from './QuickAccessWidget'
import { OverdueInvoicesWidget } from './OverdueInvoicesWidget'
import { useWindowStore } from '../../store/windowStore'

// Import page components for quick access
import { AlisQaimeleriContent } from '../../pages/Qaimeler/Alis'
import { SatisQaimeleriContent } from '../../pages/Qaimeler/Satis'
import Hesablar from '../../pages/Hesablar'
import Products2 from '../../pages/Products2'
import PartnerManager from '../../components/PartnerManager'
import KassaMedaxil from '../../pages/Kassa/Medaxil'
import KassaMexaric from '../../pages/Kassa/Mexaric'
import { SupplierDiscountDocuments, ProductDiscountDocuments } from '../../pages/Discounts/DiscountDocuments'
import Admin from '../../pages/Admin'

interface DashboardRendererProps {
    tab: TabConfig
    isEditMode: boolean
}

export const DashboardRenderer: React.FC<DashboardRendererProps> = ({ tab, isEditMode }) => {
    const { openPageWindow } = useWindowStore()
    const { removeWidget } = useDashboardStore()

    const handleWidgetClick = (widget: WidgetConfig) => {
        if (widget.type === 'quick_access' && widget.pageId) {
            switch (widget.pageId) {
                case 'qaimeler-satis':
                    openPageWindow('qaimeler-satis', 'Satış Qaimələri', '📄', <SatisQaimeleriContent />)
                    break
                case 'qaimeler-alis':
                    openPageWindow('qaimeler-alis', 'Alış Qaimələri', '📋', <AlisQaimeleriContent />)
                    break
                case 'anbar':
                    openPageWindow('anbar', 'Məhsullar', '📦', <Products2 />)
                    break
                case 'partners':
                    openPageWindow('partners', 'Tərəfdaşlar', '👥', <PartnerManager filterType="ALL" />, { width: 1200, height: 800 })
                    break
                case 'hesablar':
                    openPageWindow('hesablar', 'Hesablar', '💰', <Hesablar />)
                    break
                case 'kassa-medaxil':
                    openPageWindow('kassa-medaxil', 'Kassa Mədaxil', '💵', <KassaMedaxil />)
                    break
                case 'kassa-mexaric':
                    openPageWindow('kassa-mexaric', 'Kassa Məxaric', '💸', <KassaMexaric />)
                    break
                case 'discount-supplier':
                    openPageWindow('discount-supplier', 'Təchizatçı Faizləri', '📉', <SupplierDiscountDocuments />)
                    break
                case 'discount-product':
                    openPageWindow('discount-product', 'Məhsul Faizləri', '🏷️', <ProductDiscountDocuments />)
                    break
                case 'admin':
                    openPageWindow('admin', 'Admin Panel', '⚙️', <Admin />)
                    break
            }
        }
    }

    const renderWidget = (widget: WidgetConfig) => {
        switch (widget.type) {
            case 'quick_access':
                return (
                    <QuickAccessWidget
                        title={widget.title}
                        icon={widget.icon}
                        color={widget.color}
                        gradient={widget.gradient}
                        isEditMode={isEditMode}
                        onClick={() => handleWidgetClick(widget)}
                    />
                )
            case 'overdue_invoices':
                return <OverdueInvoicesWidget isEditMode={isEditMode} />
            default:
                return <div>Unknown Widget Type</div>
        }
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${tab.gridSettings.columns}, 1fr)`,
            gap: `${tab.gridSettings.gap || 20}px`,
            minHeight: '200px'
        }}>
            {tab.widgets.map((widget) => (
                <div
                    key={widget.id}
                    style={{
                        gridColumn: `span ${widget.position.w}`,
                        gridRow: `span ${widget.position.h}`,
                        position: 'relative'
                    }}
                >
                    {renderWidget(widget)}

                    {isEditMode && (
                        <div
                            onClick={(e) => { e.stopPropagation(); removeWidget(tab.id, widget.id); }}
                            style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '-10px',
                                background: '#ff4444',
                                color: 'white',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 10,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                            title="SİL"
                        >
                            ×
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
