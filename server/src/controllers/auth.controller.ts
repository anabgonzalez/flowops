import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'
import { signToken } from '../utils/jwt.js'
import { authCookieOptions } from '../utils/cookieOptions.js'
import { Role } from '../generated/prisma/enums.js'

const MIN_PASSWORD_LENGTH = 8

function assertValidPassword(password: unknown): asserts password is string {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body
  if (!email || !password) throw new AppError(400, 'email and password are required')

  const user = await prisma.user.findUnique({ where: { email } })
  const valid = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false
  if (!user || !valid) throw new AppError(401, 'Invalid email or password')

  const token = signToken(user.id)
  res.cookie('token', token, authCookieOptions(req))
  const { passwordHash: _passwordHash, ...safeUser } = user
  res.json(safeUser)
}

export function logout(req: Request, res: Response) {
  res.clearCookie('token', authCookieOptions(req))
  res.status(204).send()
}

export function me(req: Request, res: Response) {
  res.json(req.user)
}

// Whether the one-time bootstrap flow is still open. It self-disables the
// instant any account has a password, so it can't be used to plant a
// second admin account later - only to get the very first one in.
export async function bootstrapStatus(_req: Request, res: Response) {
  const count = await prisma.user.count({ where: { passwordHash: { not: null } } })
  res.json({ available: count === 0 })
}

export async function bootstrap(req: Request, res: Response) {
  const alreadySetUp = await prisma.user.count({ where: { passwordHash: { not: null } } })
  if (alreadySetUp > 0) {
    throw new AppError(403, 'Setup already completed - ask an admin to create your account')
  }

  const { name, email, password, role } = req.body
  assertValidPassword(password)
  if (!email) throw new AppError(400, 'email is required')

  const passwordHash = await bcrypt.hash(password, 10)
  const existing = await prisma.user.findUnique({ where: { email } })

  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } })
    : await prisma.user.create({
        data: {
          name: name || email,
          email,
          role: role && role in Role ? role : Role.OWNER,
          passwordHash,
        },
      })

  const token = signToken(user.id)
  res.cookie('token', token, authCookieOptions(req))
  const { passwordHash: _passwordHash, ...safeUser } = user
  res.status(201).json(safeUser)
}
