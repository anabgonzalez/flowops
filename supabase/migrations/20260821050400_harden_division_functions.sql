create or replace function public.job_division(p_job_type job_type)
returns division
language sql
immutable
set search_path = public
as $$
  select case
    when p_job_type in ('service', 'maintenance', 'callback') then 'service'::division
    when p_job_type = 'install' then 'install'::division
    else null
  end
$$;

-- Same lesson as the first hardening pass: Supabase grants EXECUTE
-- directly to anon/authenticated on new public-schema routines, not just
-- through PUBLIC membership, so it has to be revoked from anon by name.
revoke execute on function public.current_user_division() from anon;
revoke execute on function public.sees_margin() from anon;
revoke execute on function public.job_in_caller_division(uuid) from anon;
