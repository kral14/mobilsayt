import { create } from 'zustand'
import { Notification } from '../components/NotificationToast'
import { notificationsAPI } from '../services/notificationsAPI'
import { useAuthStore } from './authStore'

interface NotificationStore {
    notifications: Notification[]
    activeToasts: Notification[]
    addNotification: (type: Notification['type'], title: string, message: string) => void
    removeToast: (id: number) => void
    markAsRead: (id: number) => void
    clearAll: () => void
    loadNotifications: () => Promise<void>
}

let notificationIdCounter = 1

export const useNotificationStore = create<NotificationStore>((set) => ({
    notifications: [],
    activeToasts: [],

    addNotification: (type, title, message) => {
        const notification: Notification = {
            id: notificationIdCounter++,
            type,
            title,
            message,
            timestamp: new Date(),
            read: false
        }

        set((state) => ({
            notifications: [notification, ...state.notifications],
            activeToasts: [...state.activeToasts, notification]
        }))

        // Backend-ə göndər
        const userId = useAuthStore.getState().user?.id
        if (userId) {
            notificationsAPI.createNotification({
                user_id: userId,
                type,
                title,
                message
            }).catch(err => console.error('Failed to save notification:', err))
        }
    },

    removeToast: (id) => {
        set((state) => ({
            activeToasts: state.activeToasts.filter(n => n.id !== id)
        }))
    },

    markAsRead: (id) => {
        set((state) => ({
            notifications: state.notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
            )
        }))

        // Backend-ə göndər
        notificationsAPI.markAsRead(id).catch(err =>
            console.error('Failed to mark as read:', err)
        )
    },

    clearAll: () => {
        set({ notifications: [], activeToasts: [] })

        // Backend-dən sil
        notificationsAPI.clearAll().catch(err =>
            console.error('Failed to clear notifications:', err)
        )
    },

    loadNotifications: async () => {
        try {
            const notifications = await notificationsAPI.getUserNotifications()
            set({
                notifications: notifications.map(n => ({
                    ...n,
                    timestamp: new Date(n.timestamp)
                }))
            })
        } catch (err) {
            console.error('Failed to load notifications:', err)
        }
    }
}))
