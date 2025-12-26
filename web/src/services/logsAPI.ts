import axios from 'axios'
import type { ActivityLog } from '../store/logStore'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const logsAPI = {
    // Batch send logs to server
    async sendLogs(logs: ActivityLog[]): Promise<{ success: boolean; syncedIds: string[] }> {
        try {
            // Get current user ID from auth store
            const userId = useAuthStore.getState().user?.id || null

            const response = await axios.post(`${API_BASE_URL}/logs`, {
                logs: logs.map(log => ({
                    log_id: log.id, // Map frontend 'id' to backend 'log_id'
                    user_id: userId, // Get from auth store
                    timestamp: log.timestamp instanceof Date
                        ? log.timestamp.toISOString()
                        : log.timestamp, // Already a string
                    level: log.level,
                    category: log.category,
                    action: log.action,
                    details: log.details,
                    metadata: log.metadata
                }))
            })
            return {
                success: true,
                syncedIds: response.data.syncedIds || logs.map(l => l.id)
            }
        } catch (error) {
            console.error('[logsAPI] Failed to send logs:', error)
            return {
                success: false,
                syncedIds: []
            }
        }
    },

    // Get user's logs from server with pagination
    async getUserLogs(
        userId: string,
        options?: {
            page?: number
            limit?: number
            category?: string
            level?: string
            startDate?: Date
            endDate?: Date
        }
    ): Promise<{ logs: ActivityLog[]; total: number; hasMore: boolean }> {
        try {
            const params = new URLSearchParams()
            if (options?.page) params.append('page', options.page.toString())
            if (options?.limit) params.append('limit', options.limit.toString())
            if (options?.category) params.append('category', options.category)
            if (options?.level) params.append('level', options.level)
            if (options?.startDate) params.append('startDate', options.startDate.toISOString())
            if (options?.endDate) params.append('endDate', options.endDate.toISOString())

            const response = await axios.get(`${API_BASE_URL}/logs/${userId}?${params}`)

            return {
                logs: response.data.logs.map((log: any) => ({
                    ...log,
                    timestamp: new Date(log.timestamp) // Convert string back to Date
                })),
                total: response.data.total,
                hasMore: response.data.hasMore
            }
        } catch (error) {
            console.error('[logsAPI] Failed to get user logs:', error)
            return {
                logs: [],
                total: 0,
                hasMore: false
            }
        }
    },

    // Clear user's logs from server
    async clearUserLogs(userId: string): Promise<boolean> {
        try {
            await axios.delete(`${API_BASE_URL}/logs/${userId}`)
            return true
        } catch (error) {
            console.error('[logsAPI] Failed to clear user logs:', error)
            return false
        }
    }
}
