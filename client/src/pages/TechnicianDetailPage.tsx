import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { AppointmentStatus, JobPriority, LocationWithCustomer, Role, RolePermissions, User } from '../api/types'
import { Badge, Button, Card, formatCents, Input, Label, Select } from '../components/ui'
import { PermissionsChecklist } from '../components/PermissionsChecklist'

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

function toDollars(cents: number) {
  return (cents / 100).toString()
}

function toCents(dollars: string) {
  return Math.round(Number(dollars) * 100)
}

export function TechnicianDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [appointments, setAppointments] = useState<AppointmentWithJob[]>([])
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([])

  function load() {
    if (!id) return
    api.get<User>(`/users/${id}`).then(setUser)
    api.get<AppointmentWithJob[]>(`/appointments/technician/${id}`).then(setAppointments)
  }

  useEffect(load, [id])
  useEffect(() => {
    api.get<RolePermissions[]>('/role-permissions').then(setRolePermissions)
  }, [])

  if (!user) return <p className="text-sm text-slate-500">Loading...</p>

  return (
    <div className="space-y-4">
      <TechnicianProfile user={user} rolePermissions={rolePermissions} onChange={load} />

      <div>
        <h2 className="font-medium text-slate-900">Schedule</h2>
        {appointments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No appointments scheduled.</p>
        ) : (
          <div className="mt-2 space-y-2">
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
      </div>

      <Link to="/technicians" className="text-sm text-slate-500 hover:underline">
        &larr; Back to technicians
      </Link>
    </div>
  )
}

function TechnicianProfile({
  user,
  rolePermissions,
  onChange,
}: {
  user: User
  rolePermissions: RolePermissions[]
  onChange: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [role, setRole] = useState<Role>(user.role)
  const [title, setTitle] = useState(user.title ?? '')
  const [truckNumber, setTruckNumber] = useState(user.truckNumber ?? '')
  const [homeAddressLine1, setHomeAddressLine1] = useState(user.homeAddressLine1 ?? '')
  const [homeCity, setHomeCity] = useState(user.homeCity ?? '')
  const [homeState, setHomeState] = useState(user.homeState ?? '')
  const [homePostalCode, setHomePostalCode] = useState(user.homePostalCode ?? '')
  const [hourlyEnabled, setHourlyEnabled] = useState(user.hourlyRateCents != null)
  const [hourlyDollars, setHourlyDollars] = useState(user.hourlyRateCents != null ? toDollars(user.hourlyRateCents) : '')
  const [salaryEnabled, setSalaryEnabled] = useState(user.annualSalaryCents != null)
  const [salaryDollars, setSalaryDollars] = useState(user.annualSalaryCents != null ? toDollars(user.annualSalaryCents) : '')
  const [commissionEnabled, setCommissionEnabled] = useState(user.commissionPercent != null)
  const [commissionPercent, setCommissionPercent] = useState(user.commissionPercent?.toString() ?? '')
  const [overrides, setOverrides] = useState<Record<string, boolean>>(user.permissionOverrides ?? {})
  const [error, setError] = useState<string | null>(null)

  const roleDefault = rolePermissions.find((rp) => rp.role === role)?.permissions ?? {}
  const effectivePermissions = { ...roleDefault, ...overrides }
  const overriddenKeys = new Set(Object.keys(overrides))

  function startEdit() {
    setName(user.name)
    setEmail(user.email)
    setPhone(user.phone ?? '')
    setRole(user.role)
    setTitle(user.title ?? '')
    setTruckNumber(user.truckNumber ?? '')
    setHomeAddressLine1(user.homeAddressLine1 ?? '')
    setHomeCity(user.homeCity ?? '')
    setHomeState(user.homeState ?? '')
    setHomePostalCode(user.homePostalCode ?? '')
    setHourlyEnabled(user.hourlyRateCents != null)
    setHourlyDollars(user.hourlyRateCents != null ? toDollars(user.hourlyRateCents) : '')
    setSalaryEnabled(user.annualSalaryCents != null)
    setSalaryDollars(user.annualSalaryCents != null ? toDollars(user.annualSalaryCents) : '')
    setCommissionEnabled(user.commissionPercent != null)
    setCommissionPercent(user.commissionPercent?.toString() ?? '')
    setOverrides(user.permissionOverrides ?? {})
    setError(null)
    setEditing(true)
  }

  function togglePermission(key: string, value: boolean) {
    const defaultValue = !!(rolePermissions.find((rp) => rp.role === role)?.permissions[key])
    setOverrides((current) => {
      const next = { ...current }
      if (value === defaultValue) {
        delete next[key]
      } else {
        next[key] = value
      }
      return next
    })
  }

  async function handleSave() {
    setError(null)
    try {
      await api.patch(`/users/${user.id}`, {
        name,
        email,
        phone: phone || undefined,
        role,
        title: title || null,
        truckNumber: truckNumber || null,
        homeAddressLine1: homeAddressLine1 || null,
        homeCity: homeCity || null,
        homeState: homeState || null,
        homePostalCode: homePostalCode || null,
        hourlyRateCents: hourlyEnabled && hourlyDollars ? toCents(hourlyDollars) : null,
        annualSalaryCents: salaryEnabled && salaryDollars ? toCents(salaryDollars) : null,
        commissionPercent: commissionEnabled && commissionPercent ? Number(commissionPercent) : null,
        permissionOverrides: overrides,
      })
      setEditing(false)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save technician profile')
    }
  }

  if (editing) {
    return (
      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tech-edit-name">Name</Label>
              <Input id="tech-edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="tech-edit-role">Role</Label>
              <Select id="tech-edit-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="TECHNICIAN">Technician</option>
                <option value="DISPATCHER">Dispatcher</option>
                <option value="CSR">CSR</option>
                <option value="SALES_REP">Sales Rep</option>
                <option value="ADMIN">Admin</option>
                <option value="OWNER">Owner</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tech-edit-email">Email</Label>
              <Input id="tech-edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="tech-edit-phone">Phone</Label>
              <Input id="tech-edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tech-edit-title">Title</Label>
              <Input
                id="tech-edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Installer, Sales, Service"
              />
            </div>
            <div>
              <Label htmlFor="tech-edit-truck">Truck #</Label>
              <Input id="tech-edit-truck" value={truckNumber} onChange={(e) => setTruckNumber(e.target.value)} placeholder="e.g. 12" />
            </div>
          </div>

          <div>
            <Label>Home Address / Starting Point</Label>
            <div className="space-y-2">
              <Input
                value={homeAddressLine1}
                onChange={(e) => setHomeAddressLine1(e.target.value)}
                placeholder="Street address"
              />
              <div className="grid grid-cols-3 gap-2">
                <Input value={homeCity} onChange={(e) => setHomeCity(e.target.value)} placeholder="City" />
                <Input value={homeState} onChange={(e) => setHomeState(e.target.value)} placeholder="State" />
                <Input value={homePostalCode} onChange={(e) => setHomePostalCode(e.target.value)} placeholder="ZIP" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <Label>Pay</Label>
            <div className="space-y-2">
              <PayRateField
                label="Hourly rate ($/hr)"
                enabled={hourlyEnabled}
                setEnabled={setHourlyEnabled}
                value={hourlyDollars}
                setValue={setHourlyDollars}
              />
              <PayRateField
                label="Annual salary ($/yr)"
                enabled={salaryEnabled}
                setEnabled={setSalaryEnabled}
                value={salaryDollars}
                setValue={setSalaryDollars}
              />
              <PayRateField
                label="Commission (%)"
                enabled={commissionEnabled}
                setEnabled={setCommissionEnabled}
                value={commissionPercent}
                setValue={setCommissionPercent}
                step="0.1"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">Any combination can be enabled at once (e.g. hourly + commission).</p>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <Label>Permissions</Label>
            <p className="mb-2 text-xs text-slate-500">
              Starts from the {role.replaceAll('_', ' ')} role's defaults (edit those in Settings). Checking/unchecking
              here only overrides this person.
            </p>
            <PermissionsChecklist values={effectivePermissions} onToggle={togglePermission} overriddenKeys={overriddenKeys} />
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

  const homeAddress = [user.homeAddressLine1, [user.homeCity, user.homeState].filter(Boolean).join(', '), user.homePostalCode]
    .filter(Boolean)
    .join(' · ')

  const payParts: string[] = []
  if (user.hourlyRateCents != null) payParts.push(`${formatCents(user.hourlyRateCents)}/hr`)
  if (user.annualSalaryCents != null) payParts.push(`${formatCents(user.annualSalaryCents)}/yr`)
  if (user.commissionPercent != null) payParts.push(`${user.commissionPercent}% commission`)

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{user.name}</h1>
          {user.title && <p className="text-sm text-slate-600">{user.title}</p>}
        </div>
        <Badge value={user.role} />
      </div>

      <p className="mt-2 text-sm text-slate-600">{user.email}</p>
      {user.phone && <p className="text-sm text-slate-600">{user.phone}</p>}
      {user.truckNumber && <p className="mt-1 text-sm text-slate-500">Truck #{user.truckNumber}</p>}
      {homeAddress && <p className="mt-1 text-sm text-slate-500">Starting point: {homeAddress}</p>}
      {payParts.length > 0 && <p className="mt-1 text-sm text-slate-500">Pay: {payParts.join(' + ')}</p>}

      <button type="button" onClick={startEdit} className="mt-2 cursor-pointer text-sm font-medium text-titan-600 hover:underline">
        Edit profile
      </button>
    </div>
  )
}

function PayRateField({
  label,
  enabled,
  setEnabled,
  value,
  setValue,
  step = '0.01',
}: {
  label: string
  enabled: boolean
  setEnabled: (v: boolean) => void
  value: string
  setValue: (v: string) => void
  step?: string
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="cursor-pointer" />
      <span className="w-40 text-sm text-slate-700">{label}</span>
      <div className="w-32">
        <Input type="number" step={step} value={value} onChange={(e) => setValue(e.target.value)} disabled={!enabled} />
      </div>
    </label>
  )
}
