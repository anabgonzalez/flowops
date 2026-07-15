import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

export async function listContactsForLocation(req: Request, res: Response) {
  const contacts = await prisma.locationContact.findMany({
    where: { locationId: req.params.locationId },
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
  })
  res.json(contacts)
}

export async function createContact(req: Request, res: Response) {
  const { name, email, phone, role, isPrimary } = req.body
  if (!name) throw new AppError(400, 'name is required')

  const location = await prisma.location.findUnique({ where: { id: req.params.locationId } })
  if (!location) throw new AppError(404, 'Location not found')

  if (isPrimary) {
    await prisma.locationContact.updateMany({
      where: { locationId: req.params.locationId },
      data: { isPrimary: false },
    })
  }

  const contact = await prisma.locationContact.create({
    data: { locationId: req.params.locationId, name, email, phone, role, isPrimary: Boolean(isPrimary) },
  })
  res.status(201).json(contact)
}

export async function updateContact(req: Request, res: Response) {
  const { name, email, phone, role, isPrimary } = req.body

  if (isPrimary) {
    const existing = await prisma.locationContact.findUnique({ where: { id: req.params.id } })
    if (existing) {
      await prisma.locationContact.updateMany({
        where: { locationId: existing.locationId, id: { not: req.params.id } },
        data: { isPrimary: false },
      })
    }
  }

  const contact = await prisma.locationContact.update({
    where: { id: req.params.id },
    data: { name, email, phone, role, isPrimary },
  })
  res.json(contact)
}

export async function deleteContact(req: Request, res: Response) {
  await prisma.locationContact.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
