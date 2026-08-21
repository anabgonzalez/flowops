-- Techs have no direct write access to memberships (deliberately --
-- billing staff own that table). This is a narrow, verified exception:
-- an assigned tech can enroll *their own job's customer* in a plan, and
-- nothing else -- same shape as create_booking_and_job()'s own-scope
-- SECURITY DEFINER check.
create or replace function public.enroll_membership_for_job(p_job_id uuid, p_plan_id uuid)
returns memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_membership memberships;
begin
  if not exists (
    select 1 from job_assignments ja where ja.job_id = p_job_id and ja.technician_id = auth.uid()
  ) and not is_office_staff() then
    raise exception 'not authorized for this job';
  end if;

  select customer_id into v_customer_id from jobs where id = p_job_id;
  if v_customer_id is null then
    raise exception 'job not found';
  end if;

  insert into memberships (customer_id, plan_id, status)
  values (v_customer_id, p_plan_id, 'active')
  returning * into v_membership;

  return v_membership;
end;
$$;

revoke execute on function public.enroll_membership_for_job(uuid, uuid) from anon;
grant execute on function public.enroll_membership_for_job(uuid, uuid) to authenticated;
