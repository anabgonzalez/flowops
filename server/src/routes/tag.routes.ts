import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { createTag, listTags, updateTag } from '../controllers/tag.controller.js'

const router = Router()

router.get('/', asyncHandler(listTags))
router.post('/', asyncHandler(createTag))
router.patch('/:id', asyncHandler(updateTag))

export default router
