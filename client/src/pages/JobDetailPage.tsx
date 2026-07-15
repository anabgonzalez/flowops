import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { AppointmentStatus, Job, JobPriority, JobType, PaymentMethod, PricebookItem, User } from '../api/types'
import { Badge, Button, Card, formatCents, Input, Label, Select, TagChip } from '../components/ui'
import { RichTextEditor } from '../components/RichTextEditor'
import { RichTextView } from '../components/RichTextView'
import { emptyLineItem, LineItemsEditor, type LineItemDraft } from '../components/LineItemsEditor'

const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'SCHEDULED',
  'DISPATCHED',
  'EN_ROUTE',
  'ON_SITE',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
]

function toDollars(cents: number) {
  return (cents / 100).toString()
}

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [technicians, setTechnicians] = useState<User[]>([])
  const [pricebookItems, setPricebookItems] = useState<PricebookItem[]>([])
  const [jobTypes, setJobTypes] = useState<JobType[]>([])

  function load() {
    if (!id) return
    api.get<Job>(`/jobs/${id}`).then(setJob)
  }

  useEffect(load, [id])
  useEffect(() => {
    api.get<User[]>('/users').then((users) => setTechnicians(users.filter((u) => u.role === 'TECHNICIAN')))
    api.get<PricebookItem[]>('/pricebook-items?active=true').then(setPricebookItems)
    api.get<JobType[]>('/job-types?active=true').then(setJobTypes)
  }, [])

  if (!job) return <p className="text-sm text-slate-500">Loading...</p>

  async function handleCancel() {
    if (!id) return
    await api.post(`/jobs/${id}/cancel`, {})
    load()
  }

  async function handleHold() {
    if (!id) return
    await api.post(`/jobs/${id}/hold`, {})
    load()
  }

  async function handleResume() {
    if (!id) return
    await api.post(`/jobs/${id}/resume`, {})
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/jobs" className="text-sm text-slate-500 hover:underline">
          &larr; Back to jobs
        </Link>

        <JobDetailsHeader job={job} jobTypes={jobTypes} onChange={load} />

        <div className="mt-3 flex gap-2">
          {job.status === 'ON_HOLD' ? (
            <Button variant="secondary" onClick={handleResume}>
              Resume
            </Button>
          ) : job.status !== 'CANCELED' && job.status !== 'COMPLETED' ? (
            <Button variant="secondary" onClick={handleHold}>
              Put on Hold
            </Button>
          ) : null}
          {job.status !== 'CANCELED' && job.status !== 'COMPLETED' && (
            <Button variant="danger" onClick={handleCancel}>
              Cancel Job
            </Button>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Status updates automatically as appointments are scheduled and completed.
        </p>
      </div>

      <AppointmentsSection jobId={job.id} appointments={job.appointments} technicians={technicians} onChange={load} />
      <EstimatesSection jobId={job.id} estimates={job.estimates} pricebookItems={pricebookItems} onChange={load} />
      <InvoicesSection jobId={job.id} job={job} pricebookItems={pricebookItems} onChange={load} />
    </div>
  )
}

function JobDetailsHeader({ job, jobTypes, onChange }: { job: Job; jobTypes: JobType[]; onChange: () => void }) {
  const [editing, setEditing] = useState(false)
  const [jobTypeId, setJobTypeId] = useState(job.jobType.id)
  const [priority, setPriority] = useState<JobPriority>(job.priority)
  const [summary, setSummary] = useState(job.summary)
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setJobTypeId(job.jobType.id)
    setPriority(job.priority)
    setSummary(job.summary)
    setError(null)
    setEditing(true)
  }

  async function handleSave() {
    setError(null)
    try {
      await api.patch(`/jobs/${job.id}`, { jobTypeId, priority, summary })
      setEditing(false)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save job details')
    }
  }

  if (editing) {
    return (
      <Card className="mt-2">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-job-type">Job Type</Label>
              <Select id="edit-job-type" value={jobTypeId} onChange={(e) => setJobTypeId(e.target.value)}>
                {jobTypes.map((jt) => (
                  <option key={jt.id} value={jt.id}>
                    {jt.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Select id="edit-priority" value={priority} onChange={(e) => setPriority(e.target.value as JobPriority)}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>
            </div>
          </div>
          <div>
            <Label>Summary</Label>
            <RichTextEditor value={summary} onChange={setSummary} />
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

  const primaryContact = job.location.contacts.find((c) => c.isPrimary) ?? job.location.contacts[0]

  return (
    <div className="mt-1 flex items-start justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{job.jobType.name}</h1>
        <RichTextView html={job.summary} />
        <p className="mt-1 text-sm text-slate-600">
          {job.location.customer.name} · {job.location.addressLine1}, {job.location.city}, {job.location.state}
        </p>
        {primaryContact && (
          <p className="mt-1 text-sm text-slate-500">
            On-site: {primaryContact.name}
            {primaryContact.phone ? ` · ${primaryContact.phone}` : ''}
          </p>
        )}
        {job.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {job.tags.map((t) => (
              <TagChip key={t.id} name={t.name} color={t.color} />
            ))}
          </div>
        )}
        <button type="button" onClick={startEdit} className="mt-2 cursor-pointer text-sm font-medium text-titan-600 hover:underline">
          Edit details
        </button>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Badge value={job.priority} />
        <Badge value={job.status} />
      </div>
    </div>
  )
}

function AppointmentsSection({
  jobId,
  appointments,
  technicians,
  onChange,
}: {
  jobId: string
  appointments: Job['appointments']
  technicians: User[]
  onChange: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [technicianId, setTechnicianId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post(`/jobs/${jobId}/appointments`, {
        technicianId: technicianId || undefined,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
      })
      setShowForm(false)
      setTechnicianId('')
      setStart('')
      setEnd('')
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule appointment')
    }
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Appointments</h2>
        <Button variant="secondary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : 'Schedule'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label htmlFor="appt-technician">Technician</Label>
              <Select id="appt-technician" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}>
                <option value="">Unassigned</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="appt-start">Start</Label>
                <Input id="appt-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="appt-end">End</Label>
                <Input id="appt-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Save Appointment</Button>
          </form>
        </Card>
      )}

      {appointments.length === 0 ? (
        <p className="text-sm text-slate-500">No appointments scheduled.</p>
      ) : (
        appointments.map((appt) => (
          <AppointmentCard key={appt.id} appointment={appt} technicians={technicians} onChange={onChange} />
        ))
      )}
    </section>
  )
}

function AppointmentCard({
  appointment,
  technicians,
  onChange,
}: {
  appointment: Job['appointments'][number]
  technicians: User[]
  onChange: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [technicianId, setTechnicianId] = useState(appointment.technicianId ?? '')
  const [start, setStart] = useState(toLocalInput(appointment.start))
  const [end, setEnd] = useState(toLocalInput(appointment.end))
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status)
  const [notes, setNotes] = useState(appointment.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setTechnicianId(appointment.technicianId ?? '')
    setStart(toLocalInput(appointment.start))
    setEnd(toLocalInput(appointment.end))
    setStatus(appointment.status)
    setNotes(appointment.notes ?? '')
    setError(null)
    setEditing(true)
  }

  async function handleSave() {
    setError(null)
    try {
      await api.patch(`/appointments/${appointment.id}`, {
        technicianId: technicianId || null,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        status,
        notes: notes || undefined,
      })
      setEditing(false)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save appointment')
    }
  }

  if (editing) {
    return (
      <Card>
        <div className="space-y-3">
          <div>
            <Label htmlFor={`edit-appt-tech-${appointment.id}`}>Technician</Label>
            <Select id={`edit-appt-tech-${appointment.id}`} value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}>
              <option value="">Unassigned</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`edit-appt-start-${appointment.id}`}>Start</Label>
              <Input
                id={`edit-appt-start-${appointment.id}`}
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`edit-appt-end-${appointment.id}`}>End</Label>
              <Input id={`edit-appt-end-${appointment.id}`} type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor={`edit-appt-status-${appointment.id}`}>Status</Label>
            <Select
              id={`edit-appt-status-${appointment.id}`}
              value={status}
              onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
            >
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor={`edit-appt-notes-${appointment.id}`}>Notes</Label>
            <Input id={`edit-appt-notes-${appointment.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} />
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

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-900">
            {new Date(appointment.start).toLocaleString()} &ndash; {new Date(appointment.end).toLocaleTimeString()}
          </p>
          <p className="text-sm text-slate-500">{appointment.technician?.name ?? 'Unassigned'}</p>
          {appointment.notes && <p className="mt-1 text-sm text-slate-500">{appointment.notes}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge value={appointment.status} />
          <button type="button" onClick={startEdit} className="cursor-pointer text-sm font-medium text-titan-600 hover:underline">
            Edit
          </button>
        </div>
      </div>
    </Card>
  )
}

function estimateToDrafts(estimate: Job['estimates'][number]): LineItemDraft[] {
  return estimate.lineItems.map((li) => ({
    pricebookItemId: li.pricebookItemId ?? '',
    description: li.description,
    quantity: li.quantity,
    unitPriceDollars: toDollars(li.unitPriceCents),
  }))
}

function lineItemsToPayload(lineItems: LineItemDraft[]) {
  return lineItems.map((li) => ({
    pricebookItemId: li.pricebookItemId || undefined,
    description: li.description,
    quantity: li.quantity,
    unitPriceCents: Math.round(Number(li.unitPriceDollars) * 100),
  }))
}

function EstimatesSection({
  jobId,
  estimates,
  pricebookItems,
  onChange,
}: {
  jobId: string
  estimates: Job['estimates']
  pricebookItems: PricebookItem[]
  onChange: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [taxDollars, setTaxDollars] = useState('0')
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([emptyLineItem()])
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post(`/jobs/${jobId}/estimates`, {
        name,
        taxCents: Math.round(Number(taxDollars) * 100),
        lineItems: lineItemsToPayload(lineItems),
      })
      setShowForm(false)
      setName('')
      setTaxDollars('0')
      setLineItems([emptyLineItem()])
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create estimate')
    }
  }

  async function setStatus(estimateId: string, status: string) {
    await api.patch(`/estimates/${estimateId}/status`, { status })
    onChange()
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Estimates</h2>
        <Button variant="secondary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : 'New Estimate'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label htmlFor="est-name">Option Name</Label>
              <Input id="est-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard" required />
            </div>
            <LineItemsEditor lineItems={lineItems} onChange={setLineItems} pricebookItems={pricebookItems} />
            <div className="w-32">
              <Label htmlFor="est-tax">Tax ($)</Label>
              <Input id="est-tax" type="number" step="0.01" value={taxDollars} onChange={(e) => setTaxDollars(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Save Estimate</Button>
          </form>
        </Card>
      )}

      {estimates.length === 0 ? (
        <p className="text-sm text-slate-500">No estimates yet.</p>
      ) : (
        estimates.map((est) => (
          <EstimateCard key={est.id} estimate={est} pricebookItems={pricebookItems} onChange={onChange} setStatus={setStatus} />
        ))
      )}
    </section>
  )
}

function EstimateCard({
  estimate,
  pricebookItems,
  onChange,
  setStatus,
}: {
  estimate: Job['estimates'][number]
  pricebookItems: PricebookItem[]
  onChange: () => void
  setStatus: (id: string, status: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(estimate.name)
  const [taxDollars, setTaxDollars] = useState(toDollars(estimate.taxCents))
  const [lineItems, setLineItems] = useState<LineItemDraft[]>(estimateToDrafts(estimate))
  const [error, setError] = useState<string | null>(null)

  const editable = estimate.status === 'DRAFT' || estimate.status === 'PRESENTED'

  function startEdit() {
    setName(estimate.name)
    setTaxDollars(toDollars(estimate.taxCents))
    setLineItems(estimateToDrafts(estimate))
    setError(null)
    setEditing(true)
  }

  async function handleSave() {
    setError(null)
    try {
      await api.patch(`/estimates/${estimate.id}`, {
        name,
        taxCents: Math.round(Number(taxDollars) * 100),
        lineItems: lineItemsToPayload(lineItems),
      })
      setEditing(false)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save estimate')
    }
  }

  if (editing) {
    return (
      <Card>
        <div className="space-y-3">
          <div>
            <Label htmlFor={`edit-est-name-${estimate.id}`}>Option Name</Label>
            <Input id={`edit-est-name-${estimate.id}`} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <LineItemsEditor lineItems={lineItems} onChange={setLineItems} pricebookItems={pricebookItems} />
          <div className="w-32">
            <Label htmlFor={`edit-est-tax-${estimate.id}`}>Tax ($)</Label>
            <Input
              id={`edit-est-tax-${estimate.id}`}
              type="number"
              step="0.01"
              value={taxDollars}
              onChange={(e) => setTaxDollars(e.target.value)}
            />
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

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-slate-900">{estimate.name}</p>
          <ul className="mt-1 space-y-0.5 text-sm text-slate-500">
            {estimate.lineItems.map((li) => (
              <li key={li.id}>
                {li.quantity}&times; {li.description} &mdash; {formatCents(li.totalCents)}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-sm font-medium text-slate-900">Total: {formatCents(estimate.totalCents)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge value={estimate.status} />
          {editable && (
            <div className="flex flex-col items-end gap-1">
              <div className="flex gap-1">
                <Button variant="secondary" onClick={() => setStatus(estimate.id, 'APPROVED')}>
                  Approve
                </Button>
                <Button variant="danger" onClick={() => setStatus(estimate.id, 'DECLINED')}>
                  Decline
                </Button>
              </div>
              <button type="button" onClick={startEdit} className="cursor-pointer text-sm font-medium text-titan-600 hover:underline">
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function InvoicesSection({
  jobId,
  job,
  pricebookItems,
  onChange,
}: {
  jobId: string
  job: Job
  pricebookItems: PricebookItem[]
  onChange: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const approvedEstimates = job.estimates.filter((e) => e.status === 'APPROVED' && !e.invoice)

  async function convertToInvoice(estimateId: string) {
    setError(null)
    try {
      await api.post(`/jobs/${jobId}/invoices`, { estimateId })
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice')
    }
  }

  return (
    <section className="space-y-2">
      <h2 className="font-medium text-slate-900">Invoices</h2>

      {approvedEstimates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {approvedEstimates.map((est) => (
            <Button key={est.id} variant="secondary" onClick={() => convertToInvoice(est.id)}>
              Convert "{est.name}" to Invoice
            </Button>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {job.invoices.length === 0 ? (
        <p className="text-sm text-slate-500">No invoices yet.</p>
      ) : (
        job.invoices.map((inv) => (
          <InvoiceCard key={inv.id} invoice={inv} pricebookItems={pricebookItems} onChange={onChange} />
        ))
      )}
    </section>
  )
}

function InvoiceCard({
  invoice,
  pricebookItems,
  onChange,
}: {
  invoice: Job['invoices'][number]
  pricebookItems: PricebookItem[]
  onChange: () => void
}) {
  const [showPayment, setShowPayment] = useState(false)
  const [amountDollars, setAmountDollars] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('CARD')
  const [editing, setEditing] = useState(false)
  const [taxDollars, setTaxDollars] = useState(toDollars(invoice.taxCents))
  const [lineItems, setLineItems] = useState<LineItemDraft[]>(
    invoice.lineItems.map((li) => ({
      pricebookItemId: li.pricebookItemId ?? '',
      description: li.description,
      quantity: li.quantity,
      unitPriceDollars: toDollars(li.unitPriceCents),
    })),
  )
  const [error, setError] = useState<string | null>(null)

  const editable = invoice.payments.length === 0 && invoice.status !== 'VOID'

  function startEdit() {
    setTaxDollars(toDollars(invoice.taxCents))
    setLineItems(
      invoice.lineItems.map((li) => ({
        pricebookItemId: li.pricebookItemId ?? '',
        description: li.description,
        quantity: li.quantity,
        unitPriceDollars: toDollars(li.unitPriceCents),
      })),
    )
    setError(null)
    setEditing(true)
  }

  async function handleSaveEdit() {
    setError(null)
    try {
      await api.patch(`/invoices/${invoice.id}`, {
        taxCents: Math.round(Number(taxDollars) * 100),
        lineItems: lineItemsToPayload(lineItems),
      })
      setEditing(false)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save invoice')
    }
  }

  async function handleSend() {
    await api.post(`/invoices/${invoice.id}/send`, {})
    onChange()
  }

  async function handleVoid() {
    await api.post(`/invoices/${invoice.id}/void`, {})
    onChange()
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post(`/invoices/${invoice.id}/payments`, {
        amountCents: Math.round(Number(amountDollars) * 100),
        method,
      })
      setShowPayment(false)
      setAmountDollars('')
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment')
    }
  }

  if (editing) {
    return (
      <Card>
        <div className="space-y-3">
          <p className="font-medium text-slate-900">{invoice.invoiceNumber}</p>
          <LineItemsEditor lineItems={lineItems} onChange={setLineItems} pricebookItems={pricebookItems} />
          <div className="w-32">
            <Label htmlFor={`edit-inv-tax-${invoice.id}`}>Tax ($)</Label>
            <Input
              id={`edit-inv-tax-${invoice.id}`}
              type="number"
              step="0.01"
              value={taxDollars}
              onChange={(e) => setTaxDollars(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleSaveEdit}>Save</Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-slate-900">{invoice.invoiceNumber}</p>
          <ul className="mt-1 space-y-0.5 text-sm text-slate-500">
            {invoice.lineItems.map((li) => (
              <li key={li.id}>
                {li.quantity}&times; {li.description} &mdash; {formatCents(li.totalCents)}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-sm text-slate-900">Total: {formatCents(invoice.totalCents)}</p>
          <p className="text-sm font-medium text-slate-900">Balance: {formatCents(invoice.balanceCents)}</p>
          {invoice.payments.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-xs text-slate-400">
              {invoice.payments.map((p) => (
                <li key={p.id}>
                  {formatCents(p.amountCents)} via {p.method} on {new Date(p.paidAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge value={invoice.status} />
          <div className="flex flex-wrap justify-end gap-1">
            {invoice.status === 'DRAFT' && (
              <Button variant="secondary" onClick={handleSend}>
                Mark Sent
              </Button>
            )}
            {editable && (
              <Button variant="secondary" onClick={handleVoid}>
                Void
              </Button>
            )}
            {invoice.balanceCents > 0 && (
              <Button variant="secondary" onClick={() => setShowPayment((s) => !s)}>
                {showPayment ? 'Cancel' : 'Record Payment'}
              </Button>
            )}
          </div>
          {editable && (
            <button type="button" onClick={startEdit} className="cursor-pointer text-sm font-medium text-titan-600 hover:underline">
              Edit
            </button>
          )}
        </div>
      </div>

      {showPayment && (
        <form onSubmit={handlePay} className="mt-3 flex items-end gap-2 border-t border-slate-100 pt-3">
          <div className="w-28">
            <Label htmlFor={`pay-amount-${invoice.id}`}>Amount ($)</Label>
            <Input
              id={`pay-amount-${invoice.id}`}
              type="number"
              step="0.01"
              value={amountDollars}
              onChange={(e) => setAmountDollars(e.target.value)}
              required
            />
          </div>
          <div className="w-32">
            <Label htmlFor={`pay-method-${invoice.id}`}>Method</Label>
            <Select id={`pay-method-${invoice.id}`} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              <option value="CARD">Card</option>
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
              <option value="ACH">ACH</option>
              <option value="FINANCING">Financing</option>
            </Select>
          </div>
          <Button type="submit">Pay</Button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  )
}
