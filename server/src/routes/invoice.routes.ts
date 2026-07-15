import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { deleteInvoice, getInvoice, updateInvoiceStatus } from '../controllers/invoice.controller.js'
import { createPayment, listPaymentsForInvoice } from '../controllers/payment.controller.js'

const router = Router()

router.get('/:id', asyncHandler(getInvoice))
router.patch('/:id/status', asyncHandler(updateInvoiceStatus))
router.delete('/:id', asyncHandler(deleteInvoice))

router.get('/:invoiceId/payments', asyncHandler(listPaymentsForInvoice))
router.post('/:invoiceId/payments', asyncHandler(createPayment))

export default router
