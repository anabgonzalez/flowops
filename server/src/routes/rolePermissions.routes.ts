import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { listRolePermissions, updateRolePermissions } from '../controllers/rolePermissions.controller.js'

const router = Router()

router.get('/', asyncHandler(listRolePermissions))
router.patch('/:role', asyncHandler(updateRolePermissions))

export default router
