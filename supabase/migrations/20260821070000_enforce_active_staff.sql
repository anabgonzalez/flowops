-- user_profiles.is_active existed from the start but nothing ever checked
-- it -- a deactivated user kept full RLS access under their old role,
-- since every policy is gated through current_staff_role() and that
-- function never looked at is_active. Fixing it here cascades correctly
-- everywhere: an inactive user's role resolves to null, which fails
-- every `current_staff_role() in (...)` / `= 'x'` check across every
-- table's policies, without touching any of those policies individually.
create or replace function public.current_staff_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_profiles where id = auth.uid() and is_active
$$;
