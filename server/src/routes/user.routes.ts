import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from '../controllers/user.controller.js'

const router = Router()

router.get('/', asyncHandler(listUsers))
router.get('/:id', asyncHandler(getUser))
router.post('/', asyncHandler(createUser))
router.patch('/:id', asyncHandler(updateUser))
router.delete('/:id', asyncHandler(deleteUser))

export default router
