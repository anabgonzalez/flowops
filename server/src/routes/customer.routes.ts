import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from '../controllers/customer.controller.js'
import { createLocation, listLocationsForCustomer } from '../controllers/location.controller.js'

const router = Router()

router.get('/', asyncHandler(listCustomers))
router.get('/:id', asyncHandler(getCustomer))
router.post('/', asyncHandler(createCustomer))
router.patch('/:id', asyncHandler(updateCustomer))
router.delete('/:id', asyncHandler(deleteCustomer))

router.get('/:customerId/locations', asyncHandler(listLocationsForCustomer))
router.post('/:customerId/locations', asyncHandler(createLocation))

export default router
