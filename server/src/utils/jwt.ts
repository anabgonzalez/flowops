import jwt from 'jsonwebtoken'

const rawSecret = process.env.JWT_SECRET
if (!rawSecret) {
  // A missing secret must fail loudly, not silently sign tokens with a
  // guessable fallback - that would make auth decorative.
  throw new Error('JWT_SECRET environment variable is required')
}
const SECRET: string = rawSecret

const EXPIRES_IN = '30d'

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): { sub: string } | null {
  try {
    const payload = jwt.verify(token, SECRET)
    if (typeof payload === 'object' && payload !== null && typeof payload.sub === 'string') {
      return { sub: payload.sub }
    }
    return null
  } catch {
    return null
  }
}
