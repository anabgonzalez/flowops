import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { PricebookCategory, PricebookItem, PricebookItemType } from '../api/types'
import { Button, Card, formatCents, Input, Label, Select } from '../components/ui'
import { emptyPricebookItemFormValues, PricebookItemForm } from '../components/PricebookItemForm'

const TYPES: { value: PricebookItemType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'SERVICE', label: 'Services' },
  { value: 'MATERIAL', label: 'Materials' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'OTHER', label: 'Other' },
]

const UNCATEGORIZED = '__uncategorized__'

function categoryPath(category: PricebookCategory, all: PricebookCategory[]): string {
  const parent = all.find((c) => c.id === category.parentId)
  return parent ? `${parent.name} > ${category.name}` : category.name
}

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
  // action (create, move, delete) calls this instead of patching individual
  // pieces of state, so a category's lock state is never stale.
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

      {isUncategorizedView && <LeafView categoryId={null} items={items} categories={categories} onChange={refresh} />}

      {current && (current._count.children > 0 || isEmptyLeafCandidate) && (
        <FolderView
          category={current}
          children={children}
          isEmptyLeafCandidate={isEmptyLeafCandidate}
          items={items}
          categories={categories}
          onOpen={setCurrentId}
          onChange={refresh}
        />
      )}

      {isRealLeaf && current && <LeafView categoryId={current.id} items={items} categories={categories} onChange={refresh} />}
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
  categories,
  onOpen,
  onChange,
}: {
  category: PricebookCategory
  children: PricebookCategory[]
  isEmptyLeafCandidate: boolean
  items: PricebookItem[]
  categories: PricebookCategory[]
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
            This category is empty - add a subcategory above, or add an item directly to it below. Once one exists,
            the other option locks.
          </p>
          <ItemCreateCard categoryId={category.id} categories={categories} onCreated={onChange} />
          {items.length > 0 && <ItemList items={items} categories={categories} onChange={onChange} />}
        </div>
      )}
    </div>
  )
}

function LeafView({
  categoryId,
  items,
  categories,
  onChange,
}: {
  categoryId: string | null
  items: PricebookItem[]
  categories: PricebookCategory[]
  onChange: () => void
}) {
  const [typeFilter, setTypeFilter] = useState<PricebookItemType | ''>('')
  const filtered = typeFilter ? items.filter((i) => i.type === typeFilter) : items

  return (
    <div className="space-y-3">
      <ItemCreateCard categoryId={categoryId} categories={categories} onCreated={onChange} />
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
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No items here yet.</p>
      ) : (
        <ItemList items={filtered} categories={categories} onChange={onChange} />
      )}
    </div>
  )
}

function ItemList({
  items,
  categories,
  onChange,
}: {
  items: PricebookItem[]
  categories: PricebookCategory[]
  onChange: () => void
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <ItemRow key={item.id} item={item} categories={categories} onChange={onChange} />
      ))}
    </div>
  )
}

function ItemRow({
  item,
  categories,
  onChange,
}: {
  item: PricebookItem
  categories: PricebookCategory[]
  onChange: () => void
}) {
  const [showMove, setShowMove] = useState(false)
  const [targetCategoryId, setTargetCategoryId] = useState(item.categoryId ?? '')
  const [error, setError] = useState<string | null>(null)

  const moveTargets = categories.filter((c) => c._count.children === 0 && c.id !== item.categoryId)

  async function handleMove() {
    setError(null)
    try {
      await api.patch(`/pricebook-items/${item.id}`, { categoryId: targetCategoryId || null })
      setShowMove(false)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move item')
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.name}"? This can't be undone.`)) return
    await api.del(`/pricebook-items/${item.id}`)
    onChange()
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <Link to={`/pricebook/${item.id}`} className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900">{item.name}</p>
          <p className="text-sm text-slate-500">
            {item.code} · {item.type}
          </p>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          <p className="font-medium text-slate-900">{formatCents(item.priceCents)}</p>
          <button
            type="button"
            onClick={() => setShowMove((s) => !s)}
            className="cursor-pointer text-sm font-medium text-titan-600 hover:underline"
          >
            {showMove ? 'Cancel' : 'Move'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label={`Delete ${item.name}`}
            className="cursor-pointer text-slate-400 hover:text-red-600"
          >
            &times;
          </button>
        </div>
      </div>
      {showMove && (
        <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
          <Select value={targetCategoryId} onChange={(e) => setTargetCategoryId(e.target.value)} className="flex-1">
            <option value="">Uncategorized</option>
            {moveTargets.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryPath(c, categories)}
              </option>
            ))}
          </Select>
          <Button type="button" onClick={handleMove}>
            Move
          </Button>
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </Card>
  )
}

function ItemCreateCard({
  categoryId,
  categories,
  onCreated,
}: {
  categoryId: string | null
  categories: PricebookCategory[]
  onCreated: () => void
}) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New Item'}</Button>
      {showForm && (
        <Card className="mt-2">
          <PricebookItemForm
            initial={emptyPricebookItemFormValues(categoryId ?? '')}
            categories={categories}
            onSave={async (payload) => {
              await api.post('/pricebook-items', payload)
              setShowForm(false)
              onCreated()
            }}
            onCancel={() => setShowForm(false)}
            submitLabel="Save Item"
          />
        </Card>
      )}
    </div>
  )
}
