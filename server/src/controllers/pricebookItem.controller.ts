import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

export async function listPricebookItems(req: Request, res: Response) {
  const activeOnly = req.query.active === 'true'
  const items = await prisma.pricebookItem.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { name: 'asc' },
  })
  res.json(items)
}

export async function getPricebookItem(req: Request, res: Response) {
  const item = await prisma.pricebookItem.findUnique({ where: { id: req.params.id } })
  if (!item) throw new AppError(404, 'Pricebook item not found')
  res.json(item)
}

export async function createPricebookItem(req: Request, res: Response) {
  const { code, name, description, type, costCents, priceCents, taxable, active } = req.body
  if (!code || !name || !type || costCents == null || priceCents == null) {
    throw new AppError(400, 'code, name, type, costCents, and priceCents are required')
  }
  const item = await prisma.pricebookItem.create({
    data: { code, name, description, type, costCents, priceCents, taxable, active },
  })
  res.status(201).json(item)
}

export async function updatePricebookItem(req: Request, res: Response) {
  const { code, name, description, type, costCents, priceCents, taxable, active } = req.body
  const item = await prisma.pricebookItem.update({
    where: { id: req.params.id },
    data: { code, name, description, type, costCents, priceCents, taxable, active },
  })
  res.json(item)
}

export async function deletePricebookItem(req: Request, res: Response) {
  await prisma.pricebookItem.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
