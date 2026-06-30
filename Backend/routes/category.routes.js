import { Router } from 'express'
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getAdminCategories,
} from '../controllers/category.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { isSeller, isAdmin } from '../middlewares/role.middleware.js'
import { uploadSingle } from '../middlewares/upload.middleware.js'

const router = Router()

// Public
router.get('/', getAllCategories)

// Admin only
router.get('/admin/all', verifyJWT, isAdmin, getAdminCategories)
router.post('/', verifyJWT, isAdmin, uploadSingle('image'), createCategory)
router.put('/:id', verifyJWT, isAdmin, uploadSingle('image'), updateCategory)
router.delete('/:id', verifyJWT, isAdmin, deleteCategory)

export default router
