import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api, setAuthToken } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Button, Card, Input, Label } from '../components/ui'

export function LoginPage() {
  const { user, loading, login, refresh } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false)
  const [mode, setMode] = useState<'login' | 'setup'>('login')

  useEffect(() => {
    api.get<{ available: boolean }>('/auth/bootstrap-status').then((res) => {
      setBootstrapAvailable(res.available)
      if (res.available) setMode('setup')
    })
  }, [])

  if (loading) return null
  if (user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/jobs'
    return <Navigate to={from} replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-titan-500 text-sm font-bold text-white">F</span>
          <span className="text-xl font-semibold tracking-tight text-slate-900">FlowOps</span>
        </div>

        <Card>
          {mode === 'login' ? (
            <LoginForm onLoggedIn={() => navigate('/jobs')} login={login} />
          ) : (
            <SetupForm
              onSetUp={async () => {
                await refresh()
                navigate('/jobs')
              }}
            />
          )}
        </Card>

        {bootstrapAvailable && (
          <p className="text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <button type="button" onClick={() => setMode('setup')} className="cursor-pointer font-medium text-titan-600 hover:underline">
                No account set up yet? Create the first admin account
              </button>
            ) : (
              <button type="button" onClick={() => setMode('login')} className="cursor-pointer font-medium text-titan-600 hover:underline">
                Already have an account? Log in
              </button>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

function LoginForm({ onLoggedIn, login }: { onLoggedIn: () => void; login: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      onLoggedIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h1 className="text-lg font-semibold text-slate-900">Log in</h1>
      <div>
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      </div>
      <div>
        <Label htmlFor="login-password">Password</Label>
        <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        Log In
      </Button>
    </form>
  )
}

function SetupForm({ onSetUp }: { onSetUp: () => Promise<void> }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { token } = await api.post<{ token: string }>('/auth/bootstrap', { name, email, password })
      setAuthToken(token)
      await onSetUp()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up the account')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h1 className="text-lg font-semibold text-slate-900">Set up the first admin account</h1>
      <p className="text-sm text-slate-500">
        This only appears until the first account is created. If an account already exists in the technician
        directory with this email, this just sets its password.
      </p>
      <div>
        <Label htmlFor="setup-name">Name</Label>
        <Input id="setup-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>
      <div>
        <Label htmlFor="setup-email">Email</Label>
        <Input id="setup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="setup-password">Password</Label>
        <Input
          id="setup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        Create Admin Account
      </Button>
    </form>
  )
}
