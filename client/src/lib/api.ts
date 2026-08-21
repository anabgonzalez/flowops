import { healthResponseSchema, type HealthResponse } from "@flowops/shared"

export async function getHealth(): Promise<HealthResponse> {
    const res = await fetch("/api/health")
    return healthResponseSchema.parse(await res.json())
}
