import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

export async function listTags(req: Request, res: Response) {
  const activeOnly = req.query.active === 'true'
  const tags = await prisma.tag.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { name: 'asc' },
  })
  res.json(tags)
}

export async function createTag(req: Request, res: Response) {
  const { name, color } = req.body
  if (!name || !color) throw new AppError(400, 'name and color are required')
  const tag = await prisma.tag.create({ data: { name, color } })
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
