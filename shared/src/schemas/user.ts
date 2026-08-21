import { z } from "zod"

export const userRoleSchema = z.enum([
    "owner",
    "gm",
    "service_manager",
    "install_manager",
    "marketing_manager",
    "office_manager",
    "dispatcher",
    "csr",
    "service_technician",
    "comfort_advisor",
    "install_crew_lead",
    "install_helper",
    "field_supervisor",
    "bookkeeper",
    "admin_warranty_coordinator",
])

export type UserRole = z.infer<typeof userRoleSchema>

export const divisionSchema = z.enum(["service", "install", "marketing", "office"])

export type Division = z.infer<typeof divisionSchema>

export const userProfileSchema = z.object({
    id: z.string().uuid(),
    full_name: z.string(),
    email: z.string().email(),
    phone: z.string().nullable(),
    role: userRoleSchema,
    division: divisionSchema.nullable(),
    is_active: z.boolean(),
    created_at: z.string(),
    service_zip_codes: z.array(z.string()).nullable(),
})

export type UserProfile = z.infer<typeof userProfileSchema>
