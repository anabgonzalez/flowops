-- AlterTable
ALTER TABLE "User" ADD COLUMN     "annualSalaryCents" INTEGER,
ADD COLUMN     "commissionPercent" DOUBLE PRECISION,
ADD COLUMN     "homeAddressLine1" TEXT,
ADD COLUMN     "homeCity" TEXT,
ADD COLUMN     "homePostalCode" TEXT,
ADD COLUMN     "homeState" TEXT,
ADD COLUMN     "hourlyRateCents" INTEGER,
ADD COLUMN     "permissionOverrides" JSONB,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "truckNumber" TEXT;

-- CreateTable
CREATE TABLE "RolePermissions" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permissions" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RolePermissions_role_key" ON "RolePermissions"("role");

-- Seed default permission sets per role. Editable afterward in Settings.
INSERT INTO "RolePermissions" ("id", "role", "permissions", "updatedAt") VALUES
  (gen_random_uuid()::text, 'OWNER', '{
    "view_jobs": true, "edit_jobs": true, "delete_jobs": true,
    "view_customers": true, "edit_customers": true,
    "view_pricebook": true, "edit_pricebook": true,
    "view_estimates": true, "approve_estimates": true,
    "view_invoices": true, "edit_invoices": true, "record_payments": true,
    "manage_settings": true, "manage_technicians": true
  }'::jsonb, now()),
  (gen_random_uuid()::text, 'ADMIN', '{
    "view_jobs": true, "edit_jobs": true, "delete_jobs": true,
    "view_customers": true, "edit_customers": true,
    "view_pricebook": true, "edit_pricebook": true,
    "view_estimates": true, "approve_estimates": true,
    "view_invoices": true, "edit_invoices": true, "record_payments": true,
    "manage_settings": true, "manage_technicians": true
  }'::jsonb, now()),
  (gen_random_uuid()::text, 'DISPATCHER', '{
    "view_jobs": true, "edit_jobs": true, "delete_jobs": false,
    "view_customers": true, "edit_customers": true,
    "view_pricebook": true, "edit_pricebook": false,
    "view_estimates": true, "approve_estimates": false,
    "view_invoices": true, "edit_invoices": false, "record_payments": false,
    "manage_settings": false, "manage_technicians": false
  }'::jsonb, now()),
  (gen_random_uuid()::text, 'CSR', '{
    "view_jobs": true, "edit_jobs": true, "delete_jobs": false,
    "view_customers": true, "edit_customers": true,
    "view_pricebook": true, "edit_pricebook": false,
    "view_estimates": true, "approve_estimates": false,
    "view_invoices": true, "edit_invoices": true, "record_payments": true,
    "manage_settings": false, "manage_technicians": false
  }'::jsonb, now()),
  (gen_random_uuid()::text, 'SALES_REP', '{
    "view_jobs": true, "edit_jobs": false, "delete_jobs": false,
    "view_customers": true, "edit_customers": true,
    "view_pricebook": true, "edit_pricebook": false,
    "view_estimates": true, "approve_estimates": true,
    "view_invoices": true, "edit_invoices": false, "record_payments": false,
    "manage_settings": false, "manage_technicians": false
  }'::jsonb, now()),
  (gen_random_uuid()::text, 'TECHNICIAN', '{
    "view_jobs": true, "edit_jobs": true, "delete_jobs": false,
    "view_customers": true, "edit_customers": false,
    "view_pricebook": true, "edit_pricebook": false,
    "view_estimates": true, "approve_estimates": false,
    "view_invoices": true, "edit_invoices": false, "record_payments": true,
    "manage_settings": false, "manage_technicians": false
  }'::jsonb, now());
