import type { Request } from 'express'

// A single-cookie read is simple enough not to warrant the cookie-parser
// dependency - just split the raw header.
export function getCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return undefined
}
