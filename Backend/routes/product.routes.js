import { Router } from 'express'
import {
  createProduct,
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategorySlug,
  getSellerProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  toggleFeatured,
  adminDeleteProduct
} from '../controllers/product.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { isSeller, isAdmin } from '../middlewares/role.middleware.js'
import { uploadMultiple } from '../middlewares/upload.middleware.js'

const router = Router()

// Public routes
// missing getProductsByCategory route
router.get('/', getAllProducts)
router.get('/featured', getFeaturedProducts)
router.get('/category/:slug', getProductsByCategorySlug)
router.get('/:slug', getProductBySlug)

// Admin-only routes
router.get('/admin/all', verifyJWT, isAdmin, getAdminProducts)
router.patch('/admin/:id/featured', verifyJWT, isAdmin, toggleFeatured)
router.delete('/admin/:id', verifyJWT, isAdmin, adminDeleteProduct)

// Seller-only routes
router.post('/', verifyJWT, isSeller, uploadMultiple('images', 5), createProduct)
router.get('/seller/my-products', verifyJWT, isSeller, getSellerProducts)
router.put('/:id', verifyJWT, isSeller, uploadMultiple('images', 5), updateProduct)
router.delete('/:id', verifyJWT, isSeller, deleteProduct)

export default router
