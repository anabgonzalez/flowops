import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

export async function listComponents(req: Request, res: Response) {
  const components = await prisma.pricebookItemComponent.findMany({
    where: { parentItemId: req.params.itemId },
    include: { componentItem: true },
  })
  res.json(components)
}

export async function addComponent(req: Request, res: Response) {
  const { componentItemId, quantity } = req.body
  if (!componentItemId) throw new AppError(400, 'componentItemId is required')
  if (componentItemId === req.params.itemId) throw new AppError(400, 'An item cannot include itself')

  const componentItem = await prisma.pricebookItem.findUnique({ where: { id: componentItemId } })
  if (!componentItem) throw new AppError(404, 'Component item not found')

  const component = await prisma.pricebookItemComponent.create({
    data: { parentItemId: req.params.itemId, componentItemId, quantity: quantity ?? 1 },
    include: { componentItem: true },
  })
  res.status(201).json(component)
}

export async function removeComponent(req: Request, res: Response) {
  await prisma.pricebookItemComponent.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
