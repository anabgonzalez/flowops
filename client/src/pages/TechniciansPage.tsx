import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Role, User } from '../api/types'
import { Badge, Button, Card, Input, Label, Select } from '../components/ui'

export function TechniciansPage() {
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('TECHNICIAN')
  const [error, setError] = useState<string | null>(null)

  function load() {
    api.get<User[]>('/users').then(setUsers)
  }

  useEffect(load, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/users', { name, email, role, password })
      setName('')
      setEmail('')
      setPassword('')
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add team member')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Technicians &amp; Staff</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New Team Member'}</Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label htmlFor="tech-name">Name</Label>
              <Input id="tech-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="tech-email">Email</Label>
              <Input id="tech-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="tech-password">Password</Label>
              <Input
                id="tech-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div>
              <Label htmlFor="tech-role">Role</Label>
              <Select id="tech-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="TECHNICIAN">Technician</option>
                <option value="DISPATCHER">Dispatcher</option>
                <option value="CSR">CSR</option>
                <option value="SALES_REP">Sales Rep</option>
                <option value="ADMIN">Admin</option>
                <option value="OWNER">Owner</option>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Save</Button>
          </form>
        </Card>
      )}

      {users.length === 0 ? (
        <p className="text-sm text-slate-500">No team members yet.</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Link key={u.id} to={`/technicians/${u.id}`}>
              <Card className="hover:border-slate-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{u.name}</p>
                    <p className="text-sm text-slate-500">{u.email}</p>
                  </div>
                  <Badge value={u.role} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
