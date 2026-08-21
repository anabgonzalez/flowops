create table equipment (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  equipment_type text not null,
  manufacturer text,
  model_number text,
  serial_number text,
  install_date date,
  warranty_expires_on date,
  location_on_property text,
  status equipment_status not null default 'active',
  installed_by_job_id uuid, -- FK added in booking_and_job migration once jobs exists
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on equipment
  for each row execute function public.set_updated_at();
