import { z } from "zod"
import { jobTypeSchema } from "./domain.js"

/** Payload for the create_booking_and_job() RPC -- kept in sync with its
 * SQL parameter list by hand; see supabase/migrations/20260821060000_booking_support.sql. */
export const createBookingInputSchema = z.object({
    p_property_id: z.string().uuid(),
    p_customer_id: z.string().uuid(),
    p_job_type: jobTypeSchema,
    p_technician_id: z.string().uuid(),
    p_scheduled_start: z.string(),
    p_scheduled_end: z.string(),
    p_summary: z.string().min(1),
    p_parent_job_id: z.string().uuid().nullable().optional(),
    p_description: z.string().nullable().optional(),
})
export type CreateBookingInput = z.infer<typeof createBookingInputSchema>

export interface AvailableSlot {
    technicianId: string
    technicianName: string
    start: Date
    end: Date
}
