import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { resetPricebook } from '../controllers/pricebookReset.controller.js'

const router = Router()

router.delete('/', asyncHandler(resetPricebook))

export default router
