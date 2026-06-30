import { Router } from 'express'
import {
  createCategoryRequest,
  getCategoryRequests,
  updateRequestStatus,
} from '../controllers/categoryRequest.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { isSeller, isAdmin } from '../middlewares/role.middleware.js'

const router = Router()

// Seller Routes
router.post('/', verifyJWT, isSeller, createCategoryRequest)

// Admin Routes
router.get('/', verifyJWT, isAdmin, getCategoryRequests)
router.put('/:id/status', verifyJWT, isAdmin, updateRequestStatus)

export default router
