import { z } from "zod"

export const healthResponseSchema = z.discriminatedUnion("success", [
    z.object({ success: z.literal(true), dbTime: z.string() }),
    z.object({ success: z.literal(false), message: z.string() }),
])

export type HealthResponse = z.infer<typeof healthResponseSchema>
