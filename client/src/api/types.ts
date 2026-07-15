export type CustomerType = 'RESIDENTIAL' | 'COMMERCIAL'
export type Role = 'ADMIN' | 'CSR' | 'DISPATCHER' | 'TECHNICIAN' | 'SALES_REP' | 'OWNER'
export type JobStatus = 'UNSCHEDULED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'ON_HOLD'
export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type AppointmentStatus =
  | 'SCHEDULED'
  | 'DISPATCHED'
  | 'EN_ROUTE'
  | 'ON_SITE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
export type PricebookItemType = 'SERVICE' | 'MATERIAL' | 'EQUIPMENT'
export type EstimateStatus = 'DRAFT' | 'PRESENTED' | 'APPROVED' | 'DECLINED'
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'VOID'
export type PaymentMethod = 'CASH' | 'CHECK' | 'CARD' | 'ACH' | 'FINANCING'

export interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: Role
}

export interface Location {
  id: string
  customerId: string
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string
  notes: string | null
}

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  type: CustomerType
  notes: string | null
  locations: Location[]
}

export interface LocationWithCustomer extends Location {
  customer: Customer
}

export interface PricebookItem {
  id: string
  code: string
  name: string
  description: string | null
  type: PricebookItemType
  costCents: number
  priceCents: number
  taxable: boolean
  active: boolean
}

export interface LineItem {
  id: string
  pricebookItemId: string | null
  description: string
  quantity: number
  unitPriceCents: number
  totalCents: number
}

export interface Estimate {
  id: string
  jobId: string
  name: string
  status: EstimateStatus
  subtotalCents: number
  taxCents: number
  totalCents: number
  lineItems: LineItem[]
}

export interface Payment {
  id: string
  invoiceId: string
  amountCents: number
  method: PaymentMethod
  paidAt: string
}

export interface Invoice {
  id: string
  jobId: string
  invoiceNumber: string
  status: InvoiceStatus
  subtotalCents: number
  taxCents: number
  totalCents: number
  balanceCents: number
  lineItems: LineItem[]
  payments: Payment[]
}

export interface Appointment {
  id: string
  jobId: string
  technicianId: string | null
  start: string
  end: string
  status: AppointmentStatus
  notes: string | null
  technician: User | null
}

export interface Job {
  id: string
  locationId: string
  jobType: string
  status: JobStatus
  priority: JobPriority
  summary: string
  createdAt: string
  location: LocationWithCustomer
  appointments: Appointment[]
  estimates: Estimate[]
  invoices: Invoice[]
}

export interface JobListItem {
  id: string
  jobType: string
  status: JobStatus
  priority: JobPriority
  summary: string
  createdAt: string
  location: LocationWithCustomer
  appointments: Appointment[]
}
