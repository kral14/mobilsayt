
import express from 'express'
import { getNotifications, markAsRead, clearAll, createNotificationHandler } from '../controllers/notificationController'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()

// All routes require authentication
router.use(authMiddleware as any)

router.post('/', createNotificationHandler)
router.get('/', getNotifications)
router.put('/:id/read', markAsRead)
router.delete('/', clearAll)

export default router
