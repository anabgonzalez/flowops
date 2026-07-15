import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

export async function listCategories(_req: Request, res: Response) {
  const categories = await prisma.pricebookCategory.findMany({ orderBy: { name: 'asc' } })
  res.json(categories)
}

export async function createCategory(req: Request, res: Response) {
  const { name, parentId } = req.body
  if (!name) throw new AppError(400, 'name is required')
  const category = await prisma.pricebookCategory.create({ data: { name, parentId: parentId || undefined } })
  res.status(201).json(category)
}

export async function updateCategory(req: Request, res: Response) {
  const { name, parentId } = req.body
  const category = await prisma.pricebookCategory.update({
    where: { id: req.params.id },
    data: { name, parentId: parentId === undefined ? undefined : parentId || null },
  })
  res.json(category)
}

export async function deleteCategory(req: Request, res: Response) {
  await prisma.pricebookCategory.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
