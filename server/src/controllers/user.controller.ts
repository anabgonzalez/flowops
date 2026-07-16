import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import type { User } from '../generated/prisma/client.js'
import { AppError } from '../utils/AppError.js'
import { sanitizePermissionsMap } from '../permissions.js'

const MIN_PASSWORD_LENGTH = 8

function sanitizeUser(user: User) {
  const { passwordHash: _passwordHash, ...safeUser } = user
  return safeUser
}

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({ orderBy: { name: 'asc' } })
  res.json(users.map(sanitizeUser))
}

export async function getUser(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) throw new AppError(404, 'User not found')
  res.json(sanitizeUser(user))
}

export async function createUser(req: Request, res: Response) {
  const { name, email, phone, role, password } = req.body
  if (!name || !email || !role) {
    throw new AppError(400, 'name, email, and role are required')
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(400, `password is required and must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { name, email, phone, role, passwordHash } })
  res.status(201).json(sanitizeUser(user))
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
  res.json(sanitizeUser(user))
}

// Separate from updateUser so editing a profile never accidentally wipes or
// requires re-entering a password - resetting one is a deliberate action.
export async function resetPassword(req: Request, res: Response) {
  const { password } = req.body
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(400, `password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }
  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } })
  res.status(204).send()
}

export async function deleteUser(req: Request, res: Response) {
  await prisma.user.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
