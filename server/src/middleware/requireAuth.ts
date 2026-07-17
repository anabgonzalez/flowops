import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { verifyToken } from '../utils/jwt.js'
import { AppError } from '../utils/AppError.js'

// Bearer token in the Authorization header, not a cookie - the client and
// API are on different domains, and mobile Safari (and increasingly other
// browsers) blocks cross-site cookies outright regardless of how correctly
// SameSite/Secure are configured. A token the app attaches itself sidesteps
// that policy entirely since it isn't a cookie.
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined
  const payload = token ? verifyToken(token) : null
  if (!payload) throw new AppError(401, 'Not authenticated')

  // Looks the user up fresh on every request (rather than trusting the JWT
  // payload) so a role/permission change or account removal takes effect
  // immediately instead of waiting for the token to expire.
  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) throw new AppError(401, 'Not authenticated')

  const { passwordHash: _passwordHash, ...safeUser } = user
  req.user = safeUser
  next()
}
