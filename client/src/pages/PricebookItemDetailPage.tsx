import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { PricebookCategory, PricebookItem } from '../api/types'
import { Badge, Button, Card, formatCents, Input, Label, Select } from '../components/ui'
import { itemToFormValues, PricebookItemForm } from '../components/PricebookItemForm'

export function PricebookItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<PricebookItem | null>(null)
  const [categories, setCategories] = useState<PricebookCategory[]>([])
  const [allItems, setAllItems] = useState<PricebookItem[]>([])
  const [editing, setEditing] = useState(false)

  function load() {
    if (!id) return
    api.get<PricebookItem>(`/pricebook-items/${id}`).then(setItem)
  }
  function loadCategories() {
    api.get<PricebookCategory[]>('/pricebook-categories').then(setCategories)
  }

  useEffect(load, [id])
  useEffect(() => {
    loadCategories()
    api.get<PricebookItem[]>('/pricebook-items?active=true').then(setAllItems)
  }, [])

  async function toggleActive() {
    if (!item) return
    await api.patch(`/pricebook-items/${item.id}`, { active: !item.active })
    load()
  }

  async function handleDelete() {
    if (!item) return
    if (!confirm(`Delete "${item.name}"? This can't be undone.`)) return
    await api.del(`/pricebook-items/${item.id}`)
    navigate('/pricebook')
  }

  if (!item) return <p className="text-sm text-slate-500">Loading...</p>

  return (
    <div className="space-y-6">
      <Link to="/pricebook" className="text-sm text-slate-500 hover:underline">
        &larr; Back to pricebook
      </Link>

      {editing ? (
        <Card>
          <PricebookItemForm
            initial={itemToFormValues(item)}
            categories={categories}
            keepCategoryId={item.categoryId ?? undefined}
            onSave={async (payload) => {
              await api.patch(`/pricebook-items/${item.id}`, payload)
              setEditing(false)
              load()
              loadCategories()
            }}
            onCancel={() => setEditing(false)}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{item.name}</h1>
              <p className="text-sm text-slate-500">
                {item.code} · {item.type} · {item.pricingMethod.replaceAll('_', ' ')}
                {item.category ? ` · ${item.category.name}` : ''}
              </p>
              {item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}
            </div>
            <Badge value={item.active ? 'ACTIVE' : 'INACTIVE'} />
          </div>

          {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="max-h-48 rounded-md border border-slate-200" />}

          <Card>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Pricing</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                Cost: <span className="font-medium">{formatCents(item.costCents)}</span>
              </div>
              <div>
                Price: <span className="font-medium">{formatCents(item.priceCents)}</span>
              </div>
              {item.memberPriceCents != null && (
                <div>
                  Member Price: <span className="font-medium">{formatCents(item.memberPriceCents)}</span>
                </div>
              )}
              {item.addOnPriceCents != null && (
                <div>
                  Add-On Price: <span className="font-medium">{formatCents(item.addOnPriceCents)}</span>
                </div>
              )}
              {item.markupPercent != null && (
                <div>
                  Markup: <span className="font-medium">{item.markupPercent}%</span>
                </div>
              )}
              {item.pricingMethod === 'TIME_AND_MATERIALS' && item.laborRateCents != null && (
                <div>
                  Labor Rate: <span className="font-medium">{formatCents(item.laborRateCents)}/hr</span>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Details</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                Unit: <span className="font-medium">{item.unitOfMeasure}</span>
              </div>
              {item.estimatedDurationMinutes != null && (
                <div>
                  Est. Duration: <span className="font-medium">{item.estimatedDurationMinutes} min</span>
                </div>
              )}
              <div>
                Taxable: <span className="font-medium">{item.taxable ? 'Yes' : 'No'}</span>
              </div>
              <div>
                Discountable: <span className="font-medium">{item.nonDiscountable ? 'No' : 'Yes'}</span>
              </div>
            </div>
          </Card>

          {(item.warrantyDurationMonths != null || item.warrantyTerms) && (
            <Card>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Warranty</p>
              <p className="text-sm">
                {item.warrantyDurationMonths != null && <span className="font-medium">{item.warrantyDurationMonths} months</span>}
                {item.warrantyTerms && <span className="ml-1 text-slate-600">{item.warrantyTerms}</span>}
              </p>
            </Card>
          )}

          {(item.vendorName || item.vendorPartNumber) && (
            <Card>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor</p>
              <p className="text-sm">
                {item.vendorName}
                {item.vendorPartNumber ? ` · Part #${item.vendorPartNumber}` : ''}
              </p>
            </Card>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="secondary" onClick={toggleActive}>
              {item.active ? 'Deactivate' : 'Activate'}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      )}

      {(item.type === 'SERVICE' || item.type === 'EQUIPMENT') && (
        <ComponentsSection item={item} allItems={allItems} onChange={load} />
      )}
    </div>
  )
}

function ComponentsSection({
  item,
  allItems,
  onChange,
}: {
  item: PricebookItem
  allItems: PricebookItem[]
  onChange: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [componentItemId, setComponentItemId] = useState('')
  const [quantity, setQuantity] = useState('1')

  const candidates = allItems.filter(
    (i) => i.id !== item.id && (i.type === 'MATERIAL' || i.type === 'EQUIPMENT'),
  )

  async function handleAdd() {
    if (!componentItemId) return
    await api.post(`/pricebook-items/${item.id}/components`, { componentItemId, quantity: Number(quantity) })
    setComponentItemId('')
    setQuantity('1')
    setShowForm(false)
    onChange()
  }

  async function handleRemove(componentId: string) {
    await api.del(`/pricebook-item-components/${componentId}`)
    onChange()
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Included Materials &amp; Equipment</h2>
        <Button variant="secondary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ Add'}
        </Button>
      </div>
      <p className="text-sm text-slate-500">
        Reference bill of materials for this {item.type.toLowerCase()} - what it typically takes to complete, for
        techs and job costing. Doesn't auto-add to estimates.
      </p>

      {showForm && (
        <Card>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="component-item">Item</Label>
              <Select id="component-item" value={componentItemId} onChange={(e) => setComponentItemId(e.target.value)}>
                <option value="">Select&hellip;</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-20">
              <Label htmlFor="component-qty">Qty</Label>
              <Input id="component-qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <Button type="button" onClick={handleAdd}>
              Add
            </Button>
          </div>
        </Card>
      )}

      {item.components.length === 0 ? (
        <p className="text-sm text-slate-500">No components added.</p>
      ) : (
        <div className="space-y-1">
          {item.components.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <span>
                {c.quantity}&times; {c.componentItem.name} ({c.componentItem.code})
              </span>
              <button
                type="button"
                onClick={() => handleRemove(c.id)}
                aria-label={`Remove ${c.componentItem.name}`}
                className="cursor-pointer text-slate-400 hover:text-red-600"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
