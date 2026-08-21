-- MVP tech-capability/zip filtering for CSR booking (Phase C): capability
-- is derived from role+division in application code (no skills table yet
-- -- see the Phase C plan for why), but zip coverage needs somewhere to
-- live, and there's no such column anywhere on user_profiles.
alter table user_profiles add column service_zip_codes text[];

comment on column user_profiles.service_zip_codes is
  'MVP zip-coverage list for booking-availability filtering. Manually maintained per tech until distance-based routing replaces it in a later phase.';

-- CSR/dispatcher/office staff need to read *other* staff profiles to build
-- the availability view (name, role, division, zip coverage) -- until now
-- user_profiles only let you read your own row or, for owner/gm, everyone's.
create policy "office staff read profiles for scheduling" on user_profiles
  for select using (is_office_staff());

-- Booking confirmation needs to atomically create a booking, its job, and
-- the job's technician assignment -- three inserts that must succeed or
-- fail together, not three separate client-side calls that could leave a
-- booking with no assignment if the connection drops mid-flow.
--
-- This is SECURITY DEFINER rather than relying on per-table RLS for the
-- job_assignments insert specifically: CSR can create jobs directly (via
-- is_office_staff()) but deliberately has no direct INSERT policy on
-- job_assignments -- per the confirmed Phase C design, CSR books through
-- this controlled path only; ad-hoc assignment writes stay a
-- dispatcher/manager privilege for day-of changes. The function enforces
-- its own authorization check rather than depending on the caller's raw
-- table grants.
create or replace function public.create_booking_and_job(
  p_property_id uuid,
  p_customer_id uuid,
  p_job_type job_type,
  p_technician_id uuid,
  p_scheduled_start timestamptz,
  p_scheduled_end timestamptz,
  p_summary text,
  p_parent_job_id uuid default null,
  p_description text default null
)
returns jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid;
  v_job jobs;
begin
  if not is_office_staff() then
    raise exception 'not authorized to create bookings';
  end if;

  insert into bookings (property_id, customer_id, requested_job_type, status, created_by)
  values (p_property_id, p_customer_id, p_job_type, 'converted', auth.uid())
  returning id into v_booking_id;

  insert into jobs (
    property_id, customer_id, booking_id, parent_job_id, job_type,
    status, summary, description, scheduled_start, scheduled_end, created_by
  )
  values (
    p_property_id, p_customer_id, v_booking_id, p_parent_job_id, p_job_type,
    'scheduled', p_summary, p_description, p_scheduled_start, p_scheduled_end, auth.uid()
  )
  returning * into v_job;

  insert into job_assignments (job_id, technician_id, is_lead)
  values (v_job.id, p_technician_id, true);

  return v_job;
end;
$$;

revoke execute on function public.create_booking_and_job(
  uuid, uuid, job_type, uuid, timestamptz, timestamptz, text, uuid, text
) from anon;
grant execute on function public.create_booking_and_job(
  uuid, uuid, job_type, uuid, timestamptz, timestamptz, text, uuid, text
) to authenticated;
