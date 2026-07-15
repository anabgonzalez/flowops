import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { TagCategory } from '../generated/prisma/enums.js'
import { AppError } from '../utils/AppError.js'

function parseCategory(value: unknown): TagCategory | undefined {
  return typeof value === 'string' && value in TagCategory ? (value as TagCategory) : undefined
}

export async function listTags(req: Request, res: Response) {
  const activeOnly = req.query.active === 'true'
  const category = parseCategory(req.query.category)
  const tags = await prisma.tag.findMany({
    where: {
      active: activeOnly ? true : undefined,
      category,
    },
    orderBy: { name: 'asc' },
  })
  res.json(tags)
}

export async function createTag(req: Request, res: Response) {
  const { name, color, category } = req.body
  if (!name || !color) throw new AppError(400, 'name and color are required')
  const tag = await prisma.tag.create({ data: { name, color, category: parseCategory(category) } })
  res.status(201).json(tag)
}

export async function updateTag(req: Request, res: Response) {
  const { name, color, active } = req.body
  const tag = await prisma.tag.update({
    where: { id: req.params.id },
    data: { name, color, active },
  })
  res.json(tag)
}

// Tags are joined to jobs/customers/locations through implicit many-to-many
// tables, so deleting a tag just untags whatever had it - no guard needed.
export async function deleteTag(req: Request, res: Response) {
  await prisma.tag.delete({ where: { id: req.params.id } })
  res.status(204).send()
}

export async function deleteAllTags(req: Request, res: Response) {
  const category = parseCategory(req.query.category)
  if (!category) throw new AppError(400, 'category is required')
  const { count } = await prisma.tag.deleteMany({ where: { category } })
  res.json({ deletedCount: count })
}
