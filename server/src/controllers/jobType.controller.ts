import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

export async function listJobTypes(req: Request, res: Response) {
  const activeOnly = req.query.active === 'true'
  const jobTypes = await prisma.jobType.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { name: 'asc' },
  })
  res.json(jobTypes)
}

export async function createJobType(req: Request, res: Response) {
  const { name, defaultPriority } = req.body
  if (!name) throw new AppError(400, 'name is required')
  const jobType = await prisma.jobType.create({ data: { name, defaultPriority } })
  res.status(201).json(jobType)
}

export async function updateJobType(req: Request, res: Response) {
  const { name, defaultPriority, active } = req.body
  const jobType = await prisma.jobType.update({
    where: { id: req.params.id },
    data: { name, defaultPriority, active },
  })
  res.json(jobType)
}
