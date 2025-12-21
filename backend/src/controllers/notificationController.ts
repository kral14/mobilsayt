
import { Request, Response } from 'express'
import prisma from '../config/database'

// Get notifications for current user
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const notifications = await prisma.notifications.findMany({
            where: { user_id: parseInt(userId) },
            orderBy: { timestamp: 'desc' },
            take: 50
        })

        res.json(notifications)
    } catch (error) {
        console.error('Error fetching notifications:', error)
        res.status(500).json({ error: 'Failed to fetch notifications' })
    }
}

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId
        const { id } = req.params

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        await prisma.notifications.updateMany({
            where: {
                id: parseInt(id),
                user_id: parseInt(userId)
            },
            data: {
                read: true
            }
        })

        res.json({ success: true })
    } catch (error) {
        console.error('Error marking notification as read:', error)
        res.status(500).json({ error: 'Failed to mark notification as read' })
    }
}

// Clear all notifications for user
export const clearAll = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        await prisma.notifications.deleteMany({
            where: { user_id: parseInt(userId) }
        })

        res.json({ success: true })
    } catch (error) {
        console.error('Error clearing notifications:', error)
        res.status(500).json({ error: 'Failed to clear notifications' })
    }
}

// Internal helper to create notification
export const createNotification = async (userId: number, title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    try {
        await prisma.notifications.create({
            data: {
                user_id: userId,
                title,
                message,
                type,
                read: false
            }
        })
    } catch (error) {
        console.error('Error creating notification:', error)
    }
}

// API endpoint to create notification (for frontend)
export const createNotificationHandler = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId
        const { title, message, type } = req.body

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        if (!title || !message) {
            return res.status(400).json({ error: 'Title and message are required' })
        }

        await createNotification(parseInt(userId), title, message, type || 'info')
        res.status(201).json({ success: true })
    } catch (error) {
        console.error('Error creating notification via API:', error)
        res.status(500).json({ error: 'Failed to create notification' })
    }
}
