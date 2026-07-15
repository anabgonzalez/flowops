import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { removeComponent } from '../controllers/pricebookItemComponent.controller.js'

const router = Router()

router.delete('/:id', asyncHandler(removeComponent))

export default router
