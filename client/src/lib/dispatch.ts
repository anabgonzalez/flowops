import {
    dispatchJobSchema, rankedTechSchema, laneForJob,
    type DispatchJob, type RankedTech, type JobType, type DispatchLane,
} from '@flowops/shared'
import { supabase } from './supabase'
import { listCandidateTechs } from './booking'

const JOB_COLUMNS = `
    id, job_type, status, priority, summary, scheduled_start, scheduled_end,
    en_route_at, on_site_at, completed_at,
    customers ( first_name, last_name, company_name, phone ),
    properties ( address_line1, address_line2, city, state, postal_code ),
    job_assignments ( technician_id, is_lead, user_profiles ( full_name ) )
`

function todayRange(): { startISO: string; endISO: string } {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { startISO: start.toISOString(), endISO: end.toISOString() }
}

function customerDisplayName(c: { first_name: string | null; last_name: string | null; company_name: string | null }): string {
    return c.company_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown customer'
}

function propertyAddress(p: { address_line1: string; address_line2: string | null; city: string; state: string }): string {
    const line2 = p.address_line2 ? ` ${p.address_line2}` : ''
    return `${p.address_line1}${line2}, ${p.city}, ${p.state}`
}

interface RawJobRow {
    id: string
    job_type: string
    status: string
    priority: string
    summary: string
    scheduled_start: string | null
    scheduled_end: string | null
    en_route_at: string | null
    on_site_at: string | null
    completed_at: string | null
    customers: { first_name: string | null; last_name: string | null; company_name: string | null; phone: string | null } | null
    properties: { address_line1: string; address_line2: string | null; city: string; state: string; postal_code: string } | null
    job_assignments: { technician_id: string; is_lead: boolean; user_profiles: { full_name: string } | null }[]
}

function toDispatchJob(row: RawJobRow): DispatchJob {
    return dispatchJobSchema.parse({
        id: row.id,
        job_type: row.job_type,
        status: row.status,
        priority: row.priority,
        summary: row.summary,
        scheduled_start: row.scheduled_start,
        scheduled_end: row.scheduled_end,
        en_route_at: row.en_route_at,
        on_site_at: row.on_site_at,
        completed_at: row.completed_at,
        customer_name: row.customers ? customerDisplayName(row.customers) : 'Unknown customer',
        customer_phone: row.customers?.phone ?? null,
        property_address: row.properties ? propertyAddress(row.properties) : 'Unknown address',
        postal_code: row.properties?.postal_code ?? '',
        assignments: row.job_assignments.map((a) => ({
            technician_id: a.technician_id,
            technician_name: a.user_profiles?.full_name ?? 'Unknown tech',
            is_lead: a.is_lead,
        })),
    })
}

/** Today's jobs for the dispatch board -- on_hold/cancelled are excluded,
 * they don't belong on a same-day board. */
export async function listTodaysJobs(): Promise<DispatchJob[]> {
    const { startISO, endISO } = todayRange()
    const { data, error } = await supabase
        .from('jobs')
        .select(JOB_COLUMNS)
        .gte('scheduled_start', startISO)
        .lt('scheduled_start', endISO)
        .not('status', 'in', '(cancelled,on_hold)')
        .order('scheduled_start', { ascending: true })
    if (error) throw error
    return (data as unknown as RawJobRow[]).map(toDispatchJob)
}

export function laneJobs(jobs: DispatchJob[], lane: DispatchLane): DispatchJob[] {
    return jobs.filter((j) => laneForJob(j) === lane)
}

export function emergencyUnassignedJobs(jobs: DispatchJob[]): DispatchJob[] {
    return jobs.filter((j) => j.priority === 'emergency' && j.assignments.length === 0)
}

async function todaysJobCounts(technicianIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>()
    if (technicianIds.length === 0) return counts

    const { startISO, endISO } = todayRange()
    const { data, error } = await supabase
        .from('job_assignments')
        .select('technician_id, jobs!inner(scheduled_start, status)')
        .in('technician_id', technicianIds)
    if (error) throw error

    for (const row of data) {
        const job = row.jobs as unknown as { scheduled_start: string | null; status: string }
        if (!job.scheduled_start) continue
        if (job.status === 'cancelled' || job.status === 'on_hold') continue
        if (job.scheduled_start < startISO || job.scheduled_start >= endISO) continue
        counts.set(row.technician_id, (counts.get(row.technician_id) ?? 0) + 1)
    }
    return counts
}

/** Ranks candidate techs for a job by proximity (zip coverage, hard
 * filter) and role/division match (also a hard filter -- both reuse the
 * same Phase C rules), then by fewest jobs already on their plate today.
 * Not a schedule optimizer -- lightest-load-first is the whole ranking. */
export async function rankCandidateTechs(jobType: JobType, postalCode: string): Promise<RankedTech[]> {
    const candidates = await listCandidateTechs(jobType, postalCode)
    if (candidates.length === 0) return []

    const counts = await todaysJobCounts(candidates.map((c) => c.id))
    return candidates
        .map((c) => rankedTechSchema.parse({
            id: c.id,
            full_name: c.full_name,
            role: c.role,
            division: c.division,
            todays_job_count: counts.get(c.id) ?? 0,
        }))
        .sort((a, b) => a.todays_job_count - b.todays_job_count)
}

/** Assign or reassign a job's tech -- atomic on the DB side (delete +
 * insert in one transaction) so a job is never left half-reassigned. */
export async function assignTech(jobId: string, technicianId: string): Promise<void> {
    const { error } = await supabase.rpc('reassign_job', { p_job_id: jobId, p_technician_id: technicianId })
    if (error) throw error
}

export async function unassignAllTechs(jobId: string): Promise<void> {
    const { error } = await supabase.from('job_assignments').delete().eq('job_id', jobId)
    if (error) throw error
}

export async function markOnSite(jobId: string): Promise<void> {
    const { error } = await supabase
        .from('jobs')
        .update({ status: 'in_progress', on_site_at: new Date().toISOString() })
        .eq('id', jobId)
    if (error) throw error
}

export async function markComplete(jobId: string): Promise<void> {
    const { error } = await supabase
        .from('jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', jobId)
    if (error) throw error
}

/** Drag a card back to the En Route lane from On Site or Complete --
 * clears whichever later-stage timestamp was set. Doesn't touch
 * en_route_at: dragging back shouldn't re-trigger (or imply re-sending)
 * the ETA text. */
export async function revertToEnRoute(jobId: string): Promise<void> {
    const { error } = await supabase
        .from('jobs')
        .update({ status: 'dispatched', on_site_at: null, completed_at: null })
        .eq('id', jobId)
    if (error) throw error
}

export async function moveJobToLane(job: DispatchJob, targetLane: DispatchLane): Promise<void> {
    switch (targetLane) {
        case 'unassigned':
            return unassignAllTechs(job.id)
        case 'en_route':
            return revertToEnRoute(job.id)
        case 'on_site':
            return markOnSite(job.id)
        case 'complete':
            return markComplete(job.id)
    }
}

export interface SendEtaResult {
    ok: boolean
    message: string
}

/** Sends the "tech is on the way" text via the send-eta-sms Edge
 * Function (Twilio call happens server-side there, never in the
 * browser). Returns ok:false with a human-readable message rather than
 * throwing when Twilio isn't configured yet, so the board can show that
 * inline instead of a raw error. */
export async function sendEtaNotification(jobId: string): Promise<SendEtaResult> {
    const { data, error } = await supabase.functions.invoke('send-eta-sms', { body: { job_id: jobId } })
    if (error) throw error
    return data as SendEtaResult
}
