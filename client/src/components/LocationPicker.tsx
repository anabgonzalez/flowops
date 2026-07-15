import { useState } from 'react'
import { api } from '../api/client'
import type { Customer, Location } from '../api/types'
import { Button, Card, Input, Label, Select } from './ui'

export function LocationPicker({
  customer,
  value,
  onSelect,
  onCreated,
}: {
  customer: Customer | null
  value: string
  onSelect: (locationId: string) => void
  onCreated: (location: Location) => void
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [addressLine1, setAddressLine1] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!customer) {
    return <p className="text-sm text-slate-500">Select a customer first.</p>
  }

  async function handleCreate() {
    if (!customer) return
    setError(null)
    try {
      const location = await api.post<Location>(`/customers/${customer.id}/locations`, {
        addressLine1,
        city,
        state,
        postalCode,
      })
      onCreated(location)
      setAddressLine1('')
      setCity('')
      setState('')
      setPostalCode('')
      setShowCreate(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add location')
    }
  }

  if (showCreate) {
    // Not a <form> - LocationPicker is used inside the job-creation form,
    // and nested <form> elements are invalid HTML (the browser routes
    // submission to the outer form instead).
    return (
      <Card>
        <div className="space-y-3">
          <div>
            <Label htmlFor="new-loc-address">Address</Label>
            <Input id="new-loc-address" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="new-loc-city">City</Label>
              <Input id="new-loc-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="new-loc-state">State</Label>
              <Input id="new-loc-state" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="new-loc-zip">ZIP</Label>
              <Input id="new-loc-zip" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" onClick={handleCreate} disabled={!addressLine1 || !city || !state || !postalCode}>
              Create &amp; Select
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {customer.locations.length > 0 && (
        <Select value={value} onChange={(e) => onSelect(e.target.value)} required>
          <option value="">Select a location&hellip;</option>
          {customer.locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.addressLine1}, {l.city}
            </option>
          ))}
        </Select>
      )}
      <Button type="button" variant="secondary" onClick={() => setShowCreate(true)}>
        + Add New Location
      </Button>
    </div>
  )
}
