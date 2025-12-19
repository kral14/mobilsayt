import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface Notification {
    id: number
    user_id: number
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    timestamp: string
    read: boolean
}

export const notificationsAPI = {
    // Create a new notification
    async createNotification(notification: {
        user_id: number
        type: string
        title: string
        message: string
    }): Promise<boolean> {
        try {
            await axios.post(`${API_BASE_URL}/api/notifications`, notification)
            return true
        } catch (error) {
            console.error('[notificationsAPI] Failed to create notification:', error)
            return false
        }
    },

    // Get user's notifications
    async getUserNotifications(): Promise<Notification[]> {
        try {
            const token = useAuthStore.getState().token
            const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            return response.data.notifications || []
        } catch (error) {
            console.error('[notificationsAPI] Failed to get notifications:', error)
            return []
        }
    },

    // Mark notification as read
    async markAsRead(id: number): Promise<boolean> {
        try {
            const token = useAuthStore.getState().token
            await axios.put(`${API_BASE_URL}/api/notifications/${id}/read`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            return true
        } catch (error) {
            console.error('[notificationsAPI] Failed to mark as read:', error)
            return false
        }
    },

    // Clear all notifications
    async clearAll(): Promise<boolean> {
        try {
            const token = useAuthStore.getState().token
            await axios.delete(`${API_BASE_URL}/api/notifications`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            return true
        } catch (error) {
            console.error('[notificationsAPI] Failed to clear notifications:', error)
            return false
        }
    }
}
