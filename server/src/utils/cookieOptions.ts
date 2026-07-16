import type { CookieOptions, Request } from 'express'

// Deriving this from NODE_ENV turned out fragile in practice - Render's
// Blueprint sync silently failed to apply a newly-added env var (same
// issue that bit JWT_SECRET), so the server was defaulting to insecure/Lax
// cookies in prod and every fetch-based auth check on page load was losing
// the session. Deriving straight from the actual request's protocol (which
// requires `app.set('trust proxy', 1)` so req.secure reflects Render's
// X-Forwarded-Proto rather than the plain-HTTP connection to the app
// itself) can't drift out of sync with reality the way an env var can.
//
// Client and API are deployed on different onrender.com subdomains, which
// the Public Suffix List treats as different sites - cross-site cookies
// need SameSite=None (and therefore Secure, which requires HTTPS). Locally
// over plain HTTP, Secure cookies wouldn't be stored at all, so it falls
// back to Lax there (client/server differ only by port locally, which
// SameSite doesn't care about).
export function authCookieOptions(req: Request): CookieOptions {
  return {
    httpOnly: true,
    secure: req.secure,
    sameSite: req.secure ? 'none' : 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  }
}
