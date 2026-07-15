import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import {
  createJobType,
  deleteJobType,
  deleteUnusedJobTypes,
  listJobTypes,
  updateJobType,
} from '../controllers/jobType.controller.js'

const router = Router()

router.get('/', asyncHandler(listJobTypes))
router.post('/', asyncHandler(createJobType))
router.patch('/:id', asyncHandler(updateJobType))
router.delete('/unused', asyncHandler(deleteUnusedJobTypes))
router.delete('/:id', asyncHandler(deleteJobType))

export default router
