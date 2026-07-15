import { useState } from 'react'
import type { PricebookCategory, PricebookItem, PricebookItemType, PricingMethod } from '../api/types'
import { Button, Input, Label, Select } from './ui'

export interface PricebookItemFormValues {
  code: string
  name: string
  description: string
  type: PricebookItemType
  categoryId: string
  cost: string
  price: string
  memberPrice: string
  addOnPrice: string
  markupPercent: string
  pricingMethod: PricingMethod
  laborRate: string
  durationMinutes: string
  unitOfMeasure: string
  taxable: boolean
  nonDiscountable: boolean
  warrantyMonths: string
  warrantyTerms: string
  vendorName: string
  vendorPartNumber: string
  imageUrl: string
}

function dollarsOrEmpty(cents: number | null) {
  return cents == null ? '' : (cents / 100).toString()
}

function toCentsOrNull(dollars: string): number | null {
  return dollars === '' ? null : Math.round(Number(dollars) * 100)
}

export function emptyPricebookItemFormValues(defaultCategoryId = ''): PricebookItemFormValues {
  return {
    code: '',
    name: '',
    description: '',
    type: 'SERVICE',
    categoryId: defaultCategoryId,
    cost: '',
    price: '',
    memberPrice: '',
    addOnPrice: '',
    markupPercent: '',
    pricingMethod: 'FLAT_RATE',
    laborRate: '',
    durationMinutes: '',
    unitOfMeasure: 'each',
    taxable: true,
    nonDiscountable: false,
    warrantyMonths: '',
    warrantyTerms: '',
    vendorName: '',
    vendorPartNumber: '',
    imageUrl: '',
  }
}

export function itemToFormValues(item: PricebookItem): PricebookItemFormValues {
  return {
    code: item.code,
    name: item.name,
    description: item.description ?? '',
    type: item.type,
    categoryId: item.categoryId ?? '',
    cost: dollarsOrEmpty(item.costCents),
    price: dollarsOrEmpty(item.priceCents),
    memberPrice: dollarsOrEmpty(item.memberPriceCents),
    addOnPrice: dollarsOrEmpty(item.addOnPriceCents),
    markupPercent: item.markupPercent?.toString() ?? '',
    pricingMethod: item.pricingMethod,
    laborRate: dollarsOrEmpty(item.laborRateCents),
    durationMinutes: item.estimatedDurationMinutes?.toString() ?? '',
    unitOfMeasure: item.unitOfMeasure,
    taxable: item.taxable,
    nonDiscountable: item.nonDiscountable,
    warrantyMonths: item.warrantyDurationMonths?.toString() ?? '',
    warrantyTerms: item.warrantyTerms ?? '',
    vendorName: item.vendorName ?? '',
    vendorPartNumber: item.vendorPartNumber ?? '',
    imageUrl: item.imageUrl ?? '',
  }
}

export function formValuesToPayload(v: PricebookItemFormValues) {
  return {
    code: v.code,
    name: v.name,
    description: v.description || null,
    type: v.type,
    categoryId: v.categoryId || null,
    costCents: toCentsOrNull(v.cost),
    priceCents: toCentsOrNull(v.price),
    memberPriceCents: toCentsOrNull(v.memberPrice),
    addOnPriceCents: toCentsOrNull(v.addOnPrice),
    markupPercent: v.markupPercent === '' ? null : Number(v.markupPercent),
    pricingMethod: v.pricingMethod,
    laborRateCents: toCentsOrNull(v.laborRate),
    estimatedDurationMinutes: v.durationMinutes === '' ? null : Number(v.durationMinutes),
    unitOfMeasure: v.unitOfMeasure,
    taxable: v.taxable,
    nonDiscountable: v.nonDiscountable,
    warrantyDurationMonths: v.warrantyMonths === '' ? null : Number(v.warrantyMonths),
    warrantyTerms: v.warrantyTerms || null,
    vendorName: v.vendorName || null,
    vendorPartNumber: v.vendorPartNumber || null,
    imageUrl: v.imageUrl || null,
  }
}

export function PricebookItemForm({
  initial,
  categories,
  keepCategoryId,
  onSave,
  onCancel,
  submitLabel = 'Save',
}: {
  initial: PricebookItemFormValues
  categories: PricebookCategory[]
  keepCategoryId?: string
  onSave: (payload: ReturnType<typeof formValuesToPayload>) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}) {
  const [v, setV] = useState(initial)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof PricebookItemFormValues>(key: K, value: PricebookItemFormValues[K]) {
    setV((prev) => ({ ...prev, [key]: value }))
  }

  function applyMarkup() {
    const costCents = toCentsOrNull(v.cost)
    const markup = Number(v.markupPercent)
    if (costCents != null && !Number.isNaN(markup)) {
      set('price', ((costCents * (1 + markup / 100)) / 100).toFixed(2))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await onSave(formValuesToPayload(v))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item')
    }
  }

  const availableCategories = categories.filter((c) => c._count.children === 0 || c.id === keepCategoryId)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Basic Info</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pbi-form-code">Task Code</Label>
            <Input id="pbi-form-code" value={v.code} onChange={(e) => set('code', e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="pbi-form-type">Type</Label>
            <Select id="pbi-form-type" value={v.type} onChange={(e) => set('type', e.target.value as PricebookItemType)}>
              <option value="SERVICE">Service</option>
              <option value="MATERIAL">Material</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
        </div>
        <div className="mt-3">
          <Label htmlFor="pbi-form-name">Name</Label>
          <Input id="pbi-form-name" value={v.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div className="mt-3">
          <Label htmlFor="pbi-form-description">Description</Label>
          <Input id="pbi-form-description" value={v.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="mt-3">
          <Label htmlFor="pbi-form-category">Category</Label>
          <Select id="pbi-form-category" value={v.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
            <option value="">Uncategorized</option>
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-slate-500">Only leaf categories (no subcategories) can hold items directly.</p>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Pricing</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pbi-form-cost">Cost ($)</Label>
            <Input id="pbi-form-cost" type="number" step="0.01" value={v.cost} onChange={(e) => set('cost', e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="pbi-form-markup">Markup (%)</Label>
            <div className="flex gap-1">
              <Input
                id="pbi-form-markup"
                type="number"
                step="0.1"
                value={v.markupPercent}
                onChange={(e) => set('markupPercent', e.target.value)}
              />
              <Button type="button" variant="secondary" onClick={applyMarkup}>
                Apply
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pbi-form-price">Price ($)</Label>
            <Input id="pbi-form-price" type="number" step="0.01" value={v.price} onChange={(e) => set('price', e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="pbi-form-member-price">Member Price ($)</Label>
            <Input
              id="pbi-form-member-price"
              type="number"
              step="0.01"
              value={v.memberPrice}
              onChange={(e) => set('memberPrice', e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3">
          <Label htmlFor="pbi-form-addon-price">Add-On Price ($)</Label>
          <Input
            id="pbi-form-addon-price"
            type="number"
            step="0.01"
            value={v.addOnPrice}
            onChange={(e) => set('addOnPrice', e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">Price when this is added onto an existing job/sale, if different.</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pbi-form-pricing-method">Pricing Method</Label>
            <Select
              id="pbi-form-pricing-method"
              value={v.pricingMethod}
              onChange={(e) => set('pricingMethod', e.target.value as PricingMethod)}
            >
              <option value="FLAT_RATE">Flat Rate</option>
              <option value="TIME_AND_MATERIALS">Time &amp; Materials</option>
            </Select>
          </div>
          {v.pricingMethod === 'TIME_AND_MATERIALS' && (
            <div>
              <Label htmlFor="pbi-form-labor-rate">Labor Rate ($/hr)</Label>
              <Input
                id="pbi-form-labor-rate"
                type="number"
                step="0.01"
                value={v.laborRate}
                onChange={(e) => set('laborRate', e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Details</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pbi-form-unit">Unit of Measure</Label>
            <Input id="pbi-form-unit" value={v.unitOfMeasure} onChange={(e) => set('unitOfMeasure', e.target.value)} placeholder="each" />
          </div>
          <div>
            <Label htmlFor="pbi-form-duration">Est. Duration (min)</Label>
            <Input
              id="pbi-form-duration"
              type="number"
              value={v.durationMinutes}
              onChange={(e) => set('durationMinutes', e.target.value)}
            />
          </div>
        </div>
        <div className="mt-2 flex gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={v.taxable} onChange={(e) => set('taxable', e.target.checked)} />
            Taxable
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={!v.nonDiscountable} onChange={(e) => set('nonDiscountable', !e.target.checked)} />
            Discountable
          </label>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Warranty</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pbi-form-warranty-months">Duration (months)</Label>
            <Input
              id="pbi-form-warranty-months"
              type="number"
              value={v.warrantyMonths}
              onChange={(e) => set('warrantyMonths', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pbi-form-warranty-terms">Terms</Label>
            <Input id="pbi-form-warranty-terms" value={v.warrantyTerms} onChange={(e) => set('warrantyTerms', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pbi-form-vendor-name">Vendor Name</Label>
            <Input id="pbi-form-vendor-name" value={v.vendorName} onChange={(e) => set('vendorName', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pbi-form-vendor-part">Vendor Part #</Label>
            <Input id="pbi-form-vendor-part" value={v.vendorPartNumber} onChange={(e) => set('vendorPartNumber', e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <Label htmlFor="pbi-form-image">Image URL</Label>
          <Input id="pbi-form-image" value={v.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit">{submitLabel}</Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
