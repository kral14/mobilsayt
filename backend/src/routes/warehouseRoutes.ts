import { Router } from 'express'
import { getAllWarehouses } from '../controllers/warehouseController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Bütün anbar yerlərini əldə et
router.get('/', authMiddleware, getAllWarehouses)

export default router

