import { Router } from 'express'
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
} from '../controllers/wishlist.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { isCustomer } from '../middlewares/role.middleware.js'

const router = Router()

// All wishlist routes: JWT + customer only
router.use(verifyJWT, isCustomer)

router.get('/', getWishlist)
router.get('/check/:productId', checkWishlist)
router.post('/:productId', addToWishlist)
router.delete('/:productId', removeFromWishlist)

export default router
