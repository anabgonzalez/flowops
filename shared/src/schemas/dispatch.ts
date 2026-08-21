import { z } from "zod"
import { jobTypeSchema, jobStatusSchema } from "./domain.js"

export const jobPrioritySchema = z.enum(["low", "normal", "high", "emergency"])
export type JobPriority = z.infer<typeof jobPrioritySchema>

export const jobAssignmentSchema = z.object({
    technician_id: z.string().uuid(),
    technician_name: z.string(),
    is_lead: z.boolean(),
})
export type JobAssignment = z.infer<typeof jobAssignmentSchema>

/** A job as shown on the dispatch board -- joins in just enough
 * customer/property/assignment context to render a card. Distinct from
 * the plain `jobSchema` (domain.ts) used by booking/customer-history
 * views, which don't need any of this. */
export const dispatchJobSchema = z.object({
    id: z.string().uuid(),
    job_type: jobTypeSchema,
    status: jobStatusSchema,
    priority: jobPrioritySchema,
    summary: z.string(),
    scheduled_start: z.string().nullable(),
    scheduled_end: z.string().nullable(),
    en_route_at: z.string().nullable(),
    on_site_at: z.string().nullable(),
    completed_at: z.string().nullable(),
    customer_name: z.string(),
    customer_phone: z.string().nullable(),
    property_address: z.string(),
    postal_code: z.string(),
    assignments: z.array(jobAssignmentSchema),
})
export type DispatchJob = z.infer<typeof dispatchJobSchema>

/** A candidate technician for (re)assignment, ranked by the caller. */
export const rankedTechSchema = z.object({
    id: z.string().uuid(),
    full_name: z.string(),
    role: z.string(),
    division: z.string().nullable(),
    todays_job_count: z.number().int(),
})
export type RankedTech = z.infer<typeof rankedTechSchema>
