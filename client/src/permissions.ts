export interface PermissionDef {
  key: string
  label: string
  group: string
}

// Mirrors server/src/permissions.ts - keep the key lists in sync.
export const PERMISSIONS: PermissionDef[] = [
  { key: 'view_jobs', label: 'View Jobs', group: 'Jobs' },
  { key: 'edit_jobs', label: 'Edit Jobs & Appointments', group: 'Jobs' },
  { key: 'delete_jobs', label: 'Delete Jobs', group: 'Jobs' },
  { key: 'view_customers', label: 'View Customers', group: 'Customers' },
  { key: 'edit_customers', label: 'Edit Customers & Locations', group: 'Customers' },
  { key: 'view_pricebook', label: 'View Pricebook', group: 'Pricebook' },
  { key: 'edit_pricebook', label: 'Edit Pricebook', group: 'Pricebook' },
  { key: 'view_estimates', label: 'View Estimates', group: 'Estimates & Invoices' },
  { key: 'approve_estimates', label: 'Approve/Decline Estimates', group: 'Estimates & Invoices' },
  { key: 'view_invoices', label: 'View Invoices', group: 'Estimates & Invoices' },
  { key: 'edit_invoices', label: 'Edit Invoices', group: 'Estimates & Invoices' },
  { key: 'record_payments', label: 'Record Payments', group: 'Estimates & Invoices' },
  { key: 'manage_settings', label: 'Manage Settings', group: 'Administration' },
  { key: 'manage_technicians', label: 'Manage Technicians & Permissions', group: 'Administration' },
]

export const PERMISSION_GROUPS = [...new Set(PERMISSIONS.map((p) => p.group))]
