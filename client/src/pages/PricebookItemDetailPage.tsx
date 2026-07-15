import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { PricebookCategory, PricebookItem, PricebookItemType, PricingMethod } from '../api/types'
import { Badge, Button, Card, formatCents, Input, Label, Select } from '../components/ui'

function dollarsOrEmpty(cents: number | null) {
  return cents == null ? '' : (cents / 100).toString()
}

function toCentsOrNull(dollars: string): number | null {
  return dollars === '' ? null : Math.round(Number(dollars) * 100)
}

export function PricebookItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<PricebookItem | null>(null)
  const [categories, setCategories] = useState<PricebookCategory[]>([])
  const [allItems, setAllItems] = useState<PricebookItem[]>([])

  function load() {
    if (!id) return
    api.get<PricebookItem>(`/pricebook-items/${id}`).then(setItem)
  }

  useEffect(load, [id])
  useEffect(() => {
    api.get<PricebookCategory[]>('/pricebook-categories').then(setCategories)
    api.get<PricebookItem[]>('/pricebook-items?active=true').then(setAllItems)
  }, [])

  if (!item) return <p className="text-sm text-slate-500">Loading...</p>

  return (
    <div className="space-y-6">
      <Link to="/pricebook" className="text-sm text-slate-500 hover:underline">
        &larr; Back to pricebook
      </Link>
      <ItemForm item={item} categories={categories} onChange={load} />
      {(item.type === 'SERVICE' || item.type === 'EQUIPMENT') && (
        <ComponentsSection item={item} allItems={allItems} onChange={load} />
      )}
    </div>
  )
}

function ItemForm({
  item,
  categories,
  onChange,
}: {
  item: PricebookItem
  categories: PricebookCategory[]
  onChange: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [code, setCode] = useState(item.code)
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description ?? '')
  const [type, setType] = useState<PricebookItemType>(item.type)
  const [categoryId, setCategoryId] = useState(item.categoryId ?? '')
  const [cost, setCost] = useState(dollarsOrEmpty(item.costCents))
  const [price, setPrice] = useState(dollarsOrEmpty(item.priceCents))
  const [memberPrice, setMemberPrice] = useState(dollarsOrEmpty(item.memberPriceCents))
  const [addOnPrice, setAddOnPrice] = useState(dollarsOrEmpty(item.addOnPriceCents))
  const [markupPercent, setMarkupPercent] = useState(item.markupPercent?.toString() ?? '')
  const [pricingMethod, setPricingMethod] = useState<PricingMethod>(item.pricingMethod)
  const [laborRate, setLaborRate] = useState(dollarsOrEmpty(item.laborRateCents))
  const [durationMinutes, setDurationMinutes] = useState(item.estimatedDurationMinutes?.toString() ?? '')
  const [unitOfMeasure, setUnitOfMeasure] = useState(item.unitOfMeasure)
  const [taxable, setTaxable] = useState(item.taxable)
  const [nonDiscountable, setNonDiscountable] = useState(item.nonDiscountable)
  const [warrantyMonths, setWarrantyMonths] = useState(item.warrantyDurationMonths?.toString() ?? '')
  const [warrantyTerms, setWarrantyTerms] = useState(item.warrantyTerms ?? '')
  const [vendorName, setVendorName] = useState(item.vendorName ?? '')
  const [vendorPartNumber, setVendorPartNumber] = useState(item.vendorPartNumber ?? '')
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? '')
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setCode(item.code)
    setName(item.name)
    setDescription(item.description ?? '')
    setType(item.type)
    setCategoryId(item.categoryId ?? '')
    setCost(dollarsOrEmpty(item.costCents))
    setPrice(dollarsOrEmpty(item.priceCents))
    setMemberPrice(dollarsOrEmpty(item.memberPriceCents))
    setAddOnPrice(dollarsOrEmpty(item.addOnPriceCents))
    setMarkupPercent(item.markupPercent?.toString() ?? '')
    setPricingMethod(item.pricingMethod)
    setLaborRate(dollarsOrEmpty(item.laborRateCents))
    setDurationMinutes(item.estimatedDurationMinutes?.toString() ?? '')
    setUnitOfMeasure(item.unitOfMeasure)
    setTaxable(item.taxable)
    setNonDiscountable(item.nonDiscountable)
    setWarrantyMonths(item.warrantyDurationMonths?.toString() ?? '')
    setWarrantyTerms(item.warrantyTerms ?? '')
    setVendorName(item.vendorName ?? '')
    setVendorPartNumber(item.vendorPartNumber ?? '')
    setImageUrl(item.imageUrl ?? '')
    setError(null)
    setEditing(true)
  }

  function applyMarkup() {
    const costCents = toCentsOrNull(cost)
    const markup = Number(markupPercent)
    if (costCents != null && !Number.isNaN(markup)) {
      setPrice(((costCents * (1 + markup / 100)) / 100).toFixed(2))
    }
  }

  async function handleSave() {
    setError(null)
    try {
      await api.patch(`/pricebook-items/${item.id}`, {
        code,
        name,
        description: description || null,
        type,
        categoryId: categoryId || null,
        costCents: toCentsOrNull(cost),
        priceCents: toCentsOrNull(price),
        memberPriceCents: toCentsOrNull(memberPrice),
        addOnPriceCents: toCentsOrNull(addOnPrice),
        markupPercent: markupPercent === '' ? null : Number(markupPercent),
        pricingMethod,
        laborRateCents: toCentsOrNull(laborRate),
        estimatedDurationMinutes: durationMinutes === '' ? null : Number(durationMinutes),
        unitOfMeasure,
        taxable,
        nonDiscountable,
        warrantyDurationMonths: warrantyMonths === '' ? null : Number(warrantyMonths),
        warrantyTerms: warrantyTerms || null,
        vendorName: vendorName || null,
        vendorPartNumber: vendorPartNumber || null,
        imageUrl: imageUrl || null,
      })
      setEditing(false)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item')
    }
  }

  async function toggleActive() {
    await api.patch(`/pricebook-items/${item.id}`, { active: !item.active })
    onChange()
  }

  if (!editing) {
    return (
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

        <div className="flex gap-2">
          <Button onClick={startEdit}>Edit</Button>
          <Button variant="secondary" onClick={toggleActive}>
            {item.active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Basic Info</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-pbi-code">Task Code</Label>
              <Input id="edit-pbi-code" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-pbi-type">Type</Label>
              <Select id="edit-pbi-type" value={type} onChange={(e) => setType(e.target.value as PricebookItemType)}>
                <option value="SERVICE">Service</option>
                <option value="MATERIAL">Material</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
          </div>
          <div className="mt-3">
            <Label htmlFor="edit-pbi-name">Name</Label>
            <Input id="edit-pbi-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="mt-3">
            <Label htmlFor="edit-pbi-description">Description</Label>
            <Input id="edit-pbi-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="mt-3">
            <Label htmlFor="edit-pbi-category">Category</Label>
            <Select id="edit-pbi-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Pricing</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-pbi-cost">Cost ($)</Label>
              <Input id="edit-pbi-cost" type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-pbi-markup">Markup (%)</Label>
              <div className="flex gap-1">
                <Input
                  id="edit-pbi-markup"
                  type="number"
                  step="0.1"
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={applyMarkup}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-pbi-price">Price ($)</Label>
              <Input id="edit-pbi-price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-pbi-member-price">Member Price ($)</Label>
              <Input
                id="edit-pbi-member-price"
                type="number"
                step="0.01"
                value={memberPrice}
                onChange={(e) => setMemberPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3">
            <Label htmlFor="edit-pbi-addon-price">Add-On Price ($)</Label>
            <Input
              id="edit-pbi-addon-price"
              type="number"
              step="0.01"
              value={addOnPrice}
              onChange={(e) => setAddOnPrice(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">Price when this is added onto an existing job/sale, if different.</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-pbi-pricing-method">Pricing Method</Label>
              <Select
                id="edit-pbi-pricing-method"
                value={pricingMethod}
                onChange={(e) => setPricingMethod(e.target.value as PricingMethod)}
              >
                <option value="FLAT_RATE">Flat Rate</option>
                <option value="TIME_AND_MATERIALS">Time &amp; Materials</option>
              </Select>
            </div>
            {pricingMethod === 'TIME_AND_MATERIALS' && (
              <div>
                <Label htmlFor="edit-pbi-labor-rate">Labor Rate ($/hr)</Label>
                <Input
                  id="edit-pbi-labor-rate"
                  type="number"
                  step="0.01"
                  value={laborRate}
                  onChange={(e) => setLaborRate(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-pbi-unit">Unit of Measure</Label>
              <Input id="edit-pbi-unit" value={unitOfMeasure} onChange={(e) => setUnitOfMeasure(e.target.value)} placeholder="each" />
            </div>
            <div>
              <Label htmlFor="edit-pbi-duration">Est. Duration (min)</Label>
              <Input
                id="edit-pbi-duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-2 flex gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={taxable} onChange={(e) => setTaxable(e.target.checked)} />
              Taxable
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={!nonDiscountable} onChange={(e) => setNonDiscountable(!e.target.checked)} />
              Discountable
            </label>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Warranty</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-pbi-warranty-months">Duration (months)</Label>
              <Input
                id="edit-pbi-warranty-months"
                type="number"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-pbi-warranty-terms">Terms</Label>
              <Input id="edit-pbi-warranty-terms" value={warrantyTerms} onChange={(e) => setWarrantyTerms(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-pbi-vendor-name">Vendor Name</Label>
              <Input id="edit-pbi-vendor-name" value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-pbi-vendor-part">Vendor Part #</Label>
              <Input id="edit-pbi-vendor-part" value={vendorPartNumber} onChange={(e) => setVendorPartNumber(e.target.value)} />
            </div>
          </div>
          <div className="mt-3">
            <Label htmlFor="edit-pbi-image">Image URL</Label>
            <Input id="edit-pbi-image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
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
