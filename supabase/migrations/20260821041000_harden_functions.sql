-- Pin search_path on the two trigger functions the linter flagged
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() = old.id and new.role <> old.role and not is_admin_or_manager() then
    raise exception 'cannot change your own role';
  end if;
  return new;
end;
$$;

-- These are internal RLS-policy helpers, not public API. Supabase grants
-- execute to PUBLIC by default; narrow it to authenticated only.
revoke execute on function public.current_staff_role() from public;
grant execute on function public.current_staff_role() to authenticated;

revoke execute on function public.is_office_staff() from public;
grant execute on function public.is_office_staff() to authenticated;

revoke execute on function public.is_admin_or_manager() from public;
grant execute on function public.is_admin_or_manager() to authenticated;

revoke execute on function public.is_billing_staff() from public;
grant execute on function public.is_billing_staff() to authenticated;

-- Trigger-only function; fires via the auth.users trigger regardless of
-- who's calling, so it needs no direct callers at all.
revoke execute on function public.handle_new_user() from public;
