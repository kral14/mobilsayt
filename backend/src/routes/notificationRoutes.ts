import { Router } from 'express'
import { createNotification, getUserNotifications, markAsRead, clearAllNotifications } from '../controllers/notificationController'

const router = Router()

// POST /api/notifications - Create notification
router.post('/', createNotification)

// GET /api/notifications - Get user's notifications
router.get('/', getUserNotifications)

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', markAsRead)

// DELETE /api/notifications - Clear all notifications
router.delete('/', clearAllNotifications)

export default router
