import type { AppointmentStatus, JobStatus } from '../generated/prisma/enums.js'

// Statuses the software manages automatically from appointment activity.
// CANCELED and ON_HOLD are explicit user actions and are never overwritten
// by this derivation - they stick until another explicit action changes them.
const AUTO_MANAGED_STATUSES: JobStatus[] = ['UNSCHEDULED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED']

const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'DISPATCHED',
  'EN_ROUTE',
  'ON_SITE',
  'IN_PROGRESS',
]

export function isAutoManaged(status: JobStatus): boolean {
  return AUTO_MANAGED_STATUSES.includes(status)
}

export function deriveJobStatus(appointments: { status: AppointmentStatus }[]): JobStatus {
  const relevant = appointments.filter((a) => a.status !== 'CANCELED')
  if (relevant.length === 0) return 'UNSCHEDULED'

  const allCompleted = relevant.every((a) => a.status === 'COMPLETED')
  if (allCompleted) return 'COMPLETED'

  const anyActive = relevant.some((a) => ACTIVE_APPOINTMENT_STATUSES.includes(a.status))
  if (anyActive) return 'IN_PROGRESS'

  return 'SCHEDULED'
}
