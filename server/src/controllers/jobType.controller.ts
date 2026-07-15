import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

export async function listJobTypes(req: Request, res: Response) {
  const activeOnly = req.query.active === 'true'
  const jobTypes = await prisma.jobType.findMany({
    where: activeOnly ? { active: true } : undefined,
    include: { _count: { select: { jobs: true } } },
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

// jobTypeId is required on Job (never null), so a job type still in use
// can't be deleted without leaving jobs pointing at nothing - reject
// instead, same as the pricebook category folder/leaf checks.
export async function deleteJobType(req: Request, res: Response) {
  const jobCount = await prisma.job.count({ where: { jobTypeId: req.params.id } })
  if (jobCount > 0) {
    throw new AppError(400, 'This job type is used by existing jobs and can\'t be deleted - deactivate it instead')
  }
  await prisma.jobType.delete({ where: { id: req.params.id } })
  res.status(204).send()
}

// Bulk delete only ever removes job types with zero jobs against them -
// it can't "force" past the same constraint deleteJobType enforces, so
// it just silently skips the ones still in use rather than failing.
export async function deleteUnusedJobTypes(_req: Request, res: Response) {
  const { count } = await prisma.jobType.deleteMany({ where: { jobs: { none: {} } } })
  const remaining = await prisma.jobType.count()
  res.json({ deletedCount: count, skippedCount: remaining })
}
