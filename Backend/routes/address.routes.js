import { Router } from 'express'
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/address.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

// All address routes: JWT required (any role can manage their own addresses)
router.use(verifyJWT)

router.get('/', getAddresses)
router.post('/', addAddress)
router.put('/:id/default', setDefaultAddress)
router.put('/:id', updateAddress)
router.delete('/:id', deleteAddress)

export default router
