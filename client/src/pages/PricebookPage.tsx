import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { PricebookCategory, PricebookItem, PricebookItemType } from '../api/types'
import { Button, Card, formatCents, Input, Label, Select } from '../components/ui'

const TYPES: { value: PricebookItemType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'SERVICE', label: 'Services' },
  { value: 'MATERIAL', label: 'Materials' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'OTHER', label: 'Other' },
]

function categoryLabel(category: PricebookCategory, all: PricebookCategory[]): string {
  const parent = all.find((c) => c.id === category.parentId)
  return parent ? `${parent.name} > ${category.name}` : category.name
}

export function PricebookPage() {
  const [items, setItems] = useState<PricebookItem[]>([])
  const [categories, setCategories] = useState<PricebookCategory[]>([])
  const [typeFilter, setTypeFilter] = useState<PricebookItemType | ''>('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [showItemForm, setShowItemForm] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<PricebookItemType>('SERVICE')
  const [categoryId, setCategoryId] = useState('')
  const [cost, setCost] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [parentId, setParentId] = useState('')

  function loadItems() {
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    if (categoryFilter) params.set('categoryId', categoryFilter)
    api.get<PricebookItem[]>(`/pricebook-items?${params}`).then(setItems)
  }
  function loadCategories() {
    api.get<PricebookCategory[]>('/pricebook-categories').then(setCategories)
  }

  useEffect(loadItems, [typeFilter, categoryFilter])
  useEffect(loadCategories, [])

  const topLevelCategories = useMemo(() => categories.filter((c) => !c.parentId), [categories])

  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/pricebook-items', {
        code,
        name,
        type,
        categoryId: categoryId || undefined,
        costCents: Math.round(Number(cost) * 100),
        priceCents: Math.round(Number(price) * 100),
      })
      setCode('')
      setName('')
      setCost('')
      setPrice('')
      setCategoryId('')
      setShowItemForm(false)
      loadItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item')
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.post('/pricebook-categories', { name: categoryName, parentId: parentId || undefined })
      setCategoryName('')
      setParentId('')
      setShowCategoryForm(false)
      loadCategories()
    } catch {
      // category name conflicts are rare enough not to need dedicated UI handling
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Pricebook</h1>
        <Button onClick={() => setShowItemForm((s) => !s)}>{showItemForm ? 'Cancel' : 'New Item'}</Button>
      </div>

      {showItemForm && (
        <Card>
          <form onSubmit={handleCreateItem} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pbi-code">Task Code</Label>
                <Input id="pbi-code" value={code} onChange={(e) => setCode(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="pbi-type">Type</Label>
                <Select id="pbi-type" value={type} onChange={(e) => setType(e.target.value as PricebookItemType)}>
                  <option value="SERVICE">Service</option>
                  <option value="MATERIAL">Material</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="pbi-name">Name</Label>
              <Input id="pbi-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="pbi-category">Category</Label>
              <Select id="pbi-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {categoryLabel(c, categories)}
                  </option>
                ))}
              </Select>
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
            <p className="text-xs text-slate-500">
              More fields (member price, markup, pricing method, warranty, vendor, bill of materials, and more) are
              editable after creating the item.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Save Item</Button>
          </form>
        </Card>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-slate-900">Categories</h2>
          <Button variant="secondary" onClick={() => setShowCategoryForm((s) => !s)}>
            {showCategoryForm ? 'Cancel' : 'New Category'}
          </Button>
        </div>
        {showCategoryForm && (
          <Card>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <Label htmlFor="cat-name">Name</Label>
                <Input id="cat-name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="cat-parent">Parent Category (optional)</Label>
                <Select id="cat-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                  <option value="">None (top-level)</option>
                  {topLevelCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="submit">Save Category</Button>
            </form>
          </Card>
        )}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryFilter(categoryFilter === c.id ? '' : c.id)}
                className={`cursor-pointer rounded-full px-2 py-0.5 text-xs font-semibold ${
                  categoryFilter === c.id ? 'bg-titan-500 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {categoryLabel(c, categories)}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-1">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTypeFilter(t.value)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium ${
              typeFilter === t.value ? 'bg-navy-950 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No pricebook items yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link key={item.id} to={`/pricebook/${item.id}`}>
              <Card className="hover:border-slate-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">
                      {item.code} · {item.type}
                      {item.category ? ` · ${categoryLabel(item.category, categories)}` : ''}
                    </p>
                  </div>
                  <p className="font-medium text-slate-900">{formatCents(item.priceCents)}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
