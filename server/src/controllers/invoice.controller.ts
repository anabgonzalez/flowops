import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

interface LineItemInput {
  pricebookItemId?: string
  description: string
  quantity?: number
  unitPriceCents: number
}

function sumLineItems(lineItems: LineItemInput[]) {
  return lineItems.reduce((sum, item) => sum + item.unitPriceCents * (item.quantity ?? 1), 0)
}

function generateInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}`
}

export async function listInvoicesForJob(req: Request, res: Response) {
  const invoices = await prisma.invoice.findMany({
    where: { jobId: req.params.jobId },
    include: { lineItems: true, payments: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(invoices)
}

export async function getInvoice(req: Request, res: Response) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { lineItems: true, payments: true },
  })
  if (!invoice) throw new AppError(404, 'Invoice not found')
  res.json(invoice)
}

// Creates an invoice directly from line items, or from an approved estimate
// (the ServiceTitan pattern: invoices are populated from sold estimates).
export async function createInvoice(req: Request, res: Response) {
  const { estimateId, taxCents = 0, lineItems } = req.body as {
    estimateId?: string
    taxCents?: number
    lineItems?: LineItemInput[]
  }

  const job = await prisma.job.findUnique({ where: { id: req.params.jobId } })
  if (!job) throw new AppError(404, 'Job not found')

  let resolvedLineItems = lineItems
  let resolvedTaxCents = taxCents

  if (estimateId) {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { lineItems: true },
    })
    if (!estimate) throw new AppError(404, 'Estimate not found')
    if (estimate.status !== 'APPROVED') {
      throw new AppError(400, 'Only an approved estimate can be converted to an invoice')
    }
    resolvedLineItems = estimate.lineItems.map((item) => ({
      pricebookItemId: item.pricebookItemId ?? undefined,
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    }))
    resolvedTaxCents = estimate.taxCents
  }

  if (!resolvedLineItems || resolvedLineItems.length === 0) {
    throw new AppError(400, 'Provide lineItems, or an estimateId to convert')
  }

  const subtotalCents = sumLineItems(resolvedLineItems)
  const totalCents = subtotalCents + resolvedTaxCents

  const invoice = await prisma.invoice.create({
    data: {
      jobId: req.params.jobId,
      invoiceNumber: generateInvoiceNumber(),
      subtotalCents,
      taxCents: resolvedTaxCents,
      totalCents,
      balanceCents: totalCents,
      lineItems: {
        create: resolvedLineItems.map((item) => ({
          pricebookItemId: item.pricebookItemId,
          description: item.description,
          quantity: item.quantity ?? 1,
          unitPriceCents: item.unitPriceCents,
          totalCents: item.unitPriceCents * (item.quantity ?? 1),
        })),
      },
    },
    include: { lineItems: true },
  })
  res.status(201).json(invoice)
}

export async function updateInvoiceStatus(req: Request, res: Response) {
  const { status } = req.body
  if (!status) throw new AppError(400, 'status is required')
  const invoice = await prisma.invoice.update({
    where: { id: req.params.id },
    data: { status },
  })
  res.json(invoice)
}

export async function deleteInvoice(req: Request, res: Response) {
  await prisma.invoice.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
