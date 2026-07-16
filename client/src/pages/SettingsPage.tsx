import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { JobPriority, JobType, Role, RolePermissions, Tag, TagCategory, Timeframe } from '../api/types'
import { Badge, Button, Card, Input, Label, Select, TagChip } from '../components/ui'
import { TAG_COLORS, tagSwatchClass, type TagColor } from '../components/tagPalette'
import { PermissionsChecklist } from '../components/PermissionsChecklist'

const ROLES: Role[] = ['OWNER', 'ADMIN', 'DISPATCHER', 'CSR', 'SALES_REP', 'TECHNICIAN']

export function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
      <JobTypesSection />
      <TagsSection category="JOB" title="Job Tags" placeholder="e.g. Warranty" />
      <TagsSection category="CUSTOMER" title="Customer Tags" placeholder="e.g. Member" />
      <TagsSection category="LOCATION" title="Location Tags" placeholder="e.g. Has Dogs" />
      <TimeframesSection />
      <RolePermissionsSection />
      <DangerZone />
    </div>
  )
}

function RolePermissionsSection() {
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([])
  const [openRole, setOpenRole] = useState<Role | null>(null)

  function load() {
    api.get<RolePermissions[]>('/role-permissions').then(setRolePermissions)
  }

  useEffect(load, [])

  async function handleToggle(role: Role, key: string, value: boolean) {
    const current = rolePermissions.find((rp) => rp.role === role)
    const nextPermissions = { ...current?.permissions, [key]: value }
    // Update locally first so the checkbox responds immediately, then persist.
    setRolePermissions((rows) =>
      rows.map((rp) => (rp.role === role ? { ...rp, permissions: nextPermissions } : rp)),
    )
    await api.patch(`/role-permissions/${role}`, { permissions: nextPermissions })
  }

  return (
    <section className="space-y-2">
      <h2 className="font-medium text-slate-900">Role Permissions</h2>
      <p className="text-sm text-slate-500">
        Default permissions for each role. A technician's individual profile can still override one or two of these
        without changing everyone with that role.
      </p>

      <div className="space-y-2">
        {ROLES.map((role) => {
          const rp = rolePermissions.find((r) => r.role === role)
          const open = openRole === role
          return (
            <Card key={role}>
              <button
                type="button"
                onClick={() => setOpenRole(open ? null : role)}
                className="flex w-full cursor-pointer items-center justify-between text-left"
              >
                <span className="font-medium text-slate-900">{role.replaceAll('_', ' ')}</span>
                <span className="text-sm text-titan-600">{open ? 'Hide' : 'Edit'}</span>
              </button>
              {open && rp && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <PermissionsChecklist values={rp.permissions} onToggle={(key, value) => handleToggle(role, key, value)} />
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function formatTime12h(time: string) {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

function TimeframesSection() {
  const [timeframes, setTimeframes] = useState<Timeframe[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('10:00')
  const [error, setError] = useState<string | null>(null)

  function load() {
    api.get<Timeframe[]>('/timeframes').then(setTimeframes)
  }

  useEffect(load, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/timeframes', { name, startTime, endTime })
      setName('')
      setStartTime('08:00')
      setEndTime('10:00')
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create timeframe')
    }
  }

  async function toggleActive(timeframe: Timeframe) {
    await api.patch(`/timeframes/${timeframe.id}`, { active: !timeframe.active })
    load()
  }

  async function handleDelete(timeframe: Timeframe) {
    if (!confirm(`Delete timeframe "${timeframe.name}"?`)) return
    await api.del(`/timeframes/${timeframe.id}`)
    load()
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Timeframes</h2>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New Timeframe'}</Button>
      </div>
      <p className="text-sm text-slate-500">
        Saved scheduling windows (e.g. "Morning, 8-10 AM") so appointments can be booked by picking a block instead
        of typing exact times.
      </p>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label htmlFor="tf-name">Name</Label>
              <Input id="tf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tf-start">Start Time</Label>
                <Input id="tf-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="tf-end">End Time</Label>
                <Input id="tf-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Save Timeframe</Button>
          </form>
        </Card>
      )}

      {timeframes.length === 0 ? (
        <p className="text-sm text-slate-500">No timeframes yet.</p>
      ) : (
        <div className="space-y-2">
          {timeframes.map((tf) => (
            <Card key={tf.id} className={tf.active ? '' : 'opacity-50'}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-900">{tf.name}</span>{' '}
                  <span className="text-sm text-slate-500">
                    ({formatTime12h(tf.startTime)}&ndash;{formatTime12h(tf.endTime)})
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => toggleActive(tf)}>
                    {tf.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(tf)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
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

  async function handleDelete(jobType: JobType) {
    if (!confirm(`Delete job type "${jobType.name}"?`)) return
    try {
      await api.del(`/job-types/${jobType.id}`)
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete job type')
    }
  }

  async function handleDeleteUnused() {
    if (!confirm('Delete every job type that has no jobs on it? Job types still in use will be left alone.')) return
    const result = await api.del<{ deletedCount: number; skippedCount: number }>('/job-types/unused')
    load()
    alert(`Deleted ${result.deletedCount} unused job type(s).`)
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Job Types</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleDeleteUnused}>
            Delete Unused
          </Button>
          <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New Job Type'}</Button>
        </div>
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
                  {!!jt._count?.jobs && <span className="text-xs text-slate-400">{jt._count.jobs} job(s)</span>}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => toggleActive(jt)}>
                    {jt.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(jt)}>
                    Delete
                  </Button>
                </div>
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

  async function handleDelete(tag: Tag) {
    if (!confirm(`Delete tag "${tag.name}"? It will be removed from anything currently tagged with it.`)) return
    await api.del(`/tags/${tag.id}`)
    load()
  }

  async function handleDeleteAll() {
    if (tags.length === 0) return
    if (!confirm(`Delete all ${tags.length} ${title.toLowerCase()}? It's removed from anything currently tagged.`)) return
    await api.del(`/tags?category=${category}`)
    load()
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">{title}</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleDeleteAll}>
            Delete All
          </Button>
          <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'New Tag'}</Button>
        </div>
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
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => toggleActive(tag)}>
                    {tag.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(tag)}>
                    Delete
                  </Button>
                </div>
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
