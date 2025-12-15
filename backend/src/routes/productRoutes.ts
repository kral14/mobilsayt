import { Router } from 'express'
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Bütün məhsulları görüntüləmək üçün auth lazım deyil
router.get('/', (req, res, next) => {
  console.log('🔍 [DEBUG] GET /api/products route çağırıldı')
  console.log('🔍 [DEBUG] Request headers:', req.headers)
  getAllProducts(req as any, res).catch((err) => {
    console.error('❌ [ERROR] Route handler error:', err)
    next(err)
  })
})
router.get('/:id', getProductById)

// Məhsul yaratmaq, yeniləmək və silmək üçün auth lazımdır
router.post('/', authMiddleware, createProduct)
router.put('/:id', authMiddleware, updateProduct)
router.delete('/:id', authMiddleware, deleteProduct)

// Discount routes
import { createProductDiscount, getProductDiscounts, deleteProductDiscount } from '../controllers/productDiscountController'
router.post('/:productId/discounts', authMiddleware, createProductDiscount)
router.get('/:productId/discounts', authMiddleware, getProductDiscounts)
router.delete('/discounts/:id', authMiddleware, deleteProductDiscount)

export default router

