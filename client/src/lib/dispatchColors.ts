import type { JobType } from '@flowops/shared'

/** Chakra colorPalette per job type, for the dispatch board's card accent
 * and badges. Lane position already encodes status, so this is the only
 * axis color needs to carry. */
export const JOB_TYPE_COLOR: Record<JobType, string> = {
    service: 'blue',
    maintenance: 'teal',
    install: 'purple',
    callback: 'orange',
    commercial: 'gray',
}

export function formatLabel(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
