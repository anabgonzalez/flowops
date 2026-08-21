import {
    techJobSchema, equipmentSchema, pastJobSchema, jobLineItemSchema,
    pricebookPackageSchema, jobMediaSchema, jobSignatureSchema, invoiceSchema,
    membershipPlanSchema,
    type TechJob, type Equipment, type PastJob, type JobLineItem,
    type PricebookPackage, type JobMedia, type JobSignature, type Invoice,
    type JobType, type MembershipPlan,
} from '@flowops/shared'
import { supabase } from './supabase'
import { enqueueAction, type OutboxActionType, type OutboxHandlers } from './outbox'

/** Lets the UI say "saved" vs "queued -- will sync when back online"
 * honestly, instead of a single success state that hides which one
 * happened. */
export type SyncOutcome = 'sent' | 'queued'

const TECH_JOB_COLUMNS = `
    id, job_type, status, priority, summary, description, scheduled_start, scheduled_end,
    property_id,
    customers ( id, first_name, last_name, company_name, phone ),
    properties ( address_line1, address_line2, city, state, postal_code )
`

interface RawTechJobRow {
    id: string
    job_type: string
    status: string
    priority: string
    summary: string
    description: string | null
    scheduled_start: string | null
    scheduled_end: string | null
    property_id: string
    customers: { id: string; first_name: string | null; last_name: string | null; company_name: string | null; phone: string | null } | null
    properties: { address_line1: string; address_line2: string | null; city: string; state: string; postal_code: string } | null
}

function customerDisplayName(c: { first_name: string | null; last_name: string | null; company_name: string | null }): string {
    return c.company_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown customer'
}

function propertyAddress(p: { address_line1: string; address_line2: string | null; city: string; state: string }): string {
    const line2 = p.address_line2 ? ` ${p.address_line2}` : ''
    return `${p.address_line1}${line2}, ${p.city}, ${p.state}`
}

function toTechJob(row: RawTechJobRow): TechJob {
    return techJobSchema.parse({
        id: row.id,
        job_type: row.job_type,
        status: row.status,
        priority: row.priority,
        summary: row.summary,
        description: row.description,
        scheduled_start: row.scheduled_start,
        scheduled_end: row.scheduled_end,
        customer_id: row.customers?.id ?? '',
        customer_name: row.customers ? customerDisplayName(row.customers) : 'Unknown customer',
        customer_phone: row.customers?.phone ?? null,
        property_id: row.property_id,
        property_address: row.properties ? propertyAddress(row.properties) : 'Unknown address',
        postal_code: row.properties?.postal_code ?? '',
    })
}

/** RLS ("techs read their assigned jobs") already scopes this to the
 * caller's own assignments -- no explicit filter needed here. */
export async function listMyAssignedJobs(): Promise<TechJob[]> {
    const { data, error } = await supabase
        .from('jobs')
        .select(TECH_JOB_COLUMNS)
        .not('status', 'in', '(completed,cancelled)')
        .order('scheduled_start', { ascending: true })
    if (error) throw error
    return (data as unknown as RawTechJobRow[]).map(toTechJob)
}

export async function getJobDetail(jobId: string): Promise<TechJob> {
    const { data, error } = await supabase
        .from('jobs')
        .select(TECH_JOB_COLUMNS)
        .eq('id', jobId)
        .single()
    if (error) throw error
    return toTechJob(data as unknown as RawTechJobRow)
}

export async function getPropertyEquipment(propertyId: string): Promise<Equipment[]> {
    const { data, error } = await supabase
        .from('equipment')
        .select('id, equipment_type, manufacturer, model_number, serial_number, install_date, warranty_expires_on, location_on_property, status')
        .eq('property_id', propertyId)
    if (error) throw error
    return data.map((row) => equipmentSchema.parse(row))
}

/** Requires the "techs read job history for their properties" policy
 * (Phase E migration) -- the pre-existing tech RLS on jobs only covered
 * a tech's own assignments, not other jobs at the same property. */
export async function getPastJobsForProperty(propertyId: string, excludeJobId: string): Promise<PastJob[]> {
    const { data, error } = await supabase
        .from('jobs')
        .select('id, job_type, summary, status, completed_at')
        .eq('property_id', propertyId)
        .neq('id', excludeJobId)
        .order('completed_at', { ascending: false })
        .limit(10)
    if (error) throw error
    return data.map((row) => pastJobSchema.parse(row))
}

export async function listJobLineItems(jobId: string): Promise<JobLineItem[]> {
    const { data, error } = await supabase
        .from('job_line_items')
        .select('id, job_id, description, quantity, unit_price, total, is_approved')
        .eq('job_id', jobId)
        .order('sort_order')
    if (error) throw error
    return data.map((row) => jobLineItemSchema.parse(row))
}

interface RawPackageRow {
    id: string
    tier: string
    name: string
    description: string | null
    pricebook_package_items: { quantity: number; pricebook_items: { unit_price: number } | null }[]
}

export async function listPricebookPackages(jobType: JobType): Promise<PricebookPackage[]> {
    const { data, error } = await supabase
        .from('pricebook_packages')
        .select('id, tier, name, description, pricebook_package_items ( quantity, pricebook_items ( unit_price ) )')
        .or(`job_type.eq.${jobType},job_type.is.null`)
        .eq('is_active', true)
        .order('sort_order')
    if (error) throw error
    return (data as unknown as RawPackageRow[]).map((row) => {
        const total = row.pricebook_package_items.reduce(
            (sum, item) => sum + item.quantity * (item.pricebook_items?.unit_price ?? 0),
            0,
        )
        return pricebookPackageSchema.parse({
            id: row.id, tier: row.tier, name: row.name, description: row.description, total_price: total,
        })
    })
}

/** Tries the real request first (when the browser thinks it's online at
 * all) and only falls back to the local queue if that attempt actually
 * fails -- checking navigator.onLine alone isn't enough to "tolerate
 * poor signal": a request can still fail while onLine reports true, and
 * that failure must not lose the tech's data. */
async function attemptOrQueue<P>(
    type: OutboxActionType,
    payload: P,
    direct: (payload: P) => Promise<void>,
): Promise<SyncOutcome> {
    if (navigator.onLine) {
        try {
            await direct(payload)
            return 'sent'
        } catch {
            // fall through to queueing
        }
    }
    await enqueueAction(type, payload)
    return 'queued'
}

export async function applyPricebookPackageDirect(payload: { jobId: string; packageId: string }): Promise<void> {
    const { error } = await supabase.rpc('apply_pricebook_package', { p_job_id: payload.jobId, p_package_id: payload.packageId })
    if (error) throw error
}

export async function applyPricebookPackage(jobId: string, packageId: string): Promise<SyncOutcome> {
    return attemptOrQueue('applyPricebookPackage', { jobId, packageId }, applyPricebookPackageDirect)
}

export async function listJobMedia(jobId: string): Promise<JobMedia[]> {
    const { data, error } = await supabase
        .from('job_media')
        .select('id, job_id, property_id, media_type, storage_path, caption, created_at')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
    if (error) throw error
    return data.map((row) => jobMediaSchema.parse(row))
}

export async function getSignedMediaUrl(bucket: 'job-media' | 'signatures', path: string): Promise<string> {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600)
    if (error) throw error
    return data.signedUrl
}

interface UploadMediaPayload {
    jobId: string
    propertyId: string
    mediaType: 'photo' | 'video'
    caption: string | null
    blob: Blob
}

export async function uploadJobMediaDirect(payload: UploadMediaPayload): Promise<void> {
    const ext = payload.mediaType === 'photo' ? 'jpg' : 'mp4'
    const path = `${payload.jobId}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('job-media').upload(path, payload.blob)
    if (uploadError) throw uploadError
    const { error } = await supabase.from('job_media').insert({
        job_id: payload.jobId,
        property_id: payload.propertyId,
        media_type: payload.mediaType,
        storage_path: path,
        caption: payload.caption,
    })
    if (error) throw error
}

export async function uploadJobMedia(payload: UploadMediaPayload): Promise<SyncOutcome> {
    return attemptOrQueue('uploadMedia', payload, uploadJobMediaDirect)
}

export async function enrollMembershipDirect(payload: { jobId: string; planId: string }): Promise<void> {
    const { error } = await supabase.rpc('enroll_membership_for_job', { p_job_id: payload.jobId, p_plan_id: payload.planId })
    if (error) throw error
}

export async function enrollMembership(jobId: string, planId: string): Promise<SyncOutcome> {
    return attemptOrQueue('enrollMembership', { jobId, planId }, enrollMembershipDirect)
}

export async function flagForComfortAdvisorDirect(payload: { jobId: string; notes: string | null }): Promise<void> {
    const { error } = await supabase.rpc('flag_for_comfort_advisor', { p_job_id: payload.jobId, p_notes: payload.notes })
    if (error) throw error
}

export async function flagForComfortAdvisor(jobId: string, notes?: string): Promise<SyncOutcome> {
    return attemptOrQueue('flagForComfortAdvisor', { jobId, notes: notes ?? null }, flagForComfortAdvisorDirect)
}

interface UploadSignaturePayload {
    jobId: string
    signerName: string
    blob: Blob
}

export async function uploadSignatureDirect(payload: UploadSignaturePayload): Promise<void> {
    const path = `${payload.jobId}/${crypto.randomUUID()}.png`
    const { error: uploadError } = await supabase.storage.from('signatures').upload(path, payload.blob)
    if (uploadError) throw uploadError
    const { error } = await supabase.from('job_signatures').insert({
        job_id: payload.jobId,
        signer_name: payload.signerName,
        storage_path: path,
    })
    if (error) throw error
}

export async function uploadSignature(payload: UploadSignaturePayload): Promise<SyncOutcome> {
    return attemptOrQueue('uploadSignature', payload, uploadSignatureDirect)
}

export async function listJobSignatures(jobId: string): Promise<JobSignature[]> {
    const { data, error } = await supabase
        .from('job_signatures')
        .select('id, job_id, signer_name, storage_path, signed_at')
        .eq('job_id', jobId)
        .order('signed_at', { ascending: false })
    if (error) throw error
    return data.map((row) => jobSignatureSchema.parse(row))
}

/** Payment collection is never queued -- see the Phase E plan. Both of
 * these require live connectivity at call time; the UI should surface
 * that plainly rather than let a tech think a charge is "queued." */
export async function createInvoiceFromJob(jobId: string): Promise<Invoice> {
    const { data, error } = await supabase.rpc('create_invoice_from_job', { p_job_id: jobId })
    if (error) throw error
    return invoiceSchema.parse(data)
}

export async function recordPayment(
    invoiceId: string,
    amount: number,
    method: 'card' | 'cash' | 'check' | 'ach' | 'financing' | 'other',
    referenceNumber?: string,
): Promise<void> {
    const { error } = await supabase.rpc('record_payment', {
        p_invoice_id: invoiceId, p_amount: amount, p_method: method, p_reference_number: referenceNumber ?? null,
    })
    if (error) throw error
}

export async function listMembershipPlansForTech(): Promise<MembershipPlan[]> {
    const { data, error } = await supabase
        .from('membership_plans')
        .select('id, name, description, price, billing_frequency, discount_percent, is_active')
        .eq('is_active', true)
    if (error) throw error
    return data.map((row) => membershipPlanSchema.parse(row))
}

/** Wires the outbox's generic replay loop to this file's *Direct
 * functions -- built here (not in outbox.ts) so outbox.ts never has to
 * import this module, avoiding a circular dependency. */
export function getOutboxHandlers(): OutboxHandlers {
    return {
        applyPricebookPackage: (payload) => applyPricebookPackageDirect(payload as { jobId: string; packageId: string }),
        uploadMedia: (payload) => uploadJobMediaDirect(payload as UploadMediaPayload),
        enrollMembership: (payload) => enrollMembershipDirect(payload as { jobId: string; planId: string }),
        flagForComfortAdvisor: (payload) => flagForComfortAdvisorDirect(payload as { jobId: string; notes: string | null }),
        uploadSignature: (payload) => uploadSignatureDirect(payload as UploadSignaturePayload),
    }
}
