import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

export async function listLocationsForCustomer(req: Request, res: Response) {
  const locations = await prisma.location.findMany({
    where: { customerId: req.params.customerId },
    orderBy: { createdAt: 'asc' },
  })
  res.json(locations)
}

export async function getLocation(req: Request, res: Response) {
  const location = await prisma.location.findUnique({ where: { id: req.params.id } })
  if (!location) throw new AppError(404, 'Location not found')
  res.json(location)
}

export async function createLocation(req: Request, res: Response) {
  const { addressLine1, addressLine2, city, state, postalCode, notes } = req.body
  if (!addressLine1 || !city || !state || !postalCode) {
    throw new AppError(400, 'addressLine1, city, state, and postalCode are required')
  }
  const customer = await prisma.customer.findUnique({ where: { id: req.params.customerId } })
  if (!customer) throw new AppError(404, 'Customer not found')

  const location = await prisma.location.create({
    data: {
      customerId: req.params.customerId,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      notes,
    },
  })
  res.status(201).json(location)
}

export async function updateLocation(req: Request, res: Response) {
  const { addressLine1, addressLine2, city, state, postalCode, notes } = req.body
  const location = await prisma.location.update({
    where: { id: req.params.id },
    data: { addressLine1, addressLine2, city, state, postalCode, notes },
  })
  res.json(location)
}

export async function deleteLocation(req: Request, res: Response) {
  await prisma.location.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
