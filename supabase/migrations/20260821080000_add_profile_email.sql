-- Team page needs each member's login email. auth.users isn't exposed
-- through the API (Supabase doesn't put the auth schema on PostgREST), so
-- the standard pattern is a synced copy on user_profiles rather than
-- trying to join auth.users at query time from the client.
alter table user_profiles add column email text;

update user_profiles p
set email = u.email
from auth.users u
where u.id = p.id;

alter table user_profiles alter column email set not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, full_name, role, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'csr', new.email);
  return new;
end;
$$;

-- Keep the copy in sync if a user's login email changes later.
create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_update();
