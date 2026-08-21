-- =========================================================================
-- Fix: job_assignments' dispatch policy referenced the now-obsolete
-- generic 'admin'/'manager' role values directly (not through a helper
-- function), so it needs an explicit drop + recreate.
-- =========================================================================
drop policy "dispatch staff manage job_assignments" on job_assignments;

create policy "dispatch staff manage job_assignments" on job_assignments
  for all using (current_staff_role() in ('owner', 'gm', 'office_manager', 'dispatcher'))
  with check (current_staff_role() in ('owner', 'gm', 'office_manager', 'dispatcher'));

-- =========================================================================
-- Division-scoped operational access: Service Manager / Install Manager /
-- Field Supervisor manage their own division's jobs, assignments,
-- equipment, and job_equipment. Commercial jobs are visible to both
-- division managers rather than assigned to either -- see job_division().
-- job_line_items (pricing) is manager-only; supervisors get read there.
-- =========================================================================
create policy "division staff manage their division jobs" on jobs
  for all using (
    current_staff_role() in ('service_manager', 'install_manager', 'field_supervisor')
    and (job_division(job_type) = current_user_division() or job_type = 'commercial')
  ) with check (
    current_staff_role() in ('service_manager', 'install_manager', 'field_supervisor')
    and (job_division(job_type) = current_user_division() or job_type = 'commercial')
  );

create policy "division staff manage assignments in their division" on job_assignments
  for all using (
    current_staff_role() in ('service_manager', 'install_manager', 'field_supervisor')
    and exists (
      select 1 from jobs j where j.id = job_assignments.job_id
        and (job_division(j.job_type) = current_user_division() or j.job_type = 'commercial')
    )
  ) with check (
    current_staff_role() in ('service_manager', 'install_manager', 'field_supervisor')
    and exists (
      select 1 from jobs j where j.id = job_assignments.job_id
        and (job_division(j.job_type) = current_user_division() or j.job_type = 'commercial')
    )
  );

create policy "division staff manage equipment in their division" on equipment
  for all using (
    current_staff_role() in ('service_manager', 'install_manager', 'field_supervisor')
    and exists (
      select 1 from jobs j where j.property_id = equipment.property_id
        and (job_division(j.job_type) = current_user_division() or j.job_type = 'commercial')
    )
  ) with check (
    current_staff_role() in ('service_manager', 'install_manager', 'field_supervisor')
    and exists (
      select 1 from jobs j where j.property_id = equipment.property_id
        and (job_division(j.job_type) = current_user_division() or j.job_type = 'commercial')
    )
  );

create policy "division staff manage job_equipment in their division" on job_equipment
  for all using (
    current_staff_role() in ('service_manager', 'install_manager', 'field_supervisor')
    and exists (
      select 1 from jobs j where j.id = job_equipment.job_id
        and (job_division(j.job_type) = current_user_division() or j.job_type = 'commercial')
    )
  ) with check (
    current_staff_role() in ('service_manager', 'install_manager', 'field_supervisor')
    and exists (
      select 1 from jobs j where j.id = job_equipment.job_id
        and (job_division(j.job_type) = current_user_division() or j.job_type = 'commercial')
    )
  );

create policy "division managers manage line items in their division" on job_line_items
  for all using (
    current_staff_role() in ('service_manager', 'install_manager')
    and exists (
      select 1 from jobs j where j.id = job_line_items.job_id
        and (job_division(j.job_type) = current_user_division() or j.job_type = 'commercial')
    )
  ) with check (
    current_staff_role() in ('service_manager', 'install_manager')
    and exists (
      select 1 from jobs j where j.id = job_line_items.job_id
        and (job_division(j.job_type) = current_user_division() or j.job_type = 'commercial')
    )
  );

create policy "field supervisors read line items in their division" on job_line_items
  for select using (
    current_staff_role() = 'field_supervisor'
    and exists (
      select 1 from jobs j where j.id = job_line_items.job_id
        and (job_division(j.job_type) = current_user_division() or j.job_type = 'commercial')
    )
  );

-- Division staff also need to see the customer/property behind their
-- division's jobs, even though customers/properties themselves aren't
-- divided -- same shape as the existing tech-scoped read policies.
create policy "division staff read customers in their division" on customers
  for select using (
    current_staff_role() in ('service_manager', 'install_manager', 'field_supervisor')
    and exists (
      select 1 from jobs j where j.customer_id = customers.id
        and (job_division(j.job_type) = current_user_division() or j.job_type = 'commercial')
    )
  );

create policy "division staff read properties in their division" on properties
  for select using (
    current_staff_role() in ('service_manager', 'install_manager', 'field_supervisor')
    and exists (
      select 1 from jobs j where j.property_id = properties.id
        and (job_division(j.job_type) = current_user_division() or j.job_type = 'commercial')
    )
  );

create policy "division staff read property_customers in their division" on property_customers
  for select using (
    current_staff_role() in ('service_manager', 'install_manager', 'field_supervisor')
    and exists (
      select 1 from jobs j where j.property_id = property_customers.property_id
        and (job_division(j.job_type) = current_user_division() or j.job_type = 'commercial')
    )
  );

-- =========================================================================
-- Marketing Manager: lead/acquisition visibility only -- bookings,
-- customers, properties, and job status/outcome. No job_line_items
-- (pricing) or financial tables, matching the office-only division scope.
-- =========================================================================
create policy "marketing manager reads bookings" on bookings
  for select using (current_staff_role() = 'marketing_manager');

create policy "marketing manager reads customers" on customers
  for select using (current_staff_role() = 'marketing_manager');

create policy "marketing manager reads properties" on properties
  for select using (current_staff_role() = 'marketing_manager');

create policy "marketing manager reads jobs" on jobs
  for select using (current_staff_role() = 'marketing_manager');

-- =========================================================================
-- Bookkeeper needs read context (which job/customer/property an invoice
-- is for) beyond what is_billing_staff() already grants on the financial
-- tables themselves.
-- =========================================================================
create policy "finance staff read jobs" on jobs
  for select using (current_staff_role() = 'bookkeeper');

create policy "finance staff read customers" on customers
  for select using (current_staff_role() = 'bookkeeper');

create policy "finance staff read properties" on properties
  for select using (current_staff_role() = 'bookkeeper');

-- =========================================================================
-- Margin visibility on the pricebook cost-redaction view widens from
-- is_admin_or_manager() (now owner/gm only) to sees_margin() (owner, gm,
-- bookkeeper, service_manager, install_manager).
-- =========================================================================
create or replace view pricebook_items_view
with (security_invoker = true) as
select
  id, category_id, code, name, description, item_type, unit_price, is_taxable, is_active,
  case when sees_margin() then cost else null end as cost
from pricebook_items;
