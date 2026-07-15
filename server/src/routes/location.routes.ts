import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { deleteLocation, getLocation, updateLocation } from '../controllers/location.controller.js'
import { createContact, listContactsForLocation } from '../controllers/locationContact.controller.js'

const router = Router()

router.get('/:id', asyncHandler(getLocation))
router.patch('/:id', asyncHandler(updateLocation))
router.delete('/:id', asyncHandler(deleteLocation))

router.get('/:locationId/contacts', asyncHandler(listContactsForLocation))
router.post('/:locationId/contacts', asyncHandler(createContact))

export default router
