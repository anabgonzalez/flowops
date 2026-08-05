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
    const { token, ...me } = await api.post<User & { token: string }>('/auth/login', { email, password })
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
