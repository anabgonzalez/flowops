import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import {
  deleteAppointment,
  getAppointment,
  listAppointmentsForTechnician,
  updateAppointment,
} from '../controllers/appointment.controller.js'

const router = Router()

router.get('/technician/:technicianId', asyncHandler(listAppointmentsForTechnician))
router.get('/:id', asyncHandler(getAppointment))
router.patch('/:id', asyncHandler(updateAppointment))
router.delete('/:id', asyncHandler(deleteAppointment))

export default router
