-- Techs have no INSERT rights on jobs (office staff only). A "flag for
-- Comfort Advisor" is really just creating a new unscheduled install job
-- referencing the one the tech is on -- reuses the existing jobs table
-- and the Install Manager's existing division-scoped RLS (from
-- division_scoped_policies.sql) rather than a bespoke queue/notification
-- table. No new "queue" concept needed: it's just an unassigned install
-- job the Install Manager already has visibility into.
create or replace function public.flag_for_comfort_advisor(p_job_id uuid, p_notes text default null)
returns jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property_id uuid;
  v_customer_id uuid;
  v_new_job jobs;
begin
  if not exists (
    select 1 from job_assignments ja where ja.job_id = p_job_id and ja.technician_id = auth.uid()
  ) and not is_office_staff() then
    raise exception 'not authorized for this job';
  end if;

  select property_id, customer_id into v_property_id, v_customer_id from jobs where id = p_job_id;
  if v_property_id is null then
    raise exception 'job not found';
  end if;

  insert into jobs (property_id, customer_id, parent_job_id, job_type, status, priority, summary, description, created_by)
  values (
    v_property_id, v_customer_id, p_job_id, 'install', 'unscheduled', 'normal',
    'Comfort Advisor referral', p_notes, auth.uid()
  )
  returning * into v_new_job;

  return v_new_job;
end;
$$;

revoke execute on function public.flag_for_comfort_advisor(uuid, text) from anon;
grant execute on function public.flag_for_comfort_advisor(uuid, text) to authenticated;
