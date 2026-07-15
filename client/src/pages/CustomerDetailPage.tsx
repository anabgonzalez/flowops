import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { ContactRole, Customer, CustomerType, Location, LocationContact, Tag } from '../api/types'
import { Button, Card, Input, Label, Select, TagChip } from '../components/ui'
import { TagPicker } from '../components/TagPicker'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerTags, setCustomerTags] = useState<Tag[]>([])
  const [locationTags, setLocationTags] = useState<Tag[]>([])
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
  useEffect(() => {
    api.get<Tag[]>('/tags?category=CUSTOMER&active=true').then(setCustomerTags)
    api.get<Tag[]>('/tags?category=LOCATION&active=true').then(setLocationTags)
  }, [])

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
      <CustomerHeader customer={customer} availableTags={customerTags} onChange={load} />

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
            <LocationCard
              key={loc.id}
              location={loc}
              availableTags={locationTags}
              onChange={load}
              onNewJob={() => navigate(`/jobs?newForLocation=${loc.id}`)}
            />
          ))}
        </div>
      )}

      <Link to="/customers" className="text-sm text-slate-500 hover:underline">
        &larr; Back to customers
      </Link>
    </div>
  )
}

function CustomerHeader({
  customer,
  availableTags,
  onChange,
}: {
  customer: Customer
  availableTags: Tag[]
  onChange: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(customer.name)
  const [email, setEmail] = useState(customer.email ?? '')
  const [phone, setPhone] = useState(customer.phone ?? '')
  const [type, setType] = useState<CustomerType>(customer.type)
  const [tagIds, setTagIds] = useState<string[]>(customer.tags.map((t) => t.id))
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setName(customer.name)
    setEmail(customer.email ?? '')
    setPhone(customer.phone ?? '')
    setType(customer.type)
    setTagIds(customer.tags.map((t) => t.id))
    setError(null)
    setEditing(true)
  }

  async function handleSave() {
    setError(null)
    try {
      await api.patch(`/customers/${customer.id}`, {
        name,
        email: email || undefined,
        phone: phone || undefined,
        type,
        tagIds,
      })
      setEditing(false)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer')
    }
  }

  if (editing) {
    return (
      <Card>
        <div className="space-y-3">
          <div>
            <Label htmlFor="edit-cust-name">Name</Label>
            <Input id="edit-cust-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-cust-email">Email</Label>
              <Input id="edit-cust-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-cust-phone">Phone</Label>
              <Input id="edit-cust-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-cust-type">Type</Label>
            <Select id="edit-cust-type" value={type} onChange={(e) => setType(e.target.value as CustomerType)}>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
            </Select>
          </div>
          <div>
            <Label>Tags</Label>
            <TagPicker availableTags={availableTags} selectedIds={tagIds} onChange={setTagIds} placeholder="Search customer tags..." />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save</Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">{customer.name}</h1>
      <p className="text-sm text-slate-500">{customer.email ?? customer.phone ?? 'No contact info'}</p>
      {customer.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {customer.tags.map((t) => (
            <TagChip key={t.id} name={t.name} color={t.color} />
          ))}
        </div>
      )}
      <button type="button" onClick={startEdit} className="mt-2 cursor-pointer text-sm font-medium text-titan-600 hover:underline">
        Edit customer
      </button>
    </div>
  )
}

function LocationCard({
  location,
  availableTags,
  onChange,
  onNewJob,
}: {
  location: Location
  availableTags: Tag[]
  onChange: () => void
  onNewJob: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [addressLine1, setAddressLine1] = useState(location.addressLine1)
  const [city, setCity] = useState(location.city)
  const [state, setState] = useState(location.state)
  const [postalCode, setPostalCode] = useState(location.postalCode)
  const [tagIds, setTagIds] = useState<string[]>(location.tags.map((t) => t.id))
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setAddressLine1(location.addressLine1)
    setCity(location.city)
    setState(location.state)
    setPostalCode(location.postalCode)
    setTagIds(location.tags.map((t) => t.id))
    setError(null)
    setEditing(true)
  }

  async function handleSave() {
    setError(null)
    try {
      await api.patch(`/locations/${location.id}`, { addressLine1, city, state, postalCode, tagIds })
      setEditing(false)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save location')
    }
  }

  return (
    <Card>
      {editing ? (
        <div className="space-y-3">
          <div>
            <Label htmlFor={`edit-loc-address-${location.id}`}>Address</Label>
            <Input id={`edit-loc-address-${location.id}`} value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor={`edit-loc-city-${location.id}`}>City</Label>
              <Input id={`edit-loc-city-${location.id}`} value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label htmlFor={`edit-loc-state-${location.id}`}>State</Label>
              <Input id={`edit-loc-state-${location.id}`} value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div>
              <Label htmlFor={`edit-loc-zip-${location.id}`}>ZIP</Label>
              <Input id={`edit-loc-zip-${location.id}`} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Tags</Label>
            <TagPicker availableTags={availableTags} selectedIds={tagIds} onChange={setTagIds} placeholder="Search location tags..." />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save</Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-slate-900">{location.addressLine1}</p>
              <p className="text-sm text-slate-500">
                {location.city}, {location.state} {location.postalCode}
              </p>
              {location.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {location.tags.map((t) => (
                    <TagChip key={t.id} name={t.name} color={t.color} />
                  ))}
                </div>
              )}
              <button type="button" onClick={startEdit} className="mt-2 cursor-pointer text-sm font-medium text-titan-600 hover:underline">
                Edit
              </button>
            </div>
            <Button variant="secondary" onClick={onNewJob}>
              New Job Here
            </Button>
          </div>
          <ContactsSection location={location} onChange={onChange} />
        </>
      )}
    </Card>
  )
}

const roleLabels: Record<ContactRole, string> = {
  TENANT: 'Tenant',
  PROPERTY_MANAGER: 'Property Manager',
  OTHER: 'Contact',
}

function ContactsSection({ location, onChange }: { location: Location; onChange: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ContactRole>('TENANT')
  const [isPrimary, setIsPrimary] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setError(null)
    try {
      await api.post(`/locations/${location.id}/contacts`, {
        name,
        phone: phone || undefined,
        email: email || undefined,
        role,
        isPrimary,
      })
      setName('')
      setPhone('')
      setEmail('')
      setRole('TENANT')
      setIsPrimary(false)
      setShowForm(false)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact')
    }
  }

  async function handleDelete(contact: LocationContact) {
    await api.del(`/location-contacts/${contact.id}`)
    onChange()
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">On-Site Contacts</p>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="cursor-pointer text-sm font-medium text-titan-600 hover:underline"
        >
          {showForm ? 'Cancel' : '+ Add Contact'}
        </button>
      </div>

      {showForm && (
        <div className="mt-2 space-y-2 rounded-md bg-slate-50 p-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor={`contact-name-${location.id}`}>Name</Label>
              <Input id={`contact-name-${location.id}`} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor={`contact-role-${location.id}`}>Role</Label>
              <Select id={`contact-role-${location.id}`} value={role} onChange={(e) => setRole(e.target.value as ContactRole)}>
                <option value="TENANT">Tenant</option>
                <option value="PROPERTY_MANAGER">Property Manager</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor={`contact-phone-${location.id}`}>Phone</Label>
              <Input id={`contact-phone-${location.id}`} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor={`contact-email-${location.id}`}>Email</Label>
              <Input id={`contact-email-${location.id}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
            Primary contact for scheduling
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="button" onClick={handleCreate} disabled={!name}>
            Save Contact
          </Button>
        </div>
      )}

      {location.contacts.length > 0 && (
        <div className="mt-2 space-y-1">
          {location.contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-slate-900">{c.name}</span>{' '}
                <span className="text-slate-500">
                  &middot; {roleLabels[c.role]}
                  {c.isPrimary ? ' · Primary' : ''}
                  {c.phone ? ` · ${c.phone}` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(c)}
                aria-label={`Remove ${c.name}`}
                className="cursor-pointer text-slate-400 hover:text-red-600"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
