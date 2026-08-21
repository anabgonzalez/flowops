-- Good/better/best tiered presentation for the tech app. pricebook_items
-- already models individual line items; this adds the missing "bundle of
-- items presented together as one tap-to-select option" layer on top.
-- Package *authoring* is out of scope for Phase E (techs only consume
-- these) -- seeded here via SQL until an admin UI exists.
create table pricebook_packages (
  id uuid primary key default gen_random_uuid(),
  job_type job_type, -- null = applies to any job type
  tier text not null check (tier in ('good', 'better', 'best')),
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table pricebook_package_items (
  package_id uuid not null references pricebook_packages(id) on delete cascade,
  pricebook_item_id uuid not null references pricebook_items(id),
  quantity numeric(10,2) not null default 1,
  primary key (package_id, pricebook_item_id)
);

alter table pricebook_packages enable row level security;
alter table pricebook_package_items enable row level security;

-- Everyone with staff access can see active packages -- this is
-- presentation data, not sensitive (cost/margin still lives on
-- pricebook_items itself, gated separately by sees_margin()).
create policy "staff read active packages" on pricebook_packages
  for select using (current_staff_role() is not null and is_active);

create policy "office staff manage packages" on pricebook_packages
  for all using (is_office_staff()) with check (is_office_staff());

create policy "staff read package items" on pricebook_package_items
  for select using (current_staff_role() is not null);

create policy "office staff manage package items" on pricebook_package_items
  for all using (is_office_staff()) with check (is_office_staff());

-- Seed a handful of example items + packages so the tech app has
-- something real to present out of the box.
insert into pricebook_items (code, name, item_type, unit_price, is_taxable) values
  ('LBR-DIAG', 'Diagnostic labor', 'labor', 89.00, true),
  ('LBR-REPAIR', 'Repair labor (1 hr)', 'labor', 145.00, true),
  ('MAT-CAP', 'Capacitor', 'material', 65.00, true),
  ('MAT-CONTACTOR', 'Contactor', 'material', 85.00, true),
  ('MAT-FILTER', 'Filter, standard', 'material', 25.00, true),
  ('LBR-TUNEUP', 'Seasonal tune-up labor', 'labor', 129.00, true),
  ('FEE-MEMBERSHIP-CREDIT', 'Membership pricing credit', 'discount', -20.00, false);

insert into pricebook_packages (job_type, tier, name, description, sort_order) values
  ('service', 'good', 'Basic Repair', 'Diagnose and repair the reported issue.', 1),
  ('service', 'better', 'Repair + New Part', 'Repair plus replacing the likely-failing part now to avoid a repeat visit.', 2),
  ('service', 'best', 'Repair + Membership Pricing', 'Repair, part replacement, and membership pricing applied today.', 3),
  ('maintenance', 'good', 'Standard Tune-Up', 'Seasonal tune-up and inspection.', 1),
  ('maintenance', 'better', 'Tune-Up + Filter', 'Tune-up plus a fresh filter.', 2),
  ('maintenance', 'best', 'Tune-Up + Membership Pricing', 'Tune-up, filter, and membership pricing applied today.', 3);

-- Wire the packages to their items via a lookup-and-insert -- kept as a
-- do block since we need each package's own id, which gen_random_uuid()
-- only assigns at insert time above.
do $$
declare
  v_diag uuid := (select id from pricebook_items where code = 'LBR-DIAG');
  v_repair uuid := (select id from pricebook_items where code = 'LBR-REPAIR');
  v_cap uuid := (select id from pricebook_items where code = 'MAT-CAP');
  v_filter uuid := (select id from pricebook_items where code = 'MAT-FILTER');
  v_tuneup uuid := (select id from pricebook_items where code = 'LBR-TUNEUP');
  v_credit uuid := (select id from pricebook_items where code = 'FEE-MEMBERSHIP-CREDIT');
  v_service_good uuid := (select id from pricebook_packages where job_type = 'service' and tier = 'good');
  v_service_better uuid := (select id from pricebook_packages where job_type = 'service' and tier = 'better');
  v_service_best uuid := (select id from pricebook_packages where job_type = 'service' and tier = 'best');
  v_maint_good uuid := (select id from pricebook_packages where job_type = 'maintenance' and tier = 'good');
  v_maint_better uuid := (select id from pricebook_packages where job_type = 'maintenance' and tier = 'better');
  v_maint_best uuid := (select id from pricebook_packages where job_type = 'maintenance' and tier = 'best');
begin
  insert into pricebook_package_items (package_id, pricebook_item_id, quantity) values
    (v_service_good, v_diag, 1), (v_service_good, v_repair, 1),
    (v_service_better, v_diag, 1), (v_service_better, v_repair, 1), (v_service_better, v_cap, 1),
    (v_service_best, v_diag, 1), (v_service_best, v_repair, 1), (v_service_best, v_cap, 1), (v_service_best, v_credit, 1),
    (v_maint_good, v_tuneup, 1),
    (v_maint_better, v_tuneup, 1), (v_maint_better, v_filter, 1),
    (v_maint_best, v_tuneup, 1), (v_maint_best, v_filter, 1), (v_maint_best, v_credit, 1);
end $$;
