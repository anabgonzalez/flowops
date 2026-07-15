import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import {
  createPricebookItem,
  deletePricebookItem,
  getPricebookItem,
  listPricebookItems,
  updatePricebookItem,
} from '../controllers/pricebookItem.controller.js'
import { addComponent, listComponents, removeComponent } from '../controllers/pricebookItemComponent.controller.js'

const router = Router()

router.get('/', asyncHandler(listPricebookItems))
router.get('/:id', asyncHandler(getPricebookItem))
router.post('/', asyncHandler(createPricebookItem))
router.patch('/:id', asyncHandler(updatePricebookItem))
router.delete('/:id', asyncHandler(deletePricebookItem))

router.get('/:itemId/components', asyncHandler(listComponents))
router.post('/:itemId/components', asyncHandler(addComponent))

export default router
