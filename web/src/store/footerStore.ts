import { create } from 'zustand'

interface FooterState {
    totalRecords: number | undefined
    selectedCount: number | undefined
    customContent: React.ReactNode | null
    isVisible: boolean

    // Actions
    setFooterData: (data: { totalRecords?: number; selectedCount?: number; customContent?: React.ReactNode; isVisible?: boolean }) => void
    clearFooterData: () => void
    showFooter: () => void
    hideFooter: () => void
}

export const useFooterStore = create<FooterState>((set) => ({
    totalRecords: undefined,
    selectedCount: undefined,
    customContent: null,
    isVisible: true,

    setFooterData: (data) => set((state) => ({
        ...state,
        ...data
    })),

    clearFooterData: () => set({
        totalRecords: undefined,
        selectedCount: undefined,
        customContent: null
    }),

    showFooter: () => set({ isVisible: true }),
    hideFooter: () => set({ isVisible: false })
}))
