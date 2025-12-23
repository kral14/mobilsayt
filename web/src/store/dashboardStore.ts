import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WidgetConfig {
    id: string
    type: 'quick_access' | 'overdue_invoices' | 'stat_card'
    title: string
    icon: string
    color?: string
    gradient?: string
    pageId?: string
    componentProps?: any
    position: { x: number; y: number; w: number; h: number }
}

export interface TabConfig {
    id: string
    title: string
    gridSettings: {
        columns: number
        rows?: number
        gap?: number
    }
    widgets: WidgetConfig[]
}

interface DashboardState {
    tabs: TabConfig[]
    activeTabId: string
    isEditMode: boolean

    // Actions
    setActiveTab: (id: string) => void
    toggleEditMode: () => void
    addTab: (title: string) => void
    removeTab: (id: string) => void
    updateTab: (id: string, updates: Partial<TabConfig>) => void
    addWidget: (tabId: string, widget: Omit<WidgetConfig, 'id'>) => void
    removeWidget: (tabId: string, widgetId: string) => void
    updateWidget: (tabId: string, widgetId: string, updates: Partial<WidgetConfig>) => void
    reorderWidgets: (tabId: string, widgets: WidgetConfig[]) => void
}

const DEFAULT_TABS: TabConfig[] = [
    {
        id: 'main-tab',
        title: 'Əsas',
        gridSettings: { columns: 4, gap: 20 },
        widgets: [
            {
                id: 'w1',
                type: 'quick_access',
                title: 'Satış Qaiməsi',
                icon: '📄',
                color: '#4CAF50',
                gradient: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                pageId: 'qaimeler-satis',
                position: { x: 0, y: 0, w: 1, h: 1 }
            },
            {
                id: 'w2',
                type: 'quick_access',
                title: 'Alış Qaiməsi',
                icon: '📋',
                color: '#2196F3',
                gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                pageId: 'qaimeler-alis',
                position: { x: 1, y: 0, w: 1, h: 1 }
            },
            {
                id: 'w3',
                type: 'quick_access',
                title: 'Məhsullar',
                icon: '📦',
                color: '#FF9800',
                gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                pageId: 'anbar',
                position: { x: 2, y: 0, w: 1, h: 1 }
            },
            {
                id: 'w4',
                type: 'quick_access',
                title: 'Tərəfdaşlar',
                icon: '👥',
                color: '#9C27B0',
                gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                pageId: 'partners',
                position: { x: 3, y: 0, w: 1, h: 1 }
            },
            {
                id: 'w_overdue',
                type: 'overdue_invoices',
                title: '⚠️ Müddəti bitmiş ödənişlər',
                icon: '⚠️',
                position: { x: 0, y: 1, w: 4, h: 2 }
            }
        ]
    }
]

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set) => ({
            tabs: DEFAULT_TABS,
            activeTabId: 'main-tab',
            isEditMode: false,

            setActiveTab: (id) => set({ activeTabId: id }),
            toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),

            addTab: (title) => {
                const id = `tab-${Date.now()}`
                const newTab: TabConfig = {
                    id,
                    title,
                    gridSettings: { columns: 4, gap: 20 },
                    widgets: []
                }
                set((state) => ({
                    tabs: [...state.tabs, newTab],
                    activeTabId: id
                }))
            },

            removeTab: (id) => set((state) => {
                const newTabs = state.tabs.filter(t => t.id !== id)
                const newActiveId = state.activeTabId === id
                    ? (newTabs[0]?.id || '')
                    : state.activeTabId
                return { tabs: newTabs, activeTabId: newActiveId }
            }),

            updateTab: (id, updates) => set((state) => ({
                tabs: state.tabs.map(t => t.id === id ? { ...t, ...updates } : t)
            })),

            addWidget: (tabId, widget) => set((state) => ({
                tabs: state.tabs.map(t => t.id === tabId ? {
                    ...t,
                    widgets: [...t.widgets, { ...widget, id: `w-${Date.now()}` }]
                } : t)
            })),

            removeWidget: (tabId, widgetId) => set((state) => ({
                tabs: state.tabs.map(t => t.id === tabId ? {
                    ...t,
                    widgets: t.widgets.filter(w => w.id !== widgetId)
                } : t)
            })),

            updateWidget: (tabId, widgetId, updates) => set((state) => ({
                tabs: state.tabs.map(t => t.id === tabId ? {
                    ...t,
                    widgets: t.widgets.map(w => w.id === widgetId ? { ...w, ...updates } : w)
                } : t)
            })),

            reorderWidgets: (tabId, widgets) => set((state) => ({
                tabs: state.tabs.map(t => t.id === tabId ? { ...t, widgets } : t)
            }))
        }),
        {
            name: 'dashboard-storage'
        }
    )
)
