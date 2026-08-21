import { z } from "zod"
import { jobTypeSchema, jobStatusSchema } from "./domain.js"
import { jobPrioritySchema } from "./dispatch.js"

/** A job as shown in the tech app -- like DispatchJob, but scoped to
 * what a tech needs on their own job list rather than a dispatcher's
 * board. */
export const techJobSchema = z.object({
    id: z.string().uuid(),
    job_type: jobTypeSchema,
    status: jobStatusSchema,
    priority: jobPrioritySchema,
    summary: z.string(),
    description: z.string().nullable(),
    scheduled_start: z.string().nullable(),
    scheduled_end: z.string().nullable(),
    customer_id: z.string().uuid(),
    customer_name: z.string(),
    customer_phone: z.string().nullable(),
    property_id: z.string().uuid(),
    property_address: z.string(),
    postal_code: z.string(),
})
export type TechJob = z.infer<typeof techJobSchema>

export const equipmentSchema = z.object({
    id: z.string().uuid(),
    equipment_type: z.string(),
    manufacturer: z.string().nullable(),
    model_number: z.string().nullable(),
    serial_number: z.string().nullable(),
    install_date: z.string().nullable(),
    warranty_expires_on: z.string().nullable(),
    location_on_property: z.string().nullable(),
    status: z.string(),
})
export type Equipment = z.infer<typeof equipmentSchema>

export const pastJobSchema = z.object({
    id: z.string().uuid(),
    job_type: jobTypeSchema,
    summary: z.string(),
    status: jobStatusSchema,
    completed_at: z.string().nullable(),
})
export type PastJob = z.infer<typeof pastJobSchema>

export const jobLineItemSchema = z.object({
    id: z.string().uuid(),
    job_id: z.string().uuid(),
    description: z.string(),
    quantity: z.coerce.number(),
    unit_price: z.coerce.number(),
    total: z.coerce.number(),
    is_approved: z.boolean(),
})
export type JobLineItem = z.infer<typeof jobLineItemSchema>

/** A good/better/best tier with its total price pre-computed from the
 * package's items -- authored via SQL for now (see the Phase E plan),
 * consumed read-only by the tech app. */
export const pricebookPackageSchema = z.object({
    id: z.string().uuid(),
    tier: z.enum(["good", "better", "best"]),
    name: z.string(),
    description: z.string().nullable(),
    total_price: z.number(),
})
export type PricebookPackage = z.infer<typeof pricebookPackageSchema>

export const jobMediaSchema = z.object({
    id: z.string().uuid(),
    job_id: z.string().uuid(),
    property_id: z.string().uuid(),
    media_type: z.enum(["photo", "video"]),
    storage_path: z.string(),
    caption: z.string().nullable(),
    created_at: z.string(),
})
export type JobMedia = z.infer<typeof jobMediaSchema>

export const jobSignatureSchema = z.object({
    id: z.string().uuid(),
    job_id: z.string().uuid(),
    signer_name: z.string(),
    storage_path: z.string(),
    signed_at: z.string(),
})
export type JobSignature = z.infer<typeof jobSignatureSchema>

export const invoiceSchema = z.object({
    id: z.string().uuid(),
    job_id: z.string().uuid(),
    invoice_number: z.string(),
    status: z.string(),
    subtotal: z.coerce.number(),
    tax_amount: z.coerce.number(),
    total_amount: z.coerce.number(),
    amount_paid: z.coerce.number(),
})
export type Invoice = z.infer<typeof invoiceSchema>
