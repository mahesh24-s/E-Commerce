import { Router } from 'express'
import {
  createReview,
  getProductReviews,
  deleteReview,
} from '../controllers/review.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { isCustomer } from '../middlewares/role.middleware.js'
import { uploadReviewImages } from '../middlewares/upload.middleware.js'

const router = Router()

// Public
router.get('/product/:productId', getProductReviews)

// Customer only
router.post('/', verifyJWT, isCustomer, uploadReviewImages, createReview)
router.delete('/:id', verifyJWT, isCustomer, deleteReview)

export default router
