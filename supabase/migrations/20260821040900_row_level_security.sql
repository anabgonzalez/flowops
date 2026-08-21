-- =========================================================================
-- user_profiles
-- =========================================================================
alter table user_profiles enable row level security;

create policy "admins manage all profiles" on user_profiles
  for all using (is_admin_or_manager()) with check (is_admin_or_manager());

create policy "users read own profile" on user_profiles
  for select using (id = auth.uid());

create policy "users update own profile" on user_profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Self-update above would otherwise let a user grant themselves any role
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.id and new.role <> old.role and not is_admin_or_manager() then
    raise exception 'cannot change your own role';
  end if;
  return new;
end;
$$;

create trigger guard_role_escalation before update on user_profiles
  for each row execute function public.prevent_role_self_escalation();

-- =========================================================================
-- customers / properties / property_customers
-- =========================================================================
alter table customers enable row level security;

create policy "office staff manage customers" on customers
  for all using (is_office_staff()) with check (is_office_staff());

create policy "techs read their job customers" on customers
  for select using (
    exists (
      select 1 from jobs j join job_assignments ja on ja.job_id = j.id
      where j.customer_id = customers.id and ja.technician_id = auth.uid()
    )
  );

alter table properties enable row level security;

create policy "office staff manage properties" on properties
  for all using (is_office_staff()) with check (is_office_staff());

create policy "techs read their job properties" on properties
  for select using (
    exists (
      select 1 from jobs j join job_assignments ja on ja.job_id = j.id
      where j.property_id = properties.id and ja.technician_id = auth.uid()
    )
  );

alter table property_customers enable row level security;

create policy "office staff manage property_customers" on property_customers
  for all using (is_office_staff()) with check (is_office_staff());

create policy "techs read property_customers for their jobs" on property_customers
  for select using (
    exists (
      select 1 from jobs j join job_assignments ja on ja.job_id = j.id
      where j.property_id = property_customers.property_id and ja.technician_id = auth.uid()
    )
  );

-- =========================================================================
-- equipment
-- =========================================================================
alter table equipment enable row level security;

create policy "office staff manage equipment" on equipment
  for all using (is_office_staff()) with check (is_office_staff());

create policy "techs read equipment for their jobs" on equipment
  for select using (
    exists (
      select 1 from jobs j join job_assignments ja on ja.job_id = j.id
      where j.property_id = equipment.property_id and ja.technician_id = auth.uid()
    )
  );

create policy "techs log equipment on their jobs" on equipment
  for insert with check (
    exists (
      select 1 from jobs j join job_assignments ja on ja.job_id = j.id
      where j.property_id = equipment.property_id and ja.technician_id = auth.uid()
    )
  );

create policy "techs update equipment on their jobs" on equipment
  for update using (
    exists (
      select 1 from jobs j join job_assignments ja on ja.job_id = j.id
      where j.property_id = equipment.property_id and ja.technician_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from jobs j join job_assignments ja on ja.job_id = j.id
      where j.property_id = equipment.property_id and ja.technician_id = auth.uid()
    )
  );

-- =========================================================================
-- bookings (office staff only -- techs have no reason to see intake)
-- =========================================================================
alter table bookings enable row level security;

create policy "office staff manage bookings" on bookings
  for all using (is_office_staff()) with check (is_office_staff());

-- =========================================================================
-- jobs / job_assignments / job_equipment / job_line_items
-- =========================================================================
alter table jobs enable row level security;

create policy "office staff manage jobs" on jobs
  for all using (is_office_staff()) with check (is_office_staff());

create policy "techs read their assigned jobs" on jobs
  for select using (
    exists (select 1 from job_assignments ja where ja.job_id = jobs.id and ja.technician_id = auth.uid())
  );

create policy "techs update their assigned jobs" on jobs
  for update using (
    exists (select 1 from job_assignments ja where ja.job_id = jobs.id and ja.technician_id = auth.uid())
  ) with check (
    exists (select 1 from job_assignments ja where ja.job_id = jobs.id and ja.technician_id = auth.uid())
  );

alter table job_assignments enable row level security;

create policy "dispatch staff manage job_assignments" on job_assignments
  for all using (current_staff_role() in ('admin', 'manager', 'dispatcher'))
  with check (current_staff_role() in ('admin', 'manager', 'dispatcher'));

create policy "csr reads job_assignments" on job_assignments
  for select using (current_staff_role() = 'csr');

create policy "techs read own assignments" on job_assignments
  for select using (technician_id = auth.uid());

alter table job_equipment enable row level security;

create policy "office staff manage job_equipment" on job_equipment
  for all using (is_office_staff()) with check (is_office_staff());

create policy "techs manage job_equipment on their jobs" on job_equipment
  for all using (
    exists (select 1 from job_assignments ja where ja.job_id = job_equipment.job_id and ja.technician_id = auth.uid())
  ) with check (
    exists (select 1 from job_assignments ja where ja.job_id = job_equipment.job_id and ja.technician_id = auth.uid())
  );

alter table job_line_items enable row level security;

create policy "office staff manage job_line_items" on job_line_items
  for all using (is_office_staff()) with check (is_office_staff());

create policy "techs manage job_line_items on their jobs" on job_line_items
  for all using (
    exists (select 1 from job_assignments ja where ja.job_id = job_line_items.job_id and ja.technician_id = auth.uid())
  ) with check (
    exists (select 1 from job_assignments ja where ja.job_id = job_line_items.job_id and ja.technician_id = auth.uid())
  );

-- =========================================================================
-- pricebook -- RLS covers row visibility only; cost is redacted by the
-- view below, not by these policies. See the artifact's RLS section for why:
-- RLS is row-level, and Supabase runs every logged-in user through one
-- Postgres role, so column-level hiding has to happen at the view/API layer.
-- =========================================================================
alter table pricebook_categories enable row level security;

create policy "admins manage pricebook_categories" on pricebook_categories
  for all using (is_admin_or_manager()) with check (is_admin_or_manager());

create policy "staff read pricebook_categories" on pricebook_categories
  for select using (current_staff_role() is not null);

alter table pricebook_items enable row level security;

create policy "admins manage pricebook_items" on pricebook_items
  for all using (is_admin_or_manager()) with check (is_admin_or_manager());

create policy "staff read pricebook_items" on pricebook_items
  for select using (current_staff_role() is not null);

-- Column-redaction view: application code should query this, not the base
-- table, anywhere a non-admin/manager context needs pricebook data.
create view pricebook_items_view
with (security_invoker = true) as
select
  id, category_id, code, name, description, item_type, unit_price, is_taxable, is_active,
  case when is_admin_or_manager() then cost else null end as cost
from pricebook_items;

-- =========================================================================
-- invoices / invoice_line_items / payments (financial -- no dispatcher, no tech)
-- =========================================================================
alter table invoices enable row level security;

create policy "billing staff manage invoices" on invoices
  for all using (is_billing_staff()) with check (is_billing_staff());

alter table invoice_line_items enable row level security;

create policy "billing staff manage invoice_line_items" on invoice_line_items
  for all using (is_billing_staff()) with check (is_billing_staff());

alter table payments enable row level security;

create policy "billing staff manage payments" on payments
  for all using (is_billing_staff()) with check (is_billing_staff());

-- =========================================================================
-- membership
-- =========================================================================
alter table membership_plans enable row level security;

create policy "admins manage membership_plans" on membership_plans
  for all using (is_admin_or_manager()) with check (is_admin_or_manager());

create policy "staff read membership_plans" on membership_plans
  for select using (current_staff_role() is not null);

alter table memberships enable row level security;

create policy "billing staff manage memberships" on memberships
  for all using (is_billing_staff()) with check (is_billing_staff());

create policy "dispatch reads memberships" on memberships
  for select using (current_staff_role() = 'dispatcher');

create policy "techs read memberships for their jobs" on memberships
  for select using (
    exists (
      select 1 from jobs j join job_assignments ja on ja.job_id = j.id
      where j.membership_id = memberships.id and ja.technician_id = auth.uid()
    )
  );

alter table membership_properties enable row level security;

create policy "billing staff manage membership_properties" on membership_properties
  for all using (is_billing_staff()) with check (is_billing_staff());

create policy "dispatch reads membership_properties" on membership_properties
  for select using (current_staff_role() = 'dispatcher');

create policy "techs read membership_properties for their jobs" on membership_properties
  for select using (
    exists (
      select 1 from jobs j join job_assignments ja on ja.job_id = j.id
      where j.property_id = membership_properties.property_id and ja.technician_id = auth.uid()
    )
  );
