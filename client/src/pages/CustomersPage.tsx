import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Customer, CustomerType } from '../api/types'
import { Button, Card, Input, Label, Select } from '../components/ui'

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<CustomerType>('RESIDENTIAL')
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    api
      .get<Customer[]>('/customers')
      .then(setCustomers)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/customers', { name, email: email || undefined, phone: phone || undefined, type })
      setName('')
      setEmail('')
      setPhone('')
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Customers</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New Customer'}</Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label htmlFor="cust-name">Name</Label>
              <Input id="cust-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cust-email">Email</Label>
                <Input id="cust-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cust-phone">Phone</Label>
                <Input id="cust-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="cust-type">Type</Label>
              <Select id="cust-type" value={type} onChange={(e) => setType(e.target.value as CustomerType)}>
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Save Customer</Button>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : customers.length === 0 ? (
        <p className="text-sm text-slate-500">No customers yet.</p>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <Link key={c.id} to={`/customers/${c.id}`}>
              <Card className="hover:border-slate-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-sm text-slate-500">
                      {c.email ?? c.phone ?? 'No contact info'} · {c.locations.length}{' '}
                      location{c.locations.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
