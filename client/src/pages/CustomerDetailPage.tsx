import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Customer } from '../api/types'
import { Button, Card, Input, Label } from '../components/ui'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [addressLine1, setAddressLine1] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  function load() {
    if (!id) return
    api.get<Customer>(`/customers/${id}`).then(setCustomer)
  }

  useEffect(load, [id])

  async function handleAddLocation(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setError(null)
    try {
      await api.post(`/customers/${id}/locations`, { addressLine1, city, state, postalCode })
      setAddressLine1('')
      setCity('')
      setState('')
      setPostalCode('')
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add location')
    }
  }

  if (!customer) return <p className="text-sm text-slate-500">Loading...</p>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{customer.name}</h1>
        <p className="text-sm text-slate-500">{customer.email ?? customer.phone ?? 'No contact info'}</p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Locations</h2>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'Add Location'}</Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleAddLocation} className="space-y-3">
            <div>
              <Label htmlFor="loc-address">Address</Label>
              <Input id="loc-address" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="loc-city">City</Label>
                <Input id="loc-city" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="loc-state">State</Label>
                <Input id="loc-state" value={state} onChange={(e) => setState(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="loc-zip">ZIP</Label>
                <Input id="loc-zip" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Save Location</Button>
          </form>
        </Card>
      )}

      {customer.locations.length === 0 ? (
        <p className="text-sm text-slate-500">No locations yet.</p>
      ) : (
        <div className="space-y-2">
          {customer.locations.map((loc) => (
            <Card key={loc.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{loc.addressLine1}</p>
                  <p className="text-sm text-slate-500">
                    {loc.city}, {loc.state} {loc.postalCode}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => navigate(`/jobs?newForLocation=${loc.id}`)}>
                  New Job Here
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Link to="/customers" className="text-sm text-slate-500 hover:underline">
        &larr; Back to customers
      </Link>
    </div>
  )
}
