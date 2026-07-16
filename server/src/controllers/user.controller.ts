import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'
import { sanitizePermissionsMap } from '../permissions.js'

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({ orderBy: { name: 'asc' } })
  res.json(users)
}

export async function getUser(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) throw new AppError(404, 'User not found')
  res.json(user)
}

export async function createUser(req: Request, res: Response) {
  const { name, email, phone, role } = req.body
  if (!name || !email || !role) {
    throw new AppError(400, 'name, email, and role are required')
  }
  const user = await prisma.user.create({ data: { name, email, phone, role } })
  res.status(201).json(user)
}

export async function updateUser(req: Request, res: Response) {
  const {
    name,
    email,
    phone,
    role,
    title,
    truckNumber,
    homeAddressLine1,
    homeCity,
    homeState,
    homePostalCode,
    hourlyRateCents,
    annualSalaryCents,
    commissionPercent,
    permissionOverrides,
  } = req.body

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      name,
      email,
      phone,
      role,
      title,
      truckNumber,
      homeAddressLine1,
      homeCity,
      homeState,
      homePostalCode,
      hourlyRateCents,
      annualSalaryCents,
      commissionPercent,
      // Overrides are sparse deltas from the role default - only known,
      // boolean-valued keys are kept, so a stray/typo'd key can't sneak in.
      permissionOverrides: permissionOverrides !== undefined ? sanitizePermissionsMap(permissionOverrides) : undefined,
    },
  })
  res.json(user)
}

export async function deleteUser(req: Request, res: Response) {
  await prisma.user.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
