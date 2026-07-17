import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { bootstrap, bootstrapStatus, login, logout, me } from '../controllers/auth.controller.js'

const router = Router()

router.post('/login', asyncHandler(login))
router.post('/logout', logout)
router.get('/bootstrap-status', asyncHandler(bootstrapStatus))
router.post('/bootstrap', asyncHandler(bootstrap))
router.get('/me', asyncHandler(requireAuth), me)

export default router
