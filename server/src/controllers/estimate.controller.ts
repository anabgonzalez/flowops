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

export async function listEstimatesForJob(req: Request, res: Response) {
  const estimates = await prisma.estimate.findMany({
    where: { jobId: req.params.jobId },
    include: { lineItems: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(estimates)
}

export async function getEstimate(req: Request, res: Response) {
  const estimate = await prisma.estimate.findUnique({
    where: { id: req.params.id },
    include: { lineItems: true },
  })
  if (!estimate) throw new AppError(404, 'Estimate not found')
  res.json(estimate)
}

export async function createEstimate(req: Request, res: Response) {
  const { name, taxCents = 0, lineItems } = req.body as {
    name: string
    taxCents?: number
    lineItems: LineItemInput[]
  }
  if (!name || !Array.isArray(lineItems) || lineItems.length === 0) {
    throw new AppError(400, 'name and at least one line item are required')
  }

  const job = await prisma.job.findUnique({ where: { id: req.params.jobId } })
  if (!job) throw new AppError(404, 'Job not found')

  const subtotalCents = sumLineItems(lineItems)

  const estimate = await prisma.estimate.create({
    data: {
      jobId: req.params.jobId,
      name,
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
      lineItems: {
        create: lineItems.map((item) => ({
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
  res.status(201).json(estimate)
}

export async function updateEstimate(req: Request, res: Response) {
  const { name, taxCents = 0, lineItems } = req.body as {
    name: string
    taxCents?: number
    lineItems: LineItemInput[]
  }
  if (!name || !Array.isArray(lineItems) || lineItems.length === 0) {
    throw new AppError(400, 'name and at least one line item are required')
  }

  const existing = await prisma.estimate.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new AppError(404, 'Estimate not found')
  if (existing.status !== 'DRAFT' && existing.status !== 'PRESENTED') {
    throw new AppError(400, 'Only a draft or presented estimate can be edited')
  }

  const subtotalCents = sumLineItems(lineItems)

  const estimate = await prisma.estimate.update({
    where: { id: req.params.id },
    data: {
      name,
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
      lineItems: {
        deleteMany: {},
        create: lineItems.map((item) => ({
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
  res.json(estimate)
}

export async function updateEstimateStatus(req: Request, res: Response) {
  const { status } = req.body
  if (!status) throw new AppError(400, 'status is required')
  const estimate = await prisma.estimate.update({
    where: { id: req.params.id },
    data: { status },
  })
  res.json(estimate)
}

export async function deleteEstimate(req: Request, res: Response) {
  await prisma.estimate.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
