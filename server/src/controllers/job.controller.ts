import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { JobStatus } from '../generated/prisma/enums.js'
import { AppError } from '../utils/AppError.js'

function parseJobStatus(value: unknown): JobStatus | undefined {
  return typeof value === 'string' && value in JobStatus ? (value as JobStatus) : undefined
}

export async function listJobs(req: Request, res: Response) {
  const { status, locationId } = req.query
  const jobs = await prisma.job.findMany({
    where: {
      status: parseJobStatus(status),
      locationId: typeof locationId === 'string' ? locationId : undefined,
    },
    include: { location: { include: { customer: true } }, appointments: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(jobs)
}

export async function getJob(req: Request, res: Response) {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      location: { include: { customer: true } },
      appointments: { include: { technician: true } },
      estimates: { include: { lineItems: true } },
      invoices: { include: { lineItems: true, payments: true } },
    },
  })
  if (!job) throw new AppError(404, 'Job not found')
  res.json(job)
}

export async function createJob(req: Request, res: Response) {
  const { locationId, jobType, priority, summary } = req.body
  if (!locationId || !jobType || !summary) {
    throw new AppError(400, 'locationId, jobType, and summary are required')
  }
  const location = await prisma.location.findUnique({ where: { id: locationId } })
  if (!location) throw new AppError(404, 'Location not found')

  const job = await prisma.job.create({ data: { locationId, jobType, priority, summary } })
  res.status(201).json(job)
}

export async function updateJob(req: Request, res: Response) {
  const { jobType, status, priority, summary } = req.body
  const job = await prisma.job.update({
    where: { id: req.params.id },
    data: { jobType, status, priority, summary },
  })
  res.json(job)
}

export async function deleteJob(req: Request, res: Response) {
  await prisma.job.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
