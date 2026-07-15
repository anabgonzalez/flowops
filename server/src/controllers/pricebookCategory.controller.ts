import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

export async function listCategories(_req: Request, res: Response) {
  const categories = await prisma.pricebookCategory.findMany({
    include: { _count: { select: { children: true, items: true } } },
    orderBy: { name: 'asc' },
  })
  res.json(categories)
}

// A category is either a "folder" (holds subcategories) or a "leaf"
// (holds items) - whichever gets created in it first locks it that way,
// so the card drill-down never has to mix subcategory cards and item
// rows in the same view.
export async function createCategory(req: Request, res: Response) {
  const { name, parentId } = req.body
  if (!name) throw new AppError(400, 'name is required')

  if (parentId) {
    const itemCount = await prisma.pricebookItem.count({ where: { categoryId: parentId } })
    if (itemCount > 0) {
      throw new AppError(400, 'This category already has items in it and can\'t have subcategories added')
    }
  }

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
