import {
    customerSchema, propertySchema, schedulableStaffSchema, membershipSchema,
    membershipPlanSchema, jobSchema, createBookingInputSchema,
    assignableRolesForJobType, JOB_TYPE_DIVISION,
    type Customer, type Property, type SchedulableStaff, type Membership,
    type MembershipPlan, type Job, type JobType, type CreateBookingInput,
    type AvailableSlot,
} from '@flowops/shared'
import { supabase } from './supabase'

const CUSTOMER_COLUMNS = 'id, customer_type, first_name, last_name, company_name, email, phone, secondary_phone, status'
const PROPERTY_COLUMNS = 'id, property_type, address_line1, address_line2, city, state, postal_code, latitude, longitude'

/** Numbers are stored digits-only (see createCustomer) so search never has
 * to fuzzy-match formatting -- "(512) 555-1234" and "5125551234" both
 * normalize to the same string. */
export function normalizePhone(input: string): string {
    return input.replace(/\D/g, '')
}

export function formatPhone(digits: string | null): string {
    if (!digits || digits.length !== 10) return digits ?? ''
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export interface CustomerWithProperties {
    customer: Customer
    properties: Property[]
}

export async function searchCustomersByPhone(rawPhone: string): Promise<CustomerWithProperties[]> {
    const digits = normalizePhone(rawPhone)
    if (digits.length < 7) return []

    const { data: customerRows, error } = await supabase
        .from('customers')
        .select(CUSTOMER_COLUMNS)
        .or(`phone.eq.${digits},secondary_phone.eq.${digits}`)
    if (error) throw error

    const customers = customerRows.map((row) => customerSchema.parse(row))

    return Promise.all(
        customers.map(async (customer) => {
            const { data: linkRows, error: linkError } = await supabase
                .from('property_customers')
                .select(`property_id, properties (${PROPERTY_COLUMNS})`)
                .eq('customer_id', customer.id)
                .is('end_date', null)
            if (linkError) throw linkError

            const properties = (linkRows ?? [])
                .map((row) => row.properties)
                .filter((p): p is NonNullable<typeof p> => p !== null)
                .map((row) => propertySchema.parse(row))

            return { customer, properties }
        }),
    )
}

export async function createCustomer(input: {
    firstName: string
    lastName: string
    phone: string
    email?: string
    customerType?: 'residential' | 'commercial'
    companyName?: string
}): Promise<Customer> {
    const { data, error } = await supabase
        .from('customers')
        .insert({
            first_name: input.firstName,
            last_name: input.lastName,
            phone: normalizePhone(input.phone),
            email: input.email ?? null,
            customer_type: input.customerType ?? 'residential',
            company_name: input.companyName ?? null,
        })
        .select(CUSTOMER_COLUMNS)
        .single()
    if (error) throw error
    return customerSchema.parse(data)
}

export async function createPropertyForCustomer(
    customerId: string,
    input: { addressLine1: string; addressLine2?: string; city: string; state: string; postalCode: string },
): Promise<Property> {
    const { data: property, error } = await supabase
        .from('properties')
        .insert({
            address_line1: input.addressLine1,
            address_line2: input.addressLine2 ?? null,
            city: input.city,
            state: input.state,
            postal_code: input.postalCode,
        })
        .select(PROPERTY_COLUMNS)
        .single()
    if (error) throw error

    const { error: linkError } = await supabase
        .from('property_customers')
        .insert({ property_id: property.id, customer_id: customerId, relationship_type: 'owner', is_primary: true })
    if (linkError) throw linkError

    return propertySchema.parse(property)
}

export async function listCandidateTechs(jobType: JobType, postalCode: string): Promise<SchedulableStaff[]> {
    const roles = assignableRolesForJobType(jobType)
    if (roles.length === 0) return []

    let query = supabase
        .from('user_profiles')
        .select('id, full_name, role, division, service_zip_codes')
        .in('role', roles)
        .eq('is_active', true)
        .contains('service_zip_codes', [postalCode])

    const division = JOB_TYPE_DIVISION[jobType]
    if (division) query = query.eq('division', division)

    const { data, error } = await query
    if (error) throw error
    return data.map((row) => schedulableStaffSchema.parse(row))
}

interface BusyWindow {
    start: Date
    end: Date
}

export async function listBusyWindows(technicianIds: string[]): Promise<Map<string, BusyWindow[]>> {
    const busyByTech = new Map<string, BusyWindow[]>()
    if (technicianIds.length === 0) return busyByTech

    const { data, error } = await supabase
        .from('job_assignments')
        .select('technician_id, jobs!inner(scheduled_start, scheduled_end, status)')
        .in('technician_id', technicianIds)
    if (error) throw error

    for (const row of data) {
        const job = row.jobs as unknown as { scheduled_start: string | null; scheduled_end: string | null; status: string }
        if (!job.scheduled_start || !job.scheduled_end || job.status === 'cancelled') continue
        const list = busyByTech.get(row.technician_id) ?? []
        list.push({ start: new Date(job.scheduled_start), end: new Date(job.scheduled_end) })
        busyByTech.set(row.technician_id, list)
    }
    return busyByTech
}

const BUSINESS_START_HOUR = 8
const BUSINESS_END_HOUR = 17
const SLOT_MINUTES = 60
const LOOKAHEAD_DAYS = 5
const MAX_SLOTS = 10

/** Business hours: Mon-Sat, 8am-5pm, 1-hour slots -- a reasonable field-
 * service default, not a confirmed business rule. Worth revisiting once
 * real scheduling constraints (lunch breaks, per-tech hours) matter. */
export function computeAvailableSlots(
    techs: SchedulableStaff[],
    busyByTech: Map<string, BusyWindow[]>,
): AvailableSlot[] {
    const slots: AvailableSlot[] = []
    const now = new Date()

    for (let dayOffset = 0; dayOffset < LOOKAHEAD_DAYS && slots.length < MAX_SLOTS; dayOffset++) {
        const day = new Date(now)
        day.setDate(day.getDate() + dayOffset)
        if (day.getDay() === 0) continue // skip Sundays

        for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR && slots.length < MAX_SLOTS; hour++) {
            const start = new Date(day)
            start.setHours(hour, 0, 0, 0)
            if (start <= now) continue
            const end = new Date(start.getTime() + SLOT_MINUTES * 60_000)

            for (const tech of techs) {
                if (slots.length >= MAX_SLOTS) break
                const busy = busyByTech.get(tech.id) ?? []
                const overlaps = busy.some((w) => start < w.end && end > w.start)
                if (!overlaps) {
                    slots.push({ technicianId: tech.id, technicianName: tech.full_name, start, end })
                }
            }
        }
    }

    return slots
}

export async function getActiveMembership(customerId: string): Promise<Membership | null> {
    const { data, error } = await supabase
        .from('memberships')
        .select('id, customer_id, plan_id, status, start_date, end_date')
        .eq('customer_id', customerId)
        .eq('status', 'active')
        .maybeSingle()
    if (error) throw error
    return data ? membershipSchema.parse(data) : null
}

export async function listMembershipPlans(): Promise<MembershipPlan[]> {
    const { data, error } = await supabase
        .from('membership_plans')
        .select('id, name, description, price, billing_frequency, discount_percent, is_active')
        .eq('is_active', true)
    if (error) throw error
    return data.map((row) => membershipPlanSchema.parse(row))
}

export async function createMembershipForCustomer(customerId: string, planId: string): Promise<Membership> {
    const { data, error } = await supabase
        .from('memberships')
        .insert({ customer_id: customerId, plan_id: planId, status: 'active' })
        .select('id, customer_id, plan_id, status, start_date, end_date')
        .single()
    if (error) throw error
    return membershipSchema.parse(data)
}

export async function listRecentJobsForCustomer(customerId: string): Promise<Job[]> {
    const { data, error } = await supabase
        .from('jobs')
        .select('id, property_id, customer_id, booking_id, parent_job_id, job_type, status, summary, description, scheduled_start, scheduled_end')
        .eq('customer_id', customerId)
        .neq('job_type', 'callback')
        .order('created_at', { ascending: false })
        .limit(10)
    if (error) throw error
    return data.map((row) => jobSchema.parse(row))
}

/** The full availability computation as one call, for a single useQuery. */
export async function fetchAvailableSlots(jobType: JobType, postalCode: string): Promise<AvailableSlot[]> {
    const techs = await listCandidateTechs(jobType, postalCode)
    if (techs.length === 0) return []
    const busyByTech = await listBusyWindows(techs.map((t) => t.id))
    return computeAvailableSlots(techs, busyByTech)
}

export async function createBookingAndJob(input: CreateBookingInput): Promise<Job> {
    const payload = createBookingInputSchema.parse(input)
    const { data, error } = await supabase.rpc('create_booking_and_job', payload)
    if (error) throw error
    return jobSchema.parse(data)
}
