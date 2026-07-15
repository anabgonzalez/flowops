import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../controllers/pricebookCategory.controller.js'

const router = Router()

router.get('/', asyncHandler(listCategories))
router.post('/', asyncHandler(createCategory))
router.patch('/:id', asyncHandler(updateCategory))
router.delete('/:id', asyncHandler(deleteCategory))

export default router
