import express from 'express'
import {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserStats,
} from '../controllers/adminController'
import { getAllLogs } from '../controllers/logsController'
import { requireAdmin } from '../middleware/adminAuth'

const router = express.Router()

// Bütün route-lar admin icazəsi tələb edir
router.use(requireAdmin)

// İstifadəçi idarəetməsi
router.get('/users', getAllUsers)
router.post('/users', createUser)
router.put('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)
router.get('/users/stats', getUserStats)

// Log idarəetməsi
router.get('/logs', getAllLogs)

export default router

