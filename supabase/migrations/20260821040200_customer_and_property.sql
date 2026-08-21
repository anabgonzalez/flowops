create table customers (
  id uuid primary key default gen_random_uuid(),
  customer_type entity_class not null default 'residential',
  first_name text,
  last_name text,
  company_name text,
  email text,
  phone text,
  secondary_phone text,
  billing_address_line1 text,
  billing_address_line2 text,
  billing_city text,
  billing_state text,
  billing_postal_code text,
  status customer_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_needs_company_name
    check (customer_type <> 'commercial' or company_name is not null)
);

create trigger set_updated_at before update on customers
  for each row execute function public.set_updated_at();

create table properties (
  id uuid primary key default gen_random_uuid(),
  property_type entity_class not null default 'residential',
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'US',
  latitude numeric(9,6),
  longitude numeric(9,6),
  access_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on properties
  for each row execute function public.set_updated_at();

-- The Rule 1 mechanism: dated relationship, not a foreign key either direction
create table property_customers (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete restrict,
  relationship_type property_relationship not null default 'owner',
  is_primary boolean not null default true,
  start_date date not null default current_date,
  end_date date,
  created_at timestamptz not null default now(),
  constraint end_after_start check (end_date is null or end_date >= start_date)
);

create unique index one_primary_current_customer_per_property
  on property_customers(property_id)
  where is_primary and end_date is null;
