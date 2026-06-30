import { Router } from 'express'
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cart.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { isCustomer } from '../middlewares/role.middleware.js'

const router = Router()

// All cart routes: JWT + customer only
router.use(verifyJWT, isCustomer)

router.get('/', getCart)
router.post('/', addToCart)
router.put('/:productId', updateCartItem)
router.delete('/clear', clearCart)
router.delete('/:productId', removeFromCart)

export default router
