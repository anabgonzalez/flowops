import { useEffect, useMemo, useRef, useState } from 'react'
import type { Tag } from '../api/types'
import { Input } from './ui'
import { tagChipClass } from './tagPalette'

export function TagPicker({
  availableTags,
  selectedIds,
  onChange,
  placeholder = 'Search tags...',
}: {
  availableTags: Tag[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedTags = useMemo(
    () => selectedIds.map((id) => availableTags.find((t) => t.id === id)).filter((t): t is Tag => !!t),
    [availableTags, selectedIds],
  )

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const unselected = availableTags.filter((t) => !selectedIds.includes(t.id))
    if (!q) return unselected
    return unselected.filter((t) => t.name.toLowerCase().includes(q))
  }, [availableTags, selectedIds, query])

  function add(tagId: string) {
    onChange([...selectedIds, tagId])
    setQuery('')
  }

  function remove(tagId: string) {
    onChange(selectedIds.filter((id) => id !== tagId))
  }

  return (
    <div className="relative" ref={containerRef}>
      {selectedTags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tagChipClass(tag.color)}`}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => remove(tag.id)}
                aria-label={`Remove ${tag.name}`}
                className="cursor-pointer leading-none opacity-70 hover:opacity-100"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      <Input value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setOpen(true)} placeholder={placeholder} />

      {open && (
        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500">{availableTags.length === 0 ? 'No tags yet.' : 'No matches.'}</p>
          ) : (
            matches.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => add(tag.id)}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tagChipClass(tag.color)}`}>{tag.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
