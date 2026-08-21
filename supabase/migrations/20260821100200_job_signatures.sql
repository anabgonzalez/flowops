-- Customer signature captured at the point of payment/completion. Kept as
-- its own table (rather than folded into job_media) since it's a
-- distinct, single, legally-relevant artifact per job rather than an
-- open-ended gallery of photos/videos.
create table job_signatures (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  signer_name text not null,
  storage_path text not null,
  signed_at timestamptz not null default now()
);

alter table job_signatures enable row level security;

create policy "office staff manage job_signatures" on job_signatures
  for all using (is_office_staff()) with check (is_office_staff());

create policy "techs manage job_signatures on their jobs" on job_signatures
  for all using (
    exists (select 1 from job_assignments ja where ja.job_id = job_signatures.job_id and ja.technician_id = auth.uid())
  ) with check (
    exists (select 1 from job_assignments ja where ja.job_id = job_signatures.job_id and ja.technician_id = auth.uid())
  );

insert into storage.buckets (id, name, public) values ('signatures', 'signatures', false);

create policy "office staff manage signature objects" on storage.objects
  for all to authenticated
  using (bucket_id = 'signatures' and public.is_office_staff())
  with check (bucket_id = 'signatures' and public.is_office_staff());

create policy "techs upload signatures for their jobs" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'signatures'
    and exists (
      select 1 from public.job_assignments ja
      where ja.technician_id = auth.uid()
        and ja.job_id::text = (storage.foldername(name))[1]
    )
  );

create policy "techs read signatures for their jobs" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'signatures'
    and exists (
      select 1 from public.job_assignments ja
      where ja.technician_id = auth.uid()
        and ja.job_id::text = (storage.foldername(name))[1]
    )
  );
