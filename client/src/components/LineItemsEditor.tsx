import type { PricebookItem } from '../api/types'
import { Button, Input, Label, Select } from './ui'

export interface LineItemDraft {
  pricebookItemId: string
  description: string
  quantity: number
  unitPriceDollars: string
}

export function emptyLineItem(): LineItemDraft {
  return { pricebookItemId: '', description: '', quantity: 1, unitPriceDollars: '' }
}

export function LineItemsEditor({
  lineItems,
  onChange,
  pricebookItems,
}: {
  lineItems: LineItemDraft[]
  onChange: (items: LineItemDraft[]) => void
  pricebookItems: PricebookItem[]
}) {
  function updateLine(index: number, patch: Partial<LineItemDraft>) {
    onChange(lineItems.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function pickPricebookItem(index: number, pricebookItemId: string) {
    const item = pricebookItems.find((p) => p.id === pricebookItemId)
    updateLine(index, {
      pricebookItemId,
      description: item?.name ?? '',
      unitPriceDollars: item ? (item.priceCents / 100).toString() : '',
    })
  }

  return (
    <div className="space-y-2">
      <Label>Line Items</Label>
      {lineItems.map((li, i) => (
        <div key={i} className="grid grid-cols-12 gap-2">
          <div className="col-span-3">
            <Select value={li.pricebookItemId} onChange={(e) => pickPricebookItem(i, e.target.value)}>
              <option value="">Custom&hellip;</option>
              {pricebookItems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="col-span-4">
            <Input
              placeholder="Description"
              value={li.description}
              onChange={(e) => updateLine(i, { description: e.target.value })}
              required
            />
          </div>
          <div className="col-span-2">
            <Input
              type="number"
              min="1"
              value={li.quantity}
              onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
            />
          </div>
          <div className="col-span-2">
            <Input
              type="number"
              step="0.01"
              placeholder="$"
              value={li.unitPriceDollars}
              onChange={(e) => updateLine(i, { unitPriceDollars: e.target.value })}
              required
            />
          </div>
          <div className="col-span-1 flex items-center justify-center">
            {lineItems.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(lineItems.filter((_, idx) => idx !== i))}
                aria-label="Remove line item"
                className="cursor-pointer text-slate-400 hover:text-red-600"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={() => onChange([...lineItems, emptyLineItem()])}>
        + Add Line Item
      </Button>
    </div>
  )
}
