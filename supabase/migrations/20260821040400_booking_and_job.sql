create table bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id),
  customer_id uuid not null references customers(id),
  requested_job_type job_type,
  preferred_window_start timestamptz,
  preferred_window_end timestamptz,
  source booking_source not null default 'phone',
  status booking_status not null default 'requested',
  notes text,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on bookings
  for each row execute function public.set_updated_at();

create table jobs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id),
  customer_id uuid not null references customers(id),
  booking_id uuid references bookings(id),
  parent_job_id uuid references jobs(id),
  job_type job_type not null,
  status job_status not null default 'unscheduled',
  priority job_priority not null default 'normal',
  summary text not null,
  description text,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  completed_at timestamptz,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint callback_requires_parent
    check (job_type <> 'callback' or parent_job_id is not null)
);

create trigger set_updated_at before update on jobs
  for each row execute function public.set_updated_at();

-- Resolve equipment's forward reference now that jobs exists
alter table equipment
  add constraint equipment_installed_by_job_fk
  foreign key (installed_by_job_id) references jobs(id);

create table job_assignments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  technician_id uuid not null references user_profiles(id),
  is_lead boolean not null default false,
  assigned_at timestamptz not null default now(),
  unique (job_id, technician_id)
);

create table job_equipment (
  job_id uuid not null references jobs(id) on delete cascade,
  equipment_id uuid not null references equipment(id) on delete cascade,
  primary key (job_id, equipment_id)
);
