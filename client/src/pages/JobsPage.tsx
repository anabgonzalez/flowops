import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Customer, JobListItem, JobPriority, JobStatus, JobType, Location, Tag, Timeframe, User } from '../api/types'
import { Badge, Button, Card, Label, priorityAccentClass, Select, TagChip } from '../components/ui'
import { CustomerCombobox } from '../components/CustomerCombobox'
import { LocationPicker } from '../components/LocationPicker'
import { RichTextEditor } from '../components/RichTextEditor'
import { TagPicker } from '../components/TagPicker'
import { ScheduleFields } from '../components/ScheduleFields'

const STATUSES: JobStatus[] = ['UNSCHEDULED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'ON_HOLD']

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function JobsPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [jobTypes, setJobTypes] = useState<JobType[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [timeframes, setTimeframes] = useState<Timeframe[]>([])
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('')
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const showForm = searchParams.has('new') || searchParams.has('newForLocation')
  const presetLocationId = searchParams.get('newForLocation') ?? ''

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [locationId, setLocationId] = useState(presetLocationId)
  const [jobTypeId, setJobTypeId] = useState('')
  const [summary, setSummary] = useState('')
  const [priority, setPriority] = useState<JobPriority>('NORMAL')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [scheduleNow, setScheduleNow] = useState(false)
  const [technicianId, setTechnicianId] = useState('')
  const [date, setDate] = useState('')
  const [timeframeId, setTimeframeId] = useState('custom')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [error, setError] = useState<string | null>(null)

  function loadJobs() {
    api.get<JobListItem[]>(`/jobs${statusFilter ? `?status=${statusFilter}` : ''}`).then(setJobs)
  }

  useEffect(loadJobs, [statusFilter])
  useEffect(() => {
    api.get<JobType[]>('/job-types?active=true').then(setJobTypes)
    api.get<Tag[]>('/tags?category=JOB&active=true').then(setTags)
    api.get<User[]>('/users').then((users) => setTechnicians(users.filter((u) => u.role === 'TECHNICIAN')))
    api.get<Timeframe[]>('/timeframes?active=true').then(setTimeframes)
  }, [])
  useEffect(() => {
    api.get<Customer[]>('/customers').then((data) => {
      setCustomers(data)
      if (presetLocationId) {
        const owner = data.find((c) => c.locations.some((l) => l.id === presetLocationId))
        if (owner) setSelectedCustomer(owner)
      }
    })
  }, [presetLocationId])

  function handleJobTypeChange(id: string) {
    setJobTypeId(id)
    const jt = jobTypes.find((j) => j.id === id)
    if (jt) setPriority(jt.defaultPriority)
  }

  function resetForm() {
    setSelectedCustomer(null)
    setLocationId('')
    setJobTypeId('')
    setSummary('')
    setPriority('NORMAL')
    setSelectedTagIds([])
    setScheduleNow(false)
    setTechnicianId('')
    setDate('')
    setTimeframeId('custom')
    setStart('')
    setEnd('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const job = await api.post<{ id: string }>('/jobs', {
        locationId,
        jobTypeId,
        summary,
        priority,
        tagIds: selectedTagIds,
        technicianId: scheduleNow ? technicianId || undefined : undefined,
        start: scheduleNow && start ? new Date(start).toISOString() : undefined,
        end: scheduleNow && end ? new Date(end).toISOString() : undefined,
      })
      setSearchParams({})
      resetForm()
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
              <Label>Customer</Label>
              <CustomerCombobox
                customers={customers}
                value={selectedCustomer}
                onSelect={(c) => {
                  setSelectedCustomer(c)
                  setLocationId('')
                }}
                onCreated={(c) => {
                  setCustomers((cs) => [...cs, c])
                  setSelectedCustomer(c)
                  setLocationId('')
                }}
              />
            </div>

            <div>
              <Label>Location</Label>
              <LocationPicker
                customer={selectedCustomer}
                value={locationId}
                onSelect={setLocationId}
                onCreated={(loc: Location) => {
                  setSelectedCustomer((c) => (c ? { ...c, locations: [...c.locations, loc] } : c))
                  setCustomers((cs) =>
                    cs.map((c) => (c.id === loc.customerId ? { ...c, locations: [...c.locations, loc] } : c)),
                  )
                  setLocationId(loc.id)
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="job-type">Job Type</Label>
                <Select id="job-type" value={jobTypeId} onChange={(e) => handleJobTypeChange(e.target.value)} required>
                  <option value="">Select&hellip;</option>
                  {jobTypes.map((jt) => (
                    <option key={jt.id} value={jt.id}>
                      {jt.name}
                    </option>
                  ))}
                </Select>
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
            </div>

            <div>
              <Label>Summary</Label>
              <RichTextEditor value={summary} onChange={setSummary} placeholder="Describe the job..." />
            </div>

            <div>
              <Label>Tags</Label>
              <TagPicker availableTags={tags} selectedIds={selectedTagIds} onChange={setSelectedTagIds} placeholder="Search job tags..." />
            </div>

            <div className="border-t border-slate-100 pt-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={scheduleNow} onChange={(e) => setScheduleNow(e.target.checked)} />
                Schedule now (optional — you can schedule later instead)
              </label>
              {scheduleNow && (
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="job-technician">Technician</Label>
                    <Select id="job-technician" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}>
                      <option value="">Unassigned</option>
                      {technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <ScheduleFields
                    idPrefix="job"
                    timeframes={timeframes}
                    date={date}
                    setDate={setDate}
                    timeframeId={timeframeId}
                    setTimeframeId={setTimeframeId}
                    start={start}
                    setStart={setStart}
                    end={end}
                    setEnd={setEnd}
                    required={scheduleNow}
                  />
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={!locationId || !jobTypeId}>
              Create Job
            </Button>
          </form>
        </Card>
      )}

      <div className="w-40">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as JobStatus | '')}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll('_', ' ')}
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
              <Card className={`border-l-4 hover:border-slate-400 ${priorityAccentClass(job.priority)}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{job.jobType.name}</p>
                    <p className="text-sm text-slate-500">{stripHtml(job.summary)}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {job.location.customer.name} · {job.location.addressLine1}, {job.location.city}
                    </p>
                    {job.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {job.tags.map((t) => (
                          <TagChip key={t.id} name={t.name} color={t.color} />
                        ))}
                      </div>
                    )}
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
