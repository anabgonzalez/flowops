-- Manual, one-off seed script for trying out the Phase D dispatch board --
-- NOT a migration (not in supabase/migrations, won't run automatically).
-- Run this yourself in the Supabase SQL Editor after you've signed up the
-- 2 test accounts (a dispatcher and a service tech) mentioned in the
-- Phase D plan.
--
-- Before running: replace the two placeholder UUIDs below with the real
-- auth.users id of each test account (Team page or Supabase Auth
-- dashboard has both). This script sets their role/division/zip coverage
-- directly rather than requiring you to do it via the Team page first --
-- service_zip_codes in particular has no UI yet (a pre-existing Phase C
-- gap, not new to this).
do $$
declare
  v_dispatcher_id uuid := '00000000-0000-0000-0000-000000000000'; -- <-- replace
  v_tech_id uuid := '00000000-0000-0000-0000-000000000000';       -- <-- replace
  v_customer_id uuid;
  v_property_id uuid;
  v_job_id uuid;
  v_today date := current_date;
begin
  update user_profiles set role = 'dispatcher', division = null
    where id = v_dispatcher_id;
  update user_profiles set role = 'service_technician', division = 'service',
      service_zip_codes = array['78701']
    where id = v_tech_id;

  insert into customers (customer_type, first_name, last_name, phone, status)
    values ('residential', 'Dana', 'Demo', '5125551000', 'active')
    returning id into v_customer_id;

  insert into properties (property_type, address_line1, city, state, postal_code)
    values ('residential', '100 Congress Ave', 'Austin', 'TX', '78701')
    returning id into v_property_id;

  insert into property_customers (property_id, customer_id, relationship_type, is_primary)
    values (v_property_id, v_customer_id, 'owner', true);

  -- Unassigned
  insert into jobs (property_id, customer_id, job_type, status, priority, summary, scheduled_start, scheduled_end)
    values (v_property_id, v_customer_id, 'service', 'scheduled', 'normal', 'AC not cooling',
      v_today + time '09:00', v_today + time '10:00');

  -- Unassigned emergency (shows up in the reshuffle panel)
  insert into jobs (property_id, customer_id, job_type, status, priority, summary, scheduled_start, scheduled_end)
    values (v_property_id, v_customer_id, 'service', 'scheduled', 'emergency', 'No heat, elderly resident',
      v_today + time '11:00', v_today + time '12:00');

  -- En route: assigned, not yet on site
  insert into jobs (property_id, customer_id, job_type, status, priority, summary, scheduled_start, scheduled_end, created_by)
    values (v_property_id, v_customer_id, 'maintenance', 'dispatched', 'normal', 'Annual tune-up',
      v_today + time '13:00', v_today + time '14:00', v_dispatcher_id)
    returning id into v_job_id;
  insert into job_assignments (job_id, technician_id, is_lead) values (v_job_id, v_tech_id, true);

  -- On site ('callback' would need a parent_job_id per the DB's
  -- callback_requires_parent constraint -- using 'commercial' here
  -- instead just to show a 4th job_type color on the board).
  insert into jobs (property_id, customer_id, job_type, status, priority, summary, scheduled_start, scheduled_end, on_site_at, created_by)
    values (v_property_id, v_customer_id, 'commercial', 'in_progress', 'normal', 'HVAC inspection',
      v_today + time '08:00', v_today + time '09:00', now(), v_dispatcher_id)
    returning id into v_job_id;
  insert into job_assignments (job_id, technician_id, is_lead) values (v_job_id, v_tech_id, true);

  -- Complete
  insert into jobs (property_id, customer_id, job_type, status, priority, summary, scheduled_start, scheduled_end, completed_at, created_by)
    values (v_property_id, v_customer_id, 'install', 'completed', 'normal', 'Thermostat install',
      v_today + time '07:00', v_today + time '08:00', now(), v_dispatcher_id)
    returning id into v_job_id;
  insert into job_assignments (job_id, technician_id, is_lead) values (v_job_id, v_tech_id, true);

  raise notice 'Seed complete. Refresh the dispatch board to see it.';
end $$;
