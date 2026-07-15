import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import {
  createTimeframe,
  deleteTimeframe,
  listTimeframes,
  updateTimeframe,
} from '../controllers/timeframe.controller.js'

const router = Router()

router.get('/', asyncHandler(listTimeframes))
router.post('/', asyncHandler(createTimeframe))
router.patch('/:id', asyncHandler(updateTimeframe))
router.delete('/:id', asyncHandler(deleteTimeframe))

export default router
