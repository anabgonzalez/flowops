import { useEffect, useState } from 'react'
import { api } from '../api/client'

// Temporary - not behind ProtectedRoute, so it's reachable whether or not
// login is currently working. Fetches through the app's own api client (the
// same fetch() + credentials:'include' path everything else uses) so the
// result reflects the actual failure mode, not a plain browser navigation
// (which isn't subject to the same CORS/credentials rules as a fetch()).
export function DebugPage() {
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get('/auth/debug-proxy')
      .then(setResult)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
  }, [])

  return (
    <div style={{ padding: 16, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      <h1>Auth Debug</h1>
      {error && <p style={{ color: 'red' }}>Fetch error: {error}</p>}
      {result ? JSON.stringify(result, null, 2) : 'Loading...'}
    </div>
  )
}
