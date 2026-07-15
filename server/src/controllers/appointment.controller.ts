import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'
import { deriveJobStatus, isAutoManaged } from '../utils/jobStatus.js'

// Recomputes and applies the job's status from its appointments, but only
// if the job isn't in a manually-set state (CANCELED/ON_HOLD stick until an
// explicit action changes them - see jobStatus.ts).
async function syncJobStatus(jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { status: true } })
  if (!job || !isAutoManaged(job.status)) return
  const appointments = await prisma.appointment.findMany({ where: { jobId }, select: { status: true } })
  const nextStatus = deriveJobStatus(appointments)
  if (nextStatus !== job.status) {
    await prisma.job.update({ where: { id: jobId }, data: { status: nextStatus } })
  }
}

export async function listAppointmentsForJob(req: Request, res: Response) {
  const appointments = await prisma.appointment.findMany({
    where: { jobId: req.params.jobId },
    include: { technician: true },
    orderBy: { start: 'asc' },
  })
  res.json(appointments)
}

export async function listAppointmentsForTechnician(req: Request, res: Response) {
  const { from, to } = req.query
  const appointments = await prisma.appointment.findMany({
    where: {
      technicianId: req.params.technicianId,
      start: {
        gte: typeof from === 'string' ? new Date(from) : undefined,
        lte: typeof to === 'string' ? new Date(to) : undefined,
      },
    },
    include: { job: { include: { location: { include: { customer: true } } } } },
    orderBy: { start: 'asc' },
  })
  res.json(appointments)
}

export async function getAppointment(req: Request, res: Response) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: { technician: true, job: { include: { location: { include: { customer: true } } } } },
  })
  if (!appointment) throw new AppError(404, 'Appointment not found')
  res.json(appointment)
}

export async function createAppointment(req: Request, res: Response) {
  const { technicianId, start, end, notes } = req.body
  if (!start || !end) throw new AppError(400, 'start and end are required')

  const job = await prisma.job.findUnique({ where: { id: req.params.jobId } })
  if (!job) throw new AppError(404, 'Job not found')

  const appointment = await prisma.appointment.create({
    data: {
      jobId: req.params.jobId,
      technicianId,
      start: new Date(start),
      end: new Date(end),
      notes,
    },
  })
  await syncJobStatus(req.params.jobId)
  res.status(201).json(appointment)
}

export async function updateAppointment(req: Request, res: Response) {
  const { technicianId, start, end, status, notes } = req.body
  const appointment = await prisma.appointment.update({
    where: { id: req.params.id },
    data: {
      technicianId,
      start: start ? new Date(start) : undefined,
      end: end ? new Date(end) : undefined,
      status,
      notes,
    },
  })
  await syncJobStatus(appointment.jobId)
  res.json(appointment)
}

export async function deleteAppointment(req: Request, res: Response) {
  const appointment = await prisma.appointment.delete({ where: { id: req.params.id } })
  await syncJobStatus(appointment.jobId)
  res.status(204).send()
}
