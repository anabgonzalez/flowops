import { z } from "zod"

export const jobTypeSchema = z.enum(["service", "maintenance", "install", "callback", "commercial"])
export type JobType = z.infer<typeof jobTypeSchema>

export const jobStatusSchema = z.enum([
    "unscheduled",
    "scheduled",
    "dispatched",
    "in_progress",
    "completed",
    "cancelled",
    "on_hold",
])
export type JobStatus = z.infer<typeof jobStatusSchema>

export const entityClassSchema = z.enum(["residential", "commercial"])

export const customerSchema = z.object({
    id: z.string().uuid(),
    customer_type: entityClassSchema,
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    company_name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    secondary_phone: z.string().nullable(),
    status: z.enum(["active", "inactive", "do_not_service"]),
})
export type Customer = z.infer<typeof customerSchema>

export const propertySchema = z.object({
    id: z.string().uuid(),
    property_type: entityClassSchema,
    address_line1: z.string(),
    address_line2: z.string().nullable(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
})
export type Property = z.infer<typeof propertySchema>

export const jobSchema = z.object({
    id: z.string().uuid(),
    property_id: z.string().uuid(),
    customer_id: z.string().uuid(),
    booking_id: z.string().uuid().nullable(),
    parent_job_id: z.string().uuid().nullable(),
    job_type: jobTypeSchema,
    status: jobStatusSchema,
    summary: z.string(),
    description: z.string().nullable(),
    scheduled_start: z.string().nullable(),
    scheduled_end: z.string().nullable(),
})
export type Job = z.infer<typeof jobSchema>

export const membershipPlanSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.coerce.number(),
    billing_frequency: z.enum(["monthly", "annual"]),
    discount_percent: z.coerce.number(),
    is_active: z.boolean(),
})
export type MembershipPlan = z.infer<typeof membershipPlanSchema>

export const membershipSchema = z.object({
    id: z.string().uuid(),
    customer_id: z.string().uuid(),
    plan_id: z.string().uuid(),
    status: z.enum(["active", "paused", "cancelled", "expired"]),
    start_date: z.string(),
    end_date: z.string().nullable(),
})
export type Membership = z.infer<typeof membershipSchema>

/** A staff row as read for scheduling purposes -- not the full profile. */
export const schedulableStaffSchema = z.object({
    id: z.string().uuid(),
    full_name: z.string(),
    role: z.string(),
    division: z.string().nullable(),
    service_zip_codes: z.array(z.string()).nullable(),
})
export type SchedulableStaff = z.infer<typeof schedulableStaffSchema>
