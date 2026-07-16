import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { AppointmentStatus, DispatchAppointment, DispatchBoard, DispatchJob } from '../api/types'
import { Input, Label, priorityAccentClass, TagChip } from '../components/ui'

const BOARD_START_HOUR = 6
const BOARD_END_HOUR = 20
const PX_PER_HOUR = 60
const BOARD_WIDTH = (BOARD_END_HOUR - BOARD_START_HOUR) * PX_PER_HOUR
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000

function todayLocal() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function hourLabel(hour: number) {
  const period = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12} ${period}`
}

// Turns an x-coordinate dropped onto a technician's row into a snapped
// (30-minute) start time on the selected day.
function dropXToStart(date: string, offsetX: number) {
  const hoursFromStart = offsetX / PX_PER_HOUR
  const snappedHalfHours = Math.min(
    Math.max(Math.round(hoursFromStart * 2) / 2, 0),
    BOARD_END_HOUR - BOARD_START_HOUR,
  )
  const totalMinutes = Math.round((BOARD_START_HOUR + snappedHalfHours) * 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  return new Date(`${date}T${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}:00`)
}

const statusAccent: Record<AppointmentStatus, string> = {
  SCHEDULED: 'border-l-blue-500 bg-blue-50',
  DISPATCHED: 'border-l-blue-500 bg-blue-50',
  EN_ROUTE: 'border-l-amber-500 bg-amber-50',
  ON_SITE: 'border-l-amber-500 bg-amber-50',
  IN_PROGRESS: 'border-l-amber-500 bg-amber-50',
  COMPLETED: 'border-l-emerald-500 bg-emerald-50',
  CANCELED: 'border-l-red-500 bg-red-50',
}

type DragPayload = { type: 'job'; jobId: string } | { type: 'appointment'; appointmentId: string; durationMs: number }

export function DispatchBoardPage() {
  const [date, setDate] = useState(todayLocal())
  const [board, setBoard] = useState<DispatchBoard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  function load() {
    api.get<DispatchBoard>(`/dispatch/board?date=${date}`).then(setBoard)
  }

  useEffect(load, [date])

  function handleDragStart(e: React.DragEvent, payload: DragPayload) {
    e.dataTransfer.setData('application/json', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'move'
  }

  async function assignToTechnician(payload: DragPayload, technicianId: string | null, start: Date) {
    setError(null)
    try {
      if (payload.type === 'job') {
        await api.post(`/jobs/${payload.jobId}/appointments`, {
          technicianId: technicianId ?? undefined,
          start: start.toISOString(),
          end: new Date(start.getTime() + DEFAULT_DURATION_MS).toISOString(),
        })
      } else {
        await api.patch(`/appointments/${payload.appointmentId}`, {
          technicianId,
          start: start.toISOString(),
          end: new Date(start.getTime() + payload.durationMs).toISOString(),
        })
      }
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update the schedule')
    }
  }

  function handleRowDrop(e: React.DragEvent, technicianId: string) {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/json')
    if (!raw) return
    const payload = JSON.parse(raw) as DragPayload
    const rowRect = e.currentTarget.getBoundingClientRect()
    const start = dropXToStart(date, e.clientX - rowRect.left)
    assignToTechnician(payload, technicianId, start)
  }

  async function handleUnassignDrop(e: React.DragEvent) {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/json')
    if (!raw) return
    const payload = JSON.parse(raw) as DragPayload
    if (payload.type !== 'appointment') return
    setError(null)
    try {
      await api.patch(`/appointments/${payload.appointmentId}`, { technicianId: null })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign')
    }
  }

  if (!board) return <p className="text-sm text-slate-500">Loading...</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Dispatch Board</h1>
        <div className="flex items-end gap-2">
          <div className="w-40">
            <Label htmlFor="dispatch-date">Date</Label>
            <Input id="dispatch-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <h2 className="font-medium text-slate-900">Unassigned Jobs</h2>
        <p className="text-xs text-slate-500">Drag a job onto a technician's row below to dispatch it. Drag an appointment back here to unassign it.</p>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleUnassignDrop}
          className="mt-2 flex min-h-24 gap-2 overflow-x-auto rounded-md border border-dashed border-slate-300 bg-slate-50 p-2"
        >
          {board.unassignedJobs.length === 0 ? (
            <p className="flex items-center px-2 text-sm text-slate-400">Nothing waiting on dispatch.</p>
          ) : (
            board.unassignedJobs.map((job) => <UnassignedJobCard key={job.id} job={job} onDragStart={handleDragStart} onClick={() => navigate(`/jobs/${job.id}`)} />)
          )}
        </div>
      </div>

      <div>
        <h2 className="font-medium text-slate-900">Technicians</h2>
        {board.technicians.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No technicians yet - add one from the Technicians page.</p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-md border border-slate-200 bg-white">
            <div style={{ width: 140 + BOARD_WIDTH }}>
              <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                <div className="w-[140px] shrink-0 px-2 py-2">Technician</div>
                <div className="relative" style={{ width: BOARD_WIDTH }}>
                  {Array.from({ length: BOARD_END_HOUR - BOARD_START_HOUR }, (_, i) => BOARD_START_HOUR + i).map((h) => (
                    <div
                      key={h}
                      className="absolute top-0 py-2 text-center"
                      style={{ left: (h - BOARD_START_HOUR) * PX_PER_HOUR, width: PX_PER_HOUR }}
                    >
                      {hourLabel(h)}
                    </div>
                  ))}
                </div>
              </div>

              {board.technicians.map((tech) => {
                const techAppointments = board.appointments.filter((a) => a.technicianId === tech.id)
                return (
                  <div key={tech.id} className="flex border-b border-slate-100 last:border-b-0">
                    <div className="w-[140px] shrink-0 truncate px-2 py-3 text-sm font-medium text-slate-900">{tech.name}</div>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleRowDrop(e, tech.id)}
                      className="relative h-16 border-l border-slate-100"
                      style={{
                        width: BOARD_WIDTH,
                        backgroundImage:
                          'repeating-linear-gradient(to right, transparent, transparent 59px, #eef2f7 59px, #eef2f7 60px)',
                      }}
                    >
                      {techAppointments.map((appt) => (
                        <AppointmentBlock
                          key={appt.id}
                          appointment={appt}
                          onDragStart={handleDragStart}
                          onClick={() => navigate(`/jobs/${appt.jobId}`)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function UnassignedJobCard({
  job,
  onDragStart,
  onClick,
}: {
  job: DispatchJob
  onDragStart: (e: React.DragEvent, payload: DragPayload) => void
  onClick: () => void
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, { type: 'job', jobId: job.id })}
      onClick={onClick}
      className={`w-48 shrink-0 cursor-grab select-none rounded-md border-l-4 bg-white p-2 text-xs shadow-sm active:cursor-grabbing ${priorityAccentClass(job.priority)}`}
    >
      <p className="truncate font-semibold text-slate-900">{job.jobType.name}</p>
      <p className="truncate text-slate-500">
        {job.location.customer.name} · {job.location.city}
      </p>
      {job.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {job.tags.slice(0, 2).map((t) => (
            <TagChip key={t.id} name={t.name} color={t.color} />
          ))}
        </div>
      )}
    </div>
  )
}

function AppointmentBlock({
  appointment,
  onDragStart,
  onClick,
}: {
  appointment: DispatchAppointment
  onDragStart: (e: React.DragEvent, payload: DragPayload) => void
  onClick: () => void
}) {
  const start = new Date(appointment.start)
  const end = new Date(appointment.end)
  const startHour = start.getHours() + start.getMinutes() / 60
  const left = Math.max(0, (startHour - BOARD_START_HOUR) * PX_PER_HOUR)
  const width = Math.max(30, ((end.getTime() - start.getTime()) / 3600000) * PX_PER_HOUR)
  const durationMs = end.getTime() - start.getTime()

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, { type: 'appointment', appointmentId: appointment.id, durationMs })}
      onClick={onClick}
      title={`${appointment.job.jobType.name} - ${appointment.job.location.customer.name}`}
      className={`absolute top-1 h-14 cursor-grab select-none overflow-hidden rounded border-l-4 px-1.5 py-1 text-[11px] shadow-sm active:cursor-grabbing ${statusAccent[appointment.status]}`}
      style={{ left, width }}
    >
      <p className="truncate font-semibold text-slate-900">{appointment.job.jobType.name}</p>
      <p className="truncate text-slate-600">{appointment.job.location.customer.name}</p>
    </div>
  )
}
