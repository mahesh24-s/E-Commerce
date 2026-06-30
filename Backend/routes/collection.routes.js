import { Router } from 'express'
import {
  getAllCollections,
  getCollectionBySlug,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../controllers/collection.controller.js'
import { verifyJWT, optionalJWT } from '../middlewares/auth.middleware.js'
import { isAdmin } from '../middlewares/role.middleware.js'
import { uploadSingle } from '../middlewares/upload.middleware.js'

const router = Router()

// Public routes (with optional auth to check admin role)
router.get('/', optionalJWT, getAllCollections)
router.get('/:slug', optionalJWT, getCollectionBySlug)

// Admin only routes
router.use(verifyJWT, isAdmin)
router.post('/', uploadSingle('image'), createCollection)
router.put('/:id', uploadSingle('image'), updateCollection)
router.delete('/:id', deleteCollection)

export default router
