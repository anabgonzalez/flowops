-- jobs' "techs read/update their assigned jobs" policies query
-- job_assignments, and job_assignments' new "division staff manage
-- assignments in their division" policy queried jobs right back --
-- Postgres detects that cycle and refuses to evaluate it ("infinite
-- recursion detected in policy for relation jobs").
--
-- Fix: look up the job's division through a SECURITY DEFINER function.
-- Table owners bypass their own table's RLS by default in Postgres, and
-- this function is owned by the same role that owns `jobs`, so its
-- internal query to jobs never re-triggers jobs' RLS policies -- breaking
-- the cycle instead of just hiding it.
create or replace function public.job_in_caller_division(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from jobs j
    where j.id = p_job_id
      and (job_division(j.job_type) = current_user_division() or j.job_type = 'commercial')
  )
$$;

revoke execute on function public.job_in_caller_division(uuid) from public;
grant execute on function public.job_in_caller_division(uuid) to authenticated;

drop policy "division staff manage assignments in their division" on job_assignments;
create policy "division staff manage assignments in their division" on job_assignments
  for all using (
    current_staff_role() in ('service_manager', 'install_manager', 'field_supervisor')
    and job_in_caller_division(job_assignments.job_id)
  ) with check (
    current_staff_role() in ('service_manager', 'install_manager', 'field_supervisor')
    and job_in_caller_division(job_assignments.job_id)
  );
