import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api/client'
import type { Customer, CustomerType } from '../api/types'
import { Button, Input, Label, Select } from './ui'

export function CustomerCombobox({
  customers,
  value,
  onSelect,
  onCreated,
}: {
  customers: Customer[]
  value: Customer | null
  onSelect: (customer: Customer) => void
  onCreated: (customer: Customer) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<CustomerType>('RESIDENTIAL')
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowCreate(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q),
    )
  }, [customers, query])

  function pick(customer: Customer) {
    onSelect(customer)
    setQuery('')
    setOpen(false)
    setShowCreate(false)
  }

  async function handleCreate() {
    setError(null)
    try {
      const customer = await api.post<Customer>('/customers', {
        name,
        email: email || undefined,
        phone: phone || undefined,
        type,
      })
      onCreated({ ...customer, locations: [] })
      setName('')
      setEmail('')
      setPhone('')
      setOpen(false)
      setShowCreate(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer')
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <Input
        value={open ? query : (value?.name ?? '')}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setQuery('')
          setOpen(true)
        }}
        placeholder="Search customers..."
      />

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          {!showCreate ? (
            <>
              <div className="max-h-48 overflow-y-auto">
                {matches.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-slate-500">No matches.</p>
                ) : (
                  matches.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => pick(c)}
                      className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-900">{c.name}</span>
                      <span className="ml-2 text-slate-500">{c.email ?? c.phone ?? ''}</span>
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="block w-full cursor-pointer border-t border-slate-100 px-3 py-2 text-left text-sm font-semibold text-titan-600 hover:bg-slate-50"
              >
                + Create new customer
              </button>
            </>
          ) : (
            // Not a <form> - this combobox is used inside the job-creation
            // form, and nested <form> elements are invalid HTML (the
            // browser routes submission to the outer form instead).
            <div className="space-y-2 p-3">
              <div>
                <Label htmlFor="new-cust-name">Name</Label>
                <Input id="new-cust-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="new-cust-email">Email</Label>
                  <Input id="new-cust-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="new-cust-phone">Phone</Label>
                  <Input id="new-cust-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="new-cust-type">Type</Label>
                <Select id="new-cust-type" value={type} onChange={(e) => setType(e.target.value as CustomerType)}>
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                </Select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="button" onClick={handleCreate} disabled={!name}>
                  Create &amp; Select
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
