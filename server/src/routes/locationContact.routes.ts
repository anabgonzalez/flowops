import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { deleteContact, updateContact } from '../controllers/locationContact.controller.js'

const router = Router()

router.patch('/:id', asyncHandler(updateContact))
router.delete('/:id', asyncHandler(deleteContact))

export default router
