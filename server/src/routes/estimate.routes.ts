import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import {
  deleteEstimate,
  getEstimate,
  updateEstimateStatus,
} from '../controllers/estimate.controller.js'

const router = Router()

router.get('/:id', asyncHandler(getEstimate))
router.patch('/:id/status', asyncHandler(updateEstimateStatus))
router.delete('/:id', asyncHandler(deleteEstimate))

export default router
