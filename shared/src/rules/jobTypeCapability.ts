import type { UserRole } from "../schemas/user.js"
import type { Division } from "../schemas/user.js"

/**
 * MVP tech-capability model for CSR booking: which staff roles can be
 * booked for a given job type. No skills table yet -- capability is
 * derived from role, matching how the DB's job_division() function
 * derives division from job_type. Revisit once Phase D needs finer-grained
 * skill matching (gas-certified, heat-pump specialist, etc.).
 *
 * 'install' bookings route to a Comfort Advisor sales consult, not an
 * install crew -- the crew gets scheduled separately once a sale closes.
 * 'commercial' is treated as service-technician work; flagged as an
 * assumption, not a confirmed business rule.
 */
export const JOB_TYPE_ASSIGNABLE_ROLES: Record<string, UserRole[]> = {
    service: ["service_technician"],
    maintenance: ["service_technician"],
    callback: ["service_technician"],
    install: ["comfort_advisor"],
    commercial: ["service_technician"],
}

export const JOB_TYPE_DIVISION: Record<string, Division | null> = {
    service: "service",
    maintenance: "service",
    callback: "service",
    install: "install",
    commercial: null,
}

export function assignableRolesForJobType(jobType: string): UserRole[] {
    return JOB_TYPE_ASSIGNABLE_ROLES[jobType] ?? []
}
