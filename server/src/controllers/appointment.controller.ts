import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

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
  res.json(appointment)
}

export async function deleteAppointment(req: Request, res: Response) {
  await prisma.appointment.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
