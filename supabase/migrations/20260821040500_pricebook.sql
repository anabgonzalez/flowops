create table pricebook_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_category_id uuid references pricebook_categories(id),
  sort_order integer not null default 0
);

create table pricebook_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references pricebook_categories(id),
  code text unique,
  name text not null,
  description text,
  item_type pricebook_item_type not null,
  unit_price numeric(10,2) not null,
  cost numeric(10,2),
  is_taxable boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on pricebook_items
  for each row execute function public.set_updated_at();

create table job_line_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  pricebook_item_id uuid references pricebook_items(id),
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(10,2) not null,
  total numeric(10,2) generated always as (quantity * unit_price) stored,
  is_approved boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
