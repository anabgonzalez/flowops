import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function assertValidRange(startTime: string, endTime: string) {
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    throw new AppError(400, 'startTime and endTime must be in HH:mm 24-hour format')
  }
  if (startTime >= endTime) {
    throw new AppError(400, 'startTime must be before endTime')
  }
}

export async function listTimeframes(req: Request, res: Response) {
  const activeOnly = req.query.active === 'true'
  const timeframes = await prisma.timeframe.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { startTime: 'asc' },
  })
  res.json(timeframes)
}

export async function createTimeframe(req: Request, res: Response) {
  const { name, startTime, endTime } = req.body
  if (!name || !startTime || !endTime) throw new AppError(400, 'name, startTime, and endTime are required')
  assertValidRange(startTime, endTime)
  const timeframe = await prisma.timeframe.create({ data: { name, startTime, endTime } })
  res.status(201).json(timeframe)
}

export async function updateTimeframe(req: Request, res: Response) {
  const { name, startTime, endTime, active } = req.body
  if (startTime && endTime) assertValidRange(startTime, endTime)
  const timeframe = await prisma.timeframe.update({
    where: { id: req.params.id },
    data: { name, startTime, endTime, active },
  })
  res.json(timeframe)
}

export async function deleteTimeframe(req: Request, res: Response) {
  await prisma.timeframe.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
