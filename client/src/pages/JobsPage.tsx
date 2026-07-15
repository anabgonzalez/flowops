import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Customer, JobListItem, JobPriority, JobStatus } from '../api/types'
import { Badge, Button, Card, Input, Label, Select } from '../components/ui'

const STATUSES: JobStatus[] = ['UNSCHEDULED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'ON_HOLD']

export function JobsPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('')
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const showForm = searchParams.has('new') || searchParams.has('newForLocation')
  const presetLocationId = searchParams.get('newForLocation') ?? ''

  const [customerId, setCustomerId] = useState('')
  const [locationId, setLocationId] = useState(presetLocationId)
  const [jobType, setJobType] = useState('')
  const [summary, setSummary] = useState('')
  const [priority, setPriority] = useState<JobPriority>('NORMAL')
  const [error, setError] = useState<string | null>(null)

  function loadJobs() {
    api
      .get<JobListItem[]>(`/jobs${statusFilter ? `?status=${statusFilter}` : ''}`)
      .then(setJobs)
  }

  useEffect(loadJobs, [statusFilter])
  useEffect(() => {
    api.get<Customer[]>('/customers').then((data) => {
      setCustomers(data)
      if (presetLocationId) {
        const owner = data.find((c) => c.locations.some((l) => l.id === presetLocationId))
        if (owner) setCustomerId(owner.id)
      }
    })
  }, [presetLocationId])

  const locationsForCustomer = useMemo(
    () => customers.find((c) => c.id === customerId)?.locations ?? [],
    [customers, customerId],
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const job = await api.post<{ id: string }>('/jobs', { locationId, jobType, summary, priority })
      setSearchParams({})
      navigate(`/jobs/${job.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Jobs</h1>
        <Button onClick={() => setSearchParams(showForm ? {} : { new: '1' })}>
          {showForm ? 'Cancel' : 'New Job'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label htmlFor="job-customer">Customer</Label>
              <Select
                id="job-customer"
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value)
                  setLocationId('')
                }}
                required
              >
                <option value="">Select a customer&hellip;</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="job-location">Location</Label>
              <Select id="job-location" value={locationId} onChange={(e) => setLocationId(e.target.value)} required disabled={!customerId}>
                <option value="">Select a location&hellip;</option>
                {locationsForCustomer.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.addressLine1}, {l.city}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="job-type">Job Type</Label>
              <Input id="job-type" value={jobType} onChange={(e) => setJobType(e.target.value)} placeholder="e.g. HVAC Repair" required />
            </div>
            <div>
              <Label htmlFor="job-summary">Summary</Label>
              <Input id="job-summary" value={summary} onChange={(e) => setSummary(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="job-priority">Priority</Label>
              <Select id="job-priority" value={priority} onChange={(e) => setPriority(e.target.value as JobPriority)}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Create Job</Button>
          </form>
        </Card>
      )}

      <div className="w-40">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as JobStatus | '')}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </Select>
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm text-slate-500">No jobs yet.</p>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <Link key={job.id} to={`/jobs/${job.id}`}>
              <Card className="hover:border-slate-400">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{job.jobType}</p>
                    <p className="text-sm text-slate-500">{job.summary}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {job.location.customer.name} · {job.location.addressLine1}, {job.location.city}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge value={job.status} />
                    <Badge value={job.priority} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
