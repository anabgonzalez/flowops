import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { JobStatus, type JobPriority } from '../generated/prisma/enums.js'
import { AppError } from '../utils/AppError.js'
import { deriveJobStatus } from '../utils/jobStatus.js'

function parseJobStatus(value: unknown): JobStatus | undefined {
  return typeof value === 'string' && value in JobStatus ? (value as JobStatus) : undefined
}

const jobInclude = {
  location: { include: { customer: true } },
  jobType: true,
  tags: true,
  appointments: { include: { technician: true } },
}

export async function listJobs(req: Request, res: Response) {
  const { status, locationId } = req.query
  const jobs = await prisma.job.findMany({
    where: {
      status: parseJobStatus(status),
      locationId: typeof locationId === 'string' ? locationId : undefined,
    },
    include: jobInclude,
    orderBy: { createdAt: 'desc' },
  })
  res.json(jobs)
}

export async function getJob(req: Request, res: Response) {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      ...jobInclude,
      estimates: { include: { lineItems: true, invoice: { select: { id: true } } } },
      invoices: { include: { lineItems: true, payments: true } },
    },
  })
  if (!job) throw new AppError(404, 'Job not found')
  res.json(job)
}

export async function createJob(req: Request, res: Response) {
  const {
    locationId,
    jobTypeId,
    priority,
    summary,
    tagIds,
    technicianId,
    start,
    end,
  } = req.body as {
    locationId: string
    jobTypeId: string
    priority?: JobPriority
    summary: string
    tagIds?: string[]
    technicianId?: string
    start?: string
    end?: string
  }
  if (!locationId || !jobTypeId || !summary) {
    throw new AppError(400, 'locationId, jobTypeId, and summary are required')
  }

  const location = await prisma.location.findUnique({ where: { id: locationId } })
  if (!location) throw new AppError(404, 'Location not found')

  const jobType = await prisma.jobType.findUnique({ where: { id: jobTypeId } })
  if (!jobType) throw new AppError(404, 'Job type not found')

  const scheduleNow = Boolean(start && end)

  const job = await prisma.job.create({
    data: {
      locationId,
      jobTypeId,
      priority: priority ?? jobType.defaultPriority,
      summary,
      status: scheduleNow ? 'SCHEDULED' : 'UNSCHEDULED',
      tags: tagIds && tagIds.length > 0 ? { connect: tagIds.map((id) => ({ id })) } : undefined,
    },
    include: jobInclude,
  })

  if (scheduleNow) {
    await prisma.appointment.create({
      data: {
        jobId: job.id,
        technicianId,
        start: new Date(start!),
        end: new Date(end!),
      },
    })
  }

  const result = await prisma.job.findUnique({ where: { id: job.id }, include: jobInclude })
  res.status(201).json(result)
}

// Status is managed automatically from appointment activity (see jobStatus.ts)
// plus the explicit actions below - it is never set directly from a generic
// PATCH, so it can't be pushed into an inconsistent value from the UI.
export async function updateJob(req: Request, res: Response) {
  const { jobTypeId, priority, summary, tagIds } = req.body

  if (jobTypeId) {
    const jobType = await prisma.jobType.findUnique({ where: { id: jobTypeId } })
    if (!jobType) throw new AppError(404, 'Job type not found')
  }

  const job = await prisma.job.update({
    where: { id: req.params.id },
    data: {
      jobTypeId,
      priority,
      summary,
      tags: tagIds ? { set: tagIds.map((id: string) => ({ id })) } : undefined,
    },
    include: jobInclude,
  })
  res.json(job)
}

export async function cancelJob(req: Request, res: Response) {
  const job = await prisma.job.update({ where: { id: req.params.id }, data: { status: 'CANCELED' } })
  res.json(job)
}

export async function holdJob(req: Request, res: Response) {
  const job = await prisma.job.update({ where: { id: req.params.id }, data: { status: 'ON_HOLD' } })
  res.json(job)
}

export async function resumeJob(req: Request, res: Response) {
  const appointments = await prisma.appointment.findMany({
    where: { jobId: req.params.id },
    select: { status: true },
  })
  const job = await prisma.job.update({
    where: { id: req.params.id },
    data: { status: deriveJobStatus(appointments) },
  })
  res.json(job)
}

export async function deleteJob(req: Request, res: Response) {
  await prisma.job.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
