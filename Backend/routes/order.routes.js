import { Router } from 'express'
import {
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getSellerOrders,
  updateOrderStatus,
  getAllOrders,
} from '../controllers/order.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { isCustomer, isSeller, isAdmin } from '../middlewares/role.middleware.js'

const router = Router()

router.use(verifyJWT)

// Customer routes
router.post('/', isCustomer, createOrder)
router.post('/verify-payment', isCustomer, verifyPayment)
router.get('/my-orders', isCustomer, getUserOrders)
router.put('/:id/cancel', isCustomer, cancelOrder)

// Seller & Admin routes
router.get('/seller-orders', isSeller, getSellerOrders)
router.put('/:id/status', updateOrderStatus)

// Admin routes
router.get('/', isAdmin, getAllOrders)

// Shared (customer sees own, seller sees relevant, admin sees all)
router.get('/:id', getOrderById)

export default router
