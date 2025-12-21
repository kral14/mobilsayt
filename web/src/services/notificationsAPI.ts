import api from './api'

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
            await api.post('/notifications', notification)
            return true
        } catch (error) {
            console.error('[notificationsAPI] Failed to create notification:', error)
            return false
        }
    },

    // Get user's notifications
    async getUserNotifications(): Promise<Notification[]> {
        try {
            const response = await api.get('/notifications')
            return response.data.notifications || []
        } catch (error) {
            console.error('[notificationsAPI] Failed to get notifications:', error)
            return []
        }
    },

    // Mark notification as read
    async markAsRead(id: number): Promise<boolean> {
        try {
            await api.put(`/notifications/${id}/read`)
            return true
        } catch (error) {
            console.error('[notificationsAPI] Failed to mark as read:', error)
            return false
        }
    },

    // Clear all notifications
    async clearAll(): Promise<boolean> {
        try {
            await api.delete('/notifications')
            return true
        } catch (error) {
            console.error('[notificationsAPI] Failed to clear notifications:', error)
            return false
        }
    }
}
