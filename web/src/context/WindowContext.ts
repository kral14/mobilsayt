import { createContext, useContext } from 'react'

interface WindowContextType {
    windowId: string
    isActive: boolean
    close: () => void
    maximize: () => void
    minimize: () => void
}

const WindowContext = createContext<WindowContextType | undefined>(undefined)

export function useWindow() {
    const context = useContext(WindowContext)
    if (!context) {
        throw new Error('useWindow must be used within a WindowProvider (UniversalWindow)')
    }
    return context
}

export default WindowContext
