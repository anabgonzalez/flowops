import type { CookieOptions } from 'express'

const IS_PROD = process.env.NODE_ENV === 'production'

// Client and API are deployed on different onrender.com subdomains, which
// the Public Suffix List treats as different sites - cross-site cookies
// need SameSite=None (and therefore Secure). Locally, client/server differ
// only by port, which SameSite doesn't care about, so Lax is fine there.
export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? 'none' : 'lax',
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000,
}
