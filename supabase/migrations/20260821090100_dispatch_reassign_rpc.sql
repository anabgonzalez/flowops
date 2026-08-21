-- Assigning/reassigning a tech is a delete-then-insert against
-- job_assignments -- doing that as two separate client calls could leave
-- a job briefly (or, on a dropped connection, permanently) unassigned
-- between them. Wrap it in one atomic function, same pattern as
-- create_booking_and_job(). Single assignee per job for the MVP dispatch
-- flow (matches how create_booking_and_job already only ever inserts one
-- lead assignment); a helper/second-tech model can layer on later.
create or replace function public.reassign_job(p_job_id uuid, p_technician_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_staff_role() not in ('owner', 'gm', 'office_manager', 'dispatcher') then
    raise exception 'not authorized to assign jobs';
  end if;

  delete from job_assignments where job_id = p_job_id;
  insert into job_assignments (job_id, technician_id, is_lead)
  values (p_job_id, p_technician_id, true);
end;
$$;

revoke execute on function public.reassign_job(uuid, uuid) from anon;
grant execute on function public.reassign_job(uuid, uuid) to authenticated;
