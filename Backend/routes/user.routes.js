import { Router } from 'express'
import {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUserRole,
} from '../controllers/user.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { isAdmin } from '../middlewares/role.middleware.js'
import { uploadSingle } from '../middlewares/upload.middleware.js'

const router = Router()

// All user routes require authentication
router.use(verifyJWT)

router.get('/profile', getProfile)
router.put('/profile', uploadSingle('avatar'), updateProfile)
router.put('/change-password', changePassword)

// Admin only
router.get('/', isAdmin, getAllUsers)
router.put('/:id/role', isAdmin, updateUserRole)

export default router
