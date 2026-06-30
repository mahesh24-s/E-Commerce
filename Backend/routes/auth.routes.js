import { Router } from 'express'
import {
  register,
  verifyOTP,
  resendOTP,
  login,
  logout,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/register', register)
router.post('/verify-otp', verifyOTP)
router.post('/resend-otp', resendOTP)
router.post('/login', login)
router.post('/logout', verifyJWT, logout)
router.post('/refresh-token', refreshAccessToken)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

export default router
