import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { getDispatchBoard } from '../controllers/dispatch.controller.js'

const router = Router()

router.get('/board', asyncHandler(getDispatchBoard))

export default router
