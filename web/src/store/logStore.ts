import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LogLevel = 'info' | 'warning' | 'error' | 'success'
export type LogCategory = 'window' | 'invoice' | 'user' | 'system' | 'data'

export interface ActivityLog {
    id: string
    timestamp: Date
    level: LogLevel
    category: LogCategory
    action: string
    details: string
    user?: string
    metadata?: Record<string, any>
    synced?: boolean // Track if log has been sent to server
    syncAttempts?: number // Number of sync attempts
}

interface LogStore {
    logs: ActivityLog[]
    maxLogs: number
    isSyncing: boolean
    lastSyncTime: Date | null
    addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void
    clearLogs: () => void
    getLogsByCategory: (category: LogCategory) => ActivityLog[]
    getLogsByLevel: (level: LogLevel) => ActivityLog[]
    searchLogs: (query: string) => ActivityLog[]
    getUnsyncedLogs: () => ActivityLog[]
    markLogsAsSynced: (logIds: string[]) => void
    incrementSyncAttempts: (logIds: string[]) => void
    setSyncing: (syncing: boolean) => void
}

export const useLogStore = create<LogStore>()(
    persist(
        (set, get) => ({
            logs: [],
            maxLogs: 2000, // Keep last 2000 logs in memory
            isSyncing: false,
            lastSyncTime: null,

            addLog: (log) => {
                const newLog: ActivityLog = {
                    ...log,
                    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date()
                }

                set((state) => {
                    const newLogs = [newLog, ...state.logs]
                    // Keep only maxLogs entries
                    if (newLogs.length > state.maxLogs) {
                        newLogs.splice(state.maxLogs)
                    }
                    return { logs: newLogs }
                })

                // Also log to console in development
                if (import.meta.env.DEV) {
                    const emoji = {
                        info: 'ℹ️',
                        warning: '⚠️',
                        error: '❌',
                        success: '✅'
                    }[log.level]

                    const categoryEmoji = {
                        window: '🪟',
                        invoice: '📋',
                        user: '👤',
                        system: '⚙️',
                        data: '💾'
                    }[log.category]

                    console.log(
                        `[ACTIVITY_LOG] ${emoji} ${categoryEmoji} ${log.action}`,
                        {
                            details: log.details,
                            metadata: log.metadata,
                            user: log.user
                        }
                    )
                }
            },

            clearLogs: () => set({ logs: [] }),

            getLogsByCategory: (category) => {
                return get().logs.filter(log => log.category === category)
            },

            getLogsByLevel: (level) => {
                return get().logs.filter(log => log.level === level)
            },

            searchLogs: (query) => {
                const lowerQuery = query.toLowerCase()
                return get().logs.filter(log =>
                    log.action.toLowerCase().includes(lowerQuery) ||
                    log.details.toLowerCase().includes(lowerQuery) ||
                    log.user?.toLowerCase().includes(lowerQuery)
                )
            },

            getUnsyncedLogs: () => {
                return get().logs.filter(log => !log.synced)
            },

            markLogsAsSynced: (logIds) => {
                set((state) => ({
                    logs: state.logs.map(log =>
                        logIds.includes(log.id) ? { ...log, synced: true } : log
                    ),
                    lastSyncTime: new Date()
                }))
            },

            incrementSyncAttempts: (logIds) => {
                set((state) => ({
                    logs: state.logs.map(log =>
                        logIds.includes(log.id)
                            ? { ...log, syncAttempts: (log.syncAttempts || 0) + 1 }
                            : log
                    )
                }))
            },

            setSyncing: (syncing) => {
                set({ isSyncing: syncing })
            }
        }),
        {
            name: 'activity-logs',
            partialize: (state) => ({ logs: state.logs.slice(0, 500) }) // Persist last 500 logs
        }
    )
)

// Helper function to add logs from anywhere in the app
export const logActivity = (
    category: LogCategory,
    action: string,
    details: string,
    level: LogLevel = 'info',
    metadata?: Record<string, any>
) => {
    useLogStore.getState().addLog({
        level,
        category,
        action,
        details,
        user: 'Current User', // TODO: Get from auth store
        metadata
    })
}
