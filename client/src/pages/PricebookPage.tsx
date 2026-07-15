import { useEffect, useState } from 'react'
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

const UNCATEGORIZED = '__uncategorized__'

export function PricebookPage() {
  const [categories, setCategories] = useState<PricebookCategory[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [items, setItems] = useState<PricebookItem[]>([])
  const [uncategorizedCount, setUncategorizedCount] = useState(0)

  const current = currentId && currentId !== UNCATEGORIZED ? (categories.find((c) => c.id === currentId) ?? null) : null
  const isUncategorizedView = currentId === UNCATEGORIZED
  const children = categories.filter((c) => c.parentId === (current ? current.id : null) && currentId !== null && !isUncategorizedView)
  const isEmptyLeafCandidate = current != null && current._count.children === 0 && current._count.items === 0
  const isRealLeaf = current != null && current._count.children === 0 && current._count.items > 0
  const showsItems = isUncategorizedView || isEmptyLeafCandidate || isRealLeaf

  // Single refresh path: reload categories (so _count is fresh, which is
  // what decides folder-vs-leaf), the uncategorized count, and - if the
  // current view shows items - the item list for that view. Every mutating
  // action calls this instead of patching individual pieces of state, so
  // a newly-created item's effect on its category's lock state is never stale.
  async function refresh() {
    const [freshCategories] = await Promise.all([
      api.get<PricebookCategory[]>('/pricebook-categories'),
      api.get<PricebookItem[]>('/pricebook-items').then((all) => setUncategorizedCount(all.filter((i) => !i.categoryId).length)),
    ])
    setCategories(freshCategories)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!showsItems) {
      setItems([])
      return
    }
    if (isUncategorizedView) {
      api.get<PricebookItem[]>('/pricebook-items').then((all) => setItems(all.filter((i) => !i.categoryId)))
    } else if (current) {
      api.get<PricebookItem[]>(`/pricebook-items?categoryId=${current.id}`).then(setItems)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, categories])

  function breadcrumb(): PricebookCategory[] {
    const path: PricebookCategory[] = []
    let node = current
    while (node) {
      path.unshift(node)
      node = categories.find((c) => c.id === node!.parentId) ?? null
    }
    return path
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Pricebook</h1>

      <nav className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <button type="button" onClick={() => setCurrentId(null)} className="cursor-pointer hover:underline">
          Pricebook
        </button>
        {breadcrumb().map((c) => (
          <span key={c.id} className="flex items-center gap-1">
            <span>/</span>
            <button type="button" onClick={() => setCurrentId(c.id)} className="cursor-pointer hover:underline">
              {c.name}
            </button>
          </span>
        ))}
        {isUncategorizedView && (
          <span className="flex items-center gap-1">
            <span>/</span>
            <span>Uncategorized</span>
          </span>
        )}
      </nav>

      {currentId === null && (
        <RootView categories={categories} uncategorizedCount={uncategorizedCount} onOpen={setCurrentId} onChange={refresh} />
      )}

      {isUncategorizedView && <LeafView categoryId={null} items={items} onChange={refresh} />}

      {current && (current._count.children > 0 || isEmptyLeafCandidate) && (
        <FolderView category={current} children={children} isEmptyLeafCandidate={isEmptyLeafCandidate} items={items} onOpen={setCurrentId} onChange={refresh} />
      )}

      {isRealLeaf && current && <LeafView categoryId={current.id} items={items} onChange={refresh} />}
    </div>
  )
}

function RootView({
  categories,
  uncategorizedCount,
  onOpen,
  onChange,
}: {
  categories: PricebookCategory[]
  uncategorizedCount: number
  onOpen: (id: string) => void
  onChange: () => void
}) {
  const topLevel = categories.filter((c) => !c.parentId)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/pricebook-categories', { name })
      setName('')
      setShowForm(false)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Select a category to browse into it.</p>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New Category'}</Button>
      </div>
      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HVAC" required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Save Category</Button>
          </form>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-2">
        {topLevel.map((c) => (
          <CategoryCard key={c.id} category={c} onClick={() => onOpen(c.id)} />
        ))}
        {uncategorizedCount > 0 && (
          <button
            type="button"
            onClick={() => onOpen(UNCATEGORIZED)}
            className="cursor-pointer rounded-md border border-dashed border-slate-300 bg-white p-4 text-left hover:border-slate-400"
          >
            <p className="font-medium text-slate-900">Uncategorized</p>
            <p className="text-sm text-slate-500">
              {uncategorizedCount} item{uncategorizedCount === 1 ? '' : 's'}
            </p>
          </button>
        )}
      </div>
      {topLevel.length === 0 && uncategorizedCount === 0 && <p className="text-sm text-slate-500">No categories yet.</p>}
    </div>
  )
}

function CategoryCard({ category, onClick }: { category: PricebookCategory; onClick: () => void }) {
  const label =
    category._count.children > 0
      ? `${category._count.children} subcategor${category._count.children === 1 ? 'y' : 'ies'}`
      : category._count.items > 0
        ? `${category._count.items} item${category._count.items === 1 ? '' : 's'}`
        : 'Empty'
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-md border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-slate-400"
    >
      <p className="font-medium text-slate-900">{category.name}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </button>
  )
}

function FolderView({
  category,
  children,
  isEmptyLeafCandidate,
  items,
  onOpen,
  onChange,
}: {
  category: PricebookCategory
  children: PricebookCategory[]
  isEmptyLeafCandidate: boolean
  items: PricebookItem[]
  onOpen: (id: string) => void
  onChange: () => void
}) {
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleCreateSubcategory(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/pricebook-categories', { name, parentId: category.id })
      setName('')
      setShowCategoryForm(false)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subcategory')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">{category.name}</h2>
        <Button onClick={() => setShowCategoryForm((s) => !s)}>{showCategoryForm ? 'Cancel' : 'New Subcategory'}</Button>
      </div>
      {showCategoryForm && (
        <Card>
          <form onSubmit={handleCreateSubcategory} className="space-y-3">
            <div>
              <Label htmlFor="subcat-name">Name</Label>
              <Input id="subcat-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Save Subcategory</Button>
          </form>
        </Card>
      )}
      {children.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {children.map((c) => (
            <CategoryCard key={c.id} category={c} onClick={() => onOpen(c.id)} />
          ))}
        </div>
      )}
      {isEmptyLeafCandidate && (
        <div className="space-y-3 border-t border-slate-100 pt-3">
          <p className="text-sm text-slate-500">
            This category is empty - add a subcategory above, or add items directly to it below. Once one exists, the
            other option locks.
          </p>
          <ItemQuickCreate categoryId={category.id} onCreated={onChange} />
          {items.length > 0 && <ItemList items={items} />}
        </div>
      )}
    </div>
  )
}

function LeafView({
  categoryId,
  items,
  onChange,
}: {
  categoryId: string | null
  items: PricebookItem[]
  onChange: () => void
}) {
  const [typeFilter, setTypeFilter] = useState<PricebookItemType | ''>('')
  const filtered = typeFilter ? items.filter((i) => i.type === typeFilter) : items

  return (
    <div className="space-y-3">
      <ItemQuickCreate categoryId={categoryId} onCreated={onChange} />
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
      {filtered.length === 0 ? <p className="text-sm text-slate-500">No items here yet.</p> : <ItemList items={filtered} />}
    </div>
  )
}

function ItemList({ items }: { items: PricebookItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link key={item.id} to={`/pricebook/${item.id}`}>
          <Card className="hover:border-slate-400">
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
        </Link>
      ))}
    </div>
  )
}

function ItemQuickCreate({ categoryId, onCreated }: { categoryId: string | null; onCreated: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<PricebookItemType>('SERVICE')
  const [cost, setCost] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
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
      setShowForm(false)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item')
    }
  }

  return (
    <div>
      <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New Item'}</Button>
      {showForm && (
        <Card className="mt-2">
          <form onSubmit={handleCreate} className="space-y-3">
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
              More fields (member price, markup, pricing method, warranty, vendor, bill of materials) are editable
              after creating the item.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Save Item</Button>
          </form>
        </Card>
      )}
    </div>
  )
}
