import { Router } from 'express'
import { createLogs, getUserLogs, clearUserLogs } from '../controllers/logsController'

const router = Router()

// POST /api/logs - Batch create logs
router.post('/', createLogs)

// GET /api/logs/:userId - Get user's logs with pagination
router.get('/:userId', getUserLogs)

// DELETE /api/logs/:userId - Clear user's logs
router.delete('/:userId', clearUserLogs)

export default router
