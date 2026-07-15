import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Job, JobStatus, PaymentMethod, PricebookItem, User } from '../api/types'
import { Badge, Button, Card, formatCents, Input, Label, Select } from '../components/ui'

const JOB_STATUSES: JobStatus[] = ['UNSCHEDULED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'ON_HOLD']

interface EstimateLineItemDraft {
  pricebookItemId: string
  description: string
  quantity: number
  unitPriceDollars: string
}

function emptyLineItem(): EstimateLineItemDraft {
  return { pricebookItemId: '', description: '', quantity: 1, unitPriceDollars: '' }
}

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [technicians, setTechnicians] = useState<User[]>([])
  const [pricebookItems, setPricebookItems] = useState<PricebookItem[]>([])

  function load() {
    if (!id) return
    api.get<Job>(`/jobs/${id}`).then(setJob)
  }

  useEffect(load, [id])
  useEffect(() => {
    api.get<User[]>('/users').then((users) => setTechnicians(users.filter((u) => u.role === 'TECHNICIAN')))
    api.get<PricebookItem[]>('/pricebook-items?active=true').then(setPricebookItems)
  }, [])

  if (!job) return <p className="text-sm text-slate-500">Loading...</p>

  async function handleStatusChange(status: JobStatus) {
    if (!id) return
    await api.patch(`/jobs/${id}`, { status })
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/jobs" className="text-sm text-slate-500 hover:underline">
          &larr; Back to jobs
        </Link>
        <div className="mt-1 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{job.jobType}</h1>
            <p className="text-sm text-slate-500">{job.summary}</p>
            <p className="mt-1 text-sm text-slate-600">
              {job.location.customer.name} · {job.location.addressLine1}, {job.location.city}, {job.location.state}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge value={job.priority} />
            <Select
              value={job.status}
              onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
              className="w-40"
            >
              {JOB_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <AppointmentsSection jobId={job.id} appointments={job.appointments} technicians={technicians} onChange={load} />
      <EstimatesSection jobId={job.id} estimates={job.estimates} pricebookItems={pricebookItems} onChange={load} />
      <InvoicesSection jobId={job.id} job={job} onChange={load} />
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
          <Card key={appt.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-900">
                  {new Date(appt.start).toLocaleString()} &ndash; {new Date(appt.end).toLocaleTimeString()}
                </p>
                <p className="text-sm text-slate-500">{appt.technician?.name ?? 'Unassigned'}</p>
              </div>
              <Badge value={appt.status} />
            </div>
          </Card>
        ))
      )}
    </section>
  )
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
  const [lineItems, setLineItems] = useState<EstimateLineItemDraft[]>([emptyLineItem()])
  const [error, setError] = useState<string | null>(null)

  function updateLine(index: number, patch: Partial<EstimateLineItemDraft>) {
    setLineItems((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function pickPricebookItem(index: number, pricebookItemId: string) {
    const item = pricebookItems.find((p) => p.id === pricebookItemId)
    updateLine(index, {
      pricebookItemId,
      description: item?.name ?? '',
      unitPriceDollars: item ? (item.priceCents / 100).toString() : '',
    })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post(`/jobs/${jobId}/estimates`, {
        name,
        taxCents: Math.round(Number(taxDollars) * 100),
        lineItems: lineItems.map((li) => ({
          pricebookItemId: li.pricebookItemId || undefined,
          description: li.description,
          quantity: li.quantity,
          unitPriceCents: Math.round(Number(li.unitPriceDollars) * 100),
        })),
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

            <div className="space-y-2">
              <Label>Line Items</Label>
              {lineItems.map((li, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <div className="col-span-4">
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
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => setLineItems((items) => [...items, emptyLineItem()])}>
                + Add Line Item
              </Button>
            </div>

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
          <Card key={est.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900">{est.name}</p>
                <ul className="mt-1 space-y-0.5 text-sm text-slate-500">
                  {est.lineItems.map((li) => (
                    <li key={li.id}>
                      {li.quantity}&times; {li.description} &mdash; {formatCents(li.totalCents)}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-sm font-medium text-slate-900">Total: {formatCents(est.totalCents)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge value={est.status} />
                {(est.status === 'DRAFT' || est.status === 'PRESENTED') && (
                  <div className="flex gap-1">
                    <Button variant="secondary" onClick={() => setStatus(est.id, 'APPROVED')}>
                      Approve
                    </Button>
                    <Button variant="danger" onClick={() => setStatus(est.id, 'DECLINED')}>
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </section>
  )
}

function InvoicesSection({ jobId, job, onChange }: { jobId: string; job: Job; onChange: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const approvedEstimates = job.estimates.filter((e) => e.status === 'APPROVED')

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
        job.invoices.map((inv) => <InvoiceCard key={inv.id} invoice={inv} onChange={onChange} />)
      )}
    </section>
  )
}

function InvoiceCard({ invoice, onChange }: { invoice: Job['invoices'][number]; onChange: () => void }) {
  const [showPayment, setShowPayment] = useState(false)
  const [amountDollars, setAmountDollars] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('CARD')
  const [error, setError] = useState<string | null>(null)

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
          {invoice.balanceCents > 0 && (
            <Button variant="secondary" onClick={() => setShowPayment((s) => !s)}>
              {showPayment ? 'Cancel' : 'Record Payment'}
            </Button>
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
