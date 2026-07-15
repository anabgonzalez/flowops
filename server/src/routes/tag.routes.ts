import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { createTag, deleteAllTags, deleteTag, listTags, updateTag } from '../controllers/tag.controller.js'

const router = Router()

router.get('/', asyncHandler(listTags))
router.post('/', asyncHandler(createTag))
router.patch('/:id', asyncHandler(updateTag))
router.delete('/', asyncHandler(deleteAllTags))
router.delete('/:id', asyncHandler(deleteTag))

export default router
