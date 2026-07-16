import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

// Everything the dispatch board needs for one day, in a single round trip:
// the technician roster, that day's appointments (for the timeline), and
// the queue of jobs nobody's been assigned to yet.
export async function getDispatchBoard(req: Request, res: Response) {
  const dateParam = req.query.date
  if (typeof dateParam !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    throw new AppError(400, 'date is required as YYYY-MM-DD')
  }
  const dayStart = new Date(`${dateParam}T00:00:00`)
  const dayEnd = new Date(`${dateParam}T23:59:59.999`)

  const [technicians, appointments, unassignedJobs] = await Promise.all([
    prisma.user.findMany({ where: { role: 'TECHNICIAN' }, orderBy: { name: 'asc' } }),
    prisma.appointment.findMany({
      where: { start: { gte: dayStart, lte: dayEnd } },
      include: {
        technician: true,
        job: { include: { jobType: true, location: { include: { customer: true } } } },
      },
      orderBy: { start: 'asc' },
    }),
    // A job needs dispatching if it has no appointments yet, or none of its
    // appointments has a technician assigned - Prisma's `every` on an empty
    // relation is vacuously true, so this one clause covers both cases.
    prisma.job.findMany({
      where: {
        status: { notIn: ['CANCELED', 'COMPLETED'] },
        appointments: { every: { technicianId: null } },
      },
      include: { jobType: true, location: { include: { customer: true } }, tags: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    }),
  ])

  res.json({ technicians, appointments, unassignedJobs })
}
