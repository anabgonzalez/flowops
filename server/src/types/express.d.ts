import type { User } from '../generated/prisma/client.js'

declare global {
  namespace Express {
    interface Request {
      // Set by requireAuth - the current session's user, passwordHash
      // stripped. Only present on routes mounted after that middleware.
      user?: Omit<User, 'passwordHash'>
    }
  }
}

export {}
