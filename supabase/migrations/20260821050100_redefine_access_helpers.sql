-- Existing helper functions are redefined in place (same name/signature/
-- return type) so every policy that already calls them picks up the new
-- role groupings automatically -- no policy DDL needs to change for these.

-- Broad cross-division operational staff: customer/property/booking/job
-- intake and coordination, but not pricing or financial authority.
create or replace function public.is_office_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select current_staff_role() in
    ('owner', 'gm', 'office_manager', 'dispatcher', 'csr', 'admin_warranty_coordinator')
$$;

-- Owner + GM only: user/role administration, pricebook and membership plan
-- authorship (pricing strategy stays centralized even though more roles
-- can now *see* margin -- see sees_margin() below).
create or replace function public.is_admin_or_manager()
returns boolean
language sql stable security definer set search_path = public
as $$
  select current_staff_role() in ('owner', 'gm')
$$;

-- Billing/collections operations (not pricing strategy).
create or replace function public.is_billing_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select current_staff_role() in ('owner', 'gm', 'bookkeeper', 'csr')
$$;

-- New helpers for the division model.

-- The caller's own division (null = company-wide).
create or replace function public.current_user_division()
returns division
language sql stable security definer set search_path = public
as $$
  select division from public.user_profiles where id = auth.uid()
$$;

-- Maps a job_type to the division that owns it. Commercial jobs aren't
-- assigned to one division here -- policies that use this treat
-- job_type = 'commercial' as an explicit visibility exception instead,
-- since it can be either team's work.
create or replace function public.job_division(p_job_type job_type)
returns division
language sql immutable
as $$
  select case
    when p_job_type in ('service', 'maintenance', 'callback') then 'service'::division
    when p_job_type = 'install' then 'install'::division
    else null
  end
$$;

-- Who can see pricebook.cost / margin: ownership plus whoever owns a P&L
-- for that cost -- broader than is_admin_or_manager() deliberately.
create or replace function public.sees_margin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select current_staff_role() in
    ('owner', 'gm', 'bookkeeper', 'service_manager', 'install_manager')
$$;

-- Lock down the new functions the same way the original hardening pass
-- locked down the existing ones: authenticated only, no anon RPC surface.
revoke execute on function public.current_user_division() from public;
grant execute on function public.current_user_division() to authenticated;

revoke execute on function public.sees_margin() from public;
grant execute on function public.sees_margin() to authenticated;

-- job_division() takes no reference to auth.* and returns no sensitive
-- data (it's a pure job_type -> division mapping), so it's fine to leave
-- at its default grants.
