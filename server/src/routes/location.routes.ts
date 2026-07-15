import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { deleteLocation, getLocation, updateLocation } from '../controllers/location.controller.js'

const router = Router()

router.get('/:id', asyncHandler(getLocation))
router.patch('/:id', asyncHandler(updateLocation))
router.delete('/:id', asyncHandler(deleteLocation))

export default router
