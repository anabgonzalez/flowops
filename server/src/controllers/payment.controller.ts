import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

export async function listPaymentsForInvoice(req: Request, res: Response) {
  const payments = await prisma.payment.findMany({
    where: { invoiceId: req.params.invoiceId },
    orderBy: { paidAt: 'desc' },
  })
  res.json(payments)
}

export async function createPayment(req: Request, res: Response) {
  const { amountCents, method } = req.body
  if (!amountCents || amountCents <= 0 || !method) {
    throw new AppError(400, 'amountCents (> 0) and method are required')
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: req.params.invoiceId } })
  if (!invoice) throw new AppError(404, 'Invoice not found')
  if (amountCents > invoice.balanceCents) {
    throw new AppError(400, 'Payment exceeds remaining balance')
  }

  const newBalanceCents = invoice.balanceCents - amountCents
  const newStatus = newBalanceCents === 0 ? 'PAID' : 'PARTIALLY_PAID'

  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: { invoiceId: req.params.invoiceId, amountCents, method },
    }),
    prisma.invoice.update({
      where: { id: req.params.invoiceId },
      data: { balanceCents: newBalanceCents, status: newStatus },
    }),
  ])
  res.status(201).json(payment)
}
