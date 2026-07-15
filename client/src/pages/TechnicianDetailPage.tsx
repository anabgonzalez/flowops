import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { AppointmentStatus, JobPriority, LocationWithCustomer, User } from '../api/types'
import { Badge, Card } from '../components/ui'

interface AppointmentWithJob {
  id: string
  start: string
  end: string
  status: AppointmentStatus
  job: {
    jobType: string
    summary: string
    priority: JobPriority
    location: LocationWithCustomer
  }
}

export function TechnicianDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [appointments, setAppointments] = useState<AppointmentWithJob[]>([])

  useEffect(() => {
    if (!id) return
    api.get<User>(`/users/${id}`).then(setUser)
    api.get<AppointmentWithJob[]>(`/appointments/technician/${id}`).then(setAppointments)
  }, [id])

  if (!user) return <p className="text-sm text-slate-500">Loading...</p>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{user.name}</h1>
        <p className="text-sm text-slate-500">{user.role.replaceAll('_', ' ')}'s schedule</p>
      </div>

      {appointments.length === 0 ? (
        <p className="text-sm text-slate-500">No appointments scheduled.</p>
      ) : (
        <div className="space-y-2">
          {appointments.map((appt) => (
            <Card key={appt.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900">{appt.job.jobType}</p>
                  <p className="text-sm text-slate-500">{appt.job.summary}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {appt.job.location.addressLine1}, {appt.job.location.city} · {appt.job.location.customer.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(appt.start).toLocaleString()} &ndash; {new Date(appt.end).toLocaleTimeString()}
                  </p>
                </div>
                <Badge value={appt.status} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Link to="/technicians" className="text-sm text-slate-500 hover:underline">
        &larr; Back to technicians
      </Link>
    </div>
  )
}
