// Canonical list of permission keys. Both RolePermissions.permissions and
// User.permissionOverrides are free-form JSON, but only these keys are
// accepted on write so the two can't drift into storing typo'd/unknown keys.
export const PERMISSION_KEYS = [
  'view_jobs',
  'edit_jobs',
  'delete_jobs',
  'view_customers',
  'edit_customers',
  'view_pricebook',
  'edit_pricebook',
  'view_estimates',
  'approve_estimates',
  'view_invoices',
  'edit_invoices',
  'record_payments',
  'manage_settings',
  'manage_technicians',
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]

export function sanitizePermissionsMap(value: unknown): Record<string, boolean> {
  if (typeof value !== 'object' || value === null) return {}
  const result: Record<string, boolean> = {}
  for (const key of PERMISSION_KEYS) {
    const v = (value as Record<string, unknown>)[key]
    if (typeof v === 'boolean') result[key] = v
  }
  return result
}
