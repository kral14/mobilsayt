import { Request, Response } from 'express'
import prisma from '../config/database'
import { Prisma } from '@prisma/client'

// POST /api/notifications - Create a new notification
export const createNotification = async (req: Request, res: Response) => {
    try {
        const { user_id, type, title, message } = req.body

        if (!user_id || !type || !title || !message) {
            return res.status(400).json({ message: 'user_id, type, title və message tələb olunur' })
        }

        // Validate type
        const validTypes = ['success', 'error', 'warning', 'info']
        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: 'Yanlış notification type' })
        }

        // Insert notification
        const result = await prisma.$executeRaw`
            INSERT INTO notifications (user_id, type, title, message, timestamp)
            VALUES (${user_id}, ${type}, ${title}, ${message}, NOW())
            RETURNING id
        `

        console.log(`✅ [NOTIFICATIONS] İstifadəçi ${user_id} üçün bildiriş yaradıldı`)

        res.status(201).json({
            success: true,
            message: 'Bildiriş yaradıldı'
        })
    } catch (error: any) {
        console.error('❌ [NOTIFICATIONS] Bildiriş yaratma xətası:', error)
        res.status(500).json({
            message: 'Bildiriş yaratma xətası',
            error: error.message
        })
    }
}

// GET /api/notifications - Get user's notifications
export const getUserNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id

        if (!userId) {
            return res.status(401).json({ message: 'İstifadəçi təsdiqlənməyib' })
        }

        // Get all notifications for user, ordered by timestamp DESC
        const notifications = await prisma.$queryRaw`
            SELECT * FROM notifications
            WHERE user_id = ${userId}
            ORDER BY timestamp DESC
            LIMIT 100
        ` as any[]

        res.json({
            notifications,
            total: notifications.length
        })
    } catch (error: any) {
        console.error('❌ [NOTIFICATIONS] Bildirişləri gətirmə xətası:', error)
        res.status(500).json({
            message: 'Bildirişləri gətirmə xətası',
            error: error.message
        })
    }
}

// PUT /api/notifications/:id/read - Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const userId = (req as any).user?.id

        if (!userId) {
            return res.status(401).json({ message: 'İstifadəçi təsdiqlənməyib' })
        }

        // Update notification
        const result = await prisma.$executeRaw`
            UPDATE notifications
            SET read = TRUE
            WHERE id = ${parseInt(id)} AND user_id = ${userId}
        `

        if (result === 0) {
            return res.status(404).json({ message: 'Bildiriş tapılmadı' })
        }

        console.log(`✅ [NOTIFICATIONS] Bildiriş ${id} oxundu kimi işarələndi`)

        res.json({
            success: true,
            message: 'Bildiriş oxundu kimi işarələndi'
        })
    } catch (error: any) {
        console.error('❌ [NOTIFICATIONS] Bildirişi yeniləmə xətası:', error)
        res.status(500).json({
            message: 'Bildirişi yeniləmə xətası',
            error: error.message
        })
    }
}

// DELETE /api/notifications - Clear all user notifications
export const clearAllNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id

        if (!userId) {
            return res.status(401).json({ message: 'İstifadəçi təsdiqlənməyib' })
        }

        const result = await prisma.$executeRaw`
            DELETE FROM notifications WHERE user_id = ${userId}
        `

        console.log(`✅ [NOTIFICATIONS] İstifadəçi ${userId} üçün ${result} bildiriş silindi`)

        res.json({
            success: true,
            deletedCount: result,
            message: `${result} bildiriş silindi`
        })
    } catch (error: any) {
        console.error('❌ [NOTIFICATIONS] Bildirişləri silmə xətası:', error)
        res.status(500).json({
            message: 'Bildirişləri silmə xətası',
            error: error.message
        })
    }
}
