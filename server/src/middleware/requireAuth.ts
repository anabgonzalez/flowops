import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { getCookie } from '../utils/cookies.js'
import { verifyToken } from '../utils/jwt.js'
import { AppError } from '../utils/AppError.js'

// Looks the user up fresh on every request (rather than trusting the JWT
// payload) so a role/permission change or account removal takes effect
// immediately instead of waiting for the token to expire.
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = getCookie(req, 'token')
  const payload = token ? verifyToken(token) : null
  if (!payload) throw new AppError(401, 'Not authenticated')

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) throw new AppError(401, 'Not authenticated')

  const { passwordHash: _passwordHash, ...safeUser } = user
  req.user = safeUser
  next()
}
