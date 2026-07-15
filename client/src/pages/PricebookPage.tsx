import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { PricebookItem, PricebookItemType } from '../api/types'
import { Button, Card, formatCents, Input, Label, Select } from '../components/ui'

export function PricebookPage() {
  const [items, setItems] = useState<PricebookItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<PricebookItemType>('SERVICE')
  const [cost, setCost] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)

  function load() {
    api.get<PricebookItem[]>('/pricebook-items').then(setItems)
  }

  useEffect(load, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/pricebook-items', {
        code,
        name,
        type,
        costCents: Math.round(Number(cost) * 100),
        priceCents: Math.round(Number(price) * 100),
      })
      setCode('')
      setName('')
      setCost('')
      setPrice('')
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Pricebook</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New Item'}</Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pbi-code">Code</Label>
                <Input id="pbi-code" value={code} onChange={(e) => setCode(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="pbi-type">Type</Label>
                <Select id="pbi-type" value={type} onChange={(e) => setType(e.target.value as PricebookItemType)}>
                  <option value="SERVICE">Service</option>
                  <option value="MATERIAL">Material</option>
                  <option value="EQUIPMENT">Equipment</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="pbi-name">Name</Label>
              <Input id="pbi-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pbi-cost">Cost ($)</Label>
                <Input id="pbi-cost" type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="pbi-price">Price ($)</Label>
                <Input id="pbi-price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Save Item</Button>
          </form>
        </Card>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No pricebook items yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">
                    {item.code} · {item.type}
                  </p>
                </div>
                <p className="font-medium text-slate-900">{formatCents(item.priceCents)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
