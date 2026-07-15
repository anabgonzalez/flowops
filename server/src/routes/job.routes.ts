import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { createJob, deleteJob, getJob, listJobs, updateJob } from '../controllers/job.controller.js'
import {
  createAppointment,
  listAppointmentsForJob,
} from '../controllers/appointment.controller.js'
import { createEstimate, listEstimatesForJob } from '../controllers/estimate.controller.js'
import { createInvoice, listInvoicesForJob } from '../controllers/invoice.controller.js'

const router = Router()

router.get('/', asyncHandler(listJobs))
router.get('/:id', asyncHandler(getJob))
router.post('/', asyncHandler(createJob))
router.patch('/:id', asyncHandler(updateJob))
router.delete('/:id', asyncHandler(deleteJob))

router.get('/:jobId/appointments', asyncHandler(listAppointmentsForJob))
router.post('/:jobId/appointments', asyncHandler(createAppointment))

router.get('/:jobId/estimates', asyncHandler(listEstimatesForJob))
router.post('/:jobId/estimates', asyncHandler(createEstimate))

router.get('/:jobId/invoices', asyncHandler(listInvoicesForJob))
router.post('/:jobId/invoices', asyncHandler(createInvoice))

export default router
