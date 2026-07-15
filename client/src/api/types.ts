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
export type PricebookItemType = 'SERVICE' | 'MATERIAL' | 'EQUIPMENT' | 'OTHER'
export type PricingMethod = 'FLAT_RATE' | 'TIME_AND_MATERIALS'
export type EstimateStatus = 'DRAFT' | 'PRESENTED' | 'APPROVED' | 'DECLINED'
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'VOID'
export type PaymentMethod = 'CASH' | 'CHECK' | 'CARD' | 'ACH' | 'FINANCING'
export type TagCategory = 'JOB' | 'CUSTOMER' | 'LOCATION'
export type ContactRole = 'TENANT' | 'PROPERTY_MANAGER' | 'OTHER'

export interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: Role
}

export interface Tag {
  id: string
  name: string
  color: string
  category: TagCategory
  active: boolean
}

export interface LocationContact {
  id: string
  locationId: string
  name: string
  email: string | null
  phone: string | null
  role: ContactRole
  isPrimary: boolean
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
  tags: Tag[]
  contacts: LocationContact[]
}

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  type: CustomerType
  notes: string | null
  locations: Location[]
  tags: Tag[]
}

export interface LocationWithCustomer extends Location {
  customer: Customer
}

export interface PricebookCategory {
  id: string
  name: string
  parentId: string | null
  _count: { children: number; items: number }
}

export interface PricebookItemComponent {
  id: string
  parentItemId: string
  componentItemId: string
  quantity: number
  componentItem: PricebookItem
}

export interface PricebookItem {
  id: string
  code: string
  name: string
  description: string | null
  type: PricebookItemType
  categoryId: string | null
  category: PricebookCategory | null
  costCents: number
  priceCents: number
  memberPriceCents: number | null
  addOnPriceCents: number | null
  markupPercent: number | null
  pricingMethod: PricingMethod
  laborRateCents: number | null
  estimatedDurationMinutes: number | null
  unitOfMeasure: string
  taxable: boolean
  nonDiscountable: boolean
  warrantyDurationMonths: number | null
  warrantyTerms: string | null
  vendorName: string | null
  vendorPartNumber: string | null
  imageUrl: string | null
  active: boolean
  components: PricebookItemComponent[]
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
  invoice: { id: string } | null
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

export interface JobType {
  id: string
  name: string
  defaultPriority: JobPriority
  active: boolean
}

export interface Job {
  id: string
  locationId: string
  jobTypeId: string
  jobType: JobType
  status: JobStatus
  priority: JobPriority
  summary: string
  createdAt: string
  location: LocationWithCustomer
  tags: Tag[]
  appointments: Appointment[]
  estimates: Estimate[]
  invoices: Invoice[]
}

export interface JobListItem {
  id: string
  jobTypeId: string
  jobType: JobType
  status: JobStatus
  priority: JobPriority
  summary: string
  createdAt: string
  location: LocationWithCustomer
  tags: Tag[]
  appointments: Appointment[]
}
