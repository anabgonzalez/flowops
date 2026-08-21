-- user_profiles extends auth.users with app-specific fields
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role user_role not null default 'csr',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- New auth.users signups get a matching profile automatically
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'csr');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS helper functions (used by this and every later migration's policies)
create or replace function public.current_staff_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_profiles where id = auth.uid()
$$;

create or replace function public.is_office_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select current_staff_role() in ('admin', 'manager', 'dispatcher', 'csr')
$$;

create or replace function public.is_admin_or_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select current_staff_role() in ('admin', 'manager')
$$;

create or replace function public.is_billing_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select current_staff_role() in ('admin', 'manager', 'csr')
$$;
