create table invoices (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  customer_id uuid not null references customers(id),
  invoice_number text not null unique,
  status invoice_status not null default 'draft',
  subtotal numeric(10,2) not null default 0,
  tax_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  amount_paid numeric(10,2) not null default 0,
  due_date date,
  issued_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on invoices
  for each row execute function public.set_updated_at();

create table invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  pricebook_item_id uuid references pricebook_items(id),
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(10,2) not null,
  total numeric(10,2) generated always as (quantity * unit_price) stored,
  sort_order integer not null default 0
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id),
  amount numeric(10,2) not null,
  method payment_method not null,
  reference_number text,
  paid_at timestamptz not null default now(),
  recorded_by uuid references user_profiles(id),
  notes text
);
