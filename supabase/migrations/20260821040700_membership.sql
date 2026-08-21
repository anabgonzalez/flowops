create table membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  billing_frequency billing_frequency not null,
  visits_included_per_year integer not null default 0,
  discount_percent numeric(5,2) not null default 0,
  is_active boolean not null default true
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  plan_id uuid not null references membership_plans(id),
  status membership_status not null default 'active',
  start_date date not null default current_date,
  end_date date,
  auto_renew boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on memberships
  for each row execute function public.set_updated_at();

create table membership_properties (
  membership_id uuid not null references memberships(id) on delete cascade,
  property_id uuid not null references properties(id),
  covered_from date not null default current_date,
  covered_until date,
  primary key (membership_id, property_id)
);

-- Resolve jobs' forward reference now that memberships exists
alter table jobs add column membership_id uuid references memberships(id);
