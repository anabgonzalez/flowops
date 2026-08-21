import type { DispatchJob } from "../schemas/dispatch.js"

export type DispatchLane = "unassigned" | "en_route" | "on_site" | "complete"

/**
 * Maps a job onto one of the 4 dispatch-board lanes. Deliberately reuses
 * the existing job_status values (unscheduled/scheduled/dispatched all
 * fold into "en_route" once a tech is assigned) rather than adding new
 * status values that would mean almost the same thing -- see the
 * 20260821090000_dispatch_board_timestamps.sql migration comment.
 * on_hold/cancelled jobs are expected to already be filtered out by the
 * caller (they don't belong on the board at all).
 */
export function laneForJob(job: Pick<DispatchJob, "status" | "assignments">): DispatchLane {
    if (job.status === "completed") return "complete"
    if (job.status === "in_progress") return "on_site"
    if (job.assignments.length === 0) return "unassigned"
    return "en_route"
}
