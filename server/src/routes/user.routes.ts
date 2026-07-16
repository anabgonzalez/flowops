import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  resetPassword,
  updateUser,
} from '../controllers/user.controller.js'

const router = Router()

router.get('/', asyncHandler(listUsers))
router.get('/:id', asyncHandler(getUser))
router.post('/', asyncHandler(createUser))
router.patch('/:id', asyncHandler(updateUser))
router.patch('/:id/password', asyncHandler(resetPassword))
router.delete('/:id', asyncHandler(deleteUser))

export default router
