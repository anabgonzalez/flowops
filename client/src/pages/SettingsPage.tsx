import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { JobPriority, JobType, Tag, TagCategory } from '../api/types'
import { Badge, Button, Card, Input, Label, Select, TagChip } from '../components/ui'
import { TAG_COLORS, tagSwatchClass, type TagColor } from '../components/tagPalette'

export function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
      <JobTypesSection />
      <TagsSection category="JOB" title="Job Tags" placeholder="e.g. Warranty" />
      <TagsSection category="CUSTOMER" title="Customer Tags" placeholder="e.g. Member" />
      <TagsSection category="LOCATION" title="Location Tags" placeholder="e.g. Has Dogs" />
      <DangerZone />
    </div>
  )
}

function JobTypesSection() {
  const [jobTypes, setJobTypes] = useState<JobType[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [defaultPriority, setDefaultPriority] = useState<JobPriority>('NORMAL')
  const [error, setError] = useState<string | null>(null)

  function load() {
    api.get<JobType[]>('/job-types').then(setJobTypes)
  }

  useEffect(load, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/job-types', { name, defaultPriority })
      setName('')
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job type')
    }
  }

  async function toggleActive(jobType: JobType) {
    await api.patch(`/job-types/${jobType.id}`, { active: !jobType.active })
    load()
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Job Types</h2>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New Job Type'}</Button>
      </div>
      <p className="text-sm text-slate-500">
        Each job type carries a default priority, applied automatically when it's picked on a new job (still
        editable per job).
      </p>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label htmlFor="jt-name">Name</Label>
              <Input id="jt-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HVAC Repair" required />
            </div>
            <div>
              <Label htmlFor="jt-priority">Default Priority</Label>
              <Select id="jt-priority" value={defaultPriority} onChange={(e) => setDefaultPriority(e.target.value as JobPriority)}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Save Job Type</Button>
          </form>
        </Card>
      )}

      {jobTypes.length === 0 ? (
        <p className="text-sm text-slate-500">No job types yet.</p>
      ) : (
        <div className="space-y-2">
          {jobTypes.map((jt) => (
            <Card key={jt.id} className={jt.active ? '' : 'opacity-50'}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{jt.name}</span>
                  <Badge value={jt.defaultPriority} />
                </div>
                <Button variant="secondary" onClick={() => toggleActive(jt)}>
                  {jt.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}

function TagsSection({ category, title, placeholder }: { category: TagCategory; title: string; placeholder: string }) {
  const [tags, setTags] = useState<Tag[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState<TagColor>('blue')
  const [error, setError] = useState<string | null>(null)

  function load() {
    api.get<Tag[]>(`/tags?category=${category}`).then(setTags)
  }

  useEffect(load, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/tags', { name, color, category })
      setName('')
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag')
    }
  }

  async function toggleActive(tag: Tag) {
    await api.patch(`/tags/${tag.id}`, { active: !tag.active })
    load()
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">{title}</h2>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New Tag'}</Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label htmlFor={`tag-name-${category}`}>Name</Label>
              <Input
                id={`tag-name-${category}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={placeholder}
                required
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={c}
                    className={`h-7 w-7 cursor-pointer rounded-full ${tagSwatchClass(c)} ${
                      color === c ? 'ring-2 ring-offset-2 ring-titan-500' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Save Tag</Button>
          </form>
        </Card>
      )}

      {tags.length === 0 ? (
        <p className="text-sm text-slate-500">No tags yet.</p>
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => (
            <Card key={tag.id} className={tag.active ? '' : 'opacity-50'}>
              <div className="flex items-center justify-between">
                <TagChip name={tag.name} color={tag.color} />
                <Button variant="secondary" onClick={() => toggleActive(tag)}>
                  {tag.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}

function DangerZone() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [status, setStatus] = useState<'idle' | 'done' | 'error'>('idle')

  async function handleReset() {
    try {
      await api.del('/pricebook')
      setStatus('done')
      setShowConfirm(false)
      setConfirmText('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="space-y-2 rounded-md border border-red-200 bg-red-50 p-4">
      <h2 className="font-medium text-red-900">Danger Zone</h2>
      <p className="text-sm text-red-800">
        Permanently deletes every pricebook item (Services, Materials, Equipment, Other) and every category and
        subcategory. This cannot be undone. Existing estimates and invoices are not affected - they keep their own
        copy of each line item's description and price.
      </p>

      {!showConfirm ? (
        <Button variant="danger" onClick={() => setShowConfirm(true)}>
          Reset Entire Pricebook
        </Button>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="reset-confirm">
            Type <span className="font-mono font-semibold">RESET</span> to confirm
          </Label>
          <Input id="reset-confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="danger" disabled={confirmText !== 'RESET'} onClick={handleReset}>
              Permanently Delete Everything
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowConfirm(false)
                setConfirmText('')
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {status === 'done' && <p className="text-sm font-medium text-emerald-700">Pricebook reset. It's now empty.</p>}
      {status === 'error' && <p className="text-sm font-medium text-red-700">Something went wrong - nothing was deleted.</p>}
    </section>
  )
}
