import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, ApiError, getAuthToken, setAuthToken } from '../api/client'
import type { User } from '../api/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const tokenAtStart = getAuthToken()
    if (!tokenAtStart) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await api.get<User>('/auth/me')
      setUser(me)
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        console.error(err)
      }
      // The token is about to be wiped, which erases the evidence of why -
      // record it first so a diagnostic page can show what actually
      // happened instead of just "token: NO" after the fact.
      sessionStorage.setItem(
        'last_auth_failure',
        JSON.stringify({
          at: new Date().toISOString(),
          tokenLength: tokenAtStart.length,
          tokenPrefix: tokenAtStart.slice(0, 12),
          status: err instanceof ApiError ? err.status : null,
          message: err instanceof Error ? err.message : String(err),
        }),
      )
      setAuthToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function login(email: string, password: string) {
    const response = await api.post<Record<string, unknown>>('/auth/login', { email, password })
    // Diagnostic: if the API is running stale code that predates the
    // Bearer-token switch, `token` won't be in this response at all -
    // record what actually came back so that's visible without dev tools.
    sessionStorage.setItem('last_login_response_keys', JSON.stringify(Object.keys(response)))
    const { token, ...me } = response as unknown as User & { token: string }
    setAuthToken(token)
    setUser(me)
  }

  function logout() {
    setAuthToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
