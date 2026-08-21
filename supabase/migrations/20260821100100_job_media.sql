-- Photo/video capture from the tech app, attached to both the job and the
-- property (property_id is denormalized from jobs.property_id at insert
-- time so property-history queries don't need to join through jobs).
create table job_media (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  property_id uuid not null references properties(id),
  media_type text not null check (media_type in ('photo', 'video')),
  storage_path text not null,
  caption text,
  uploaded_by uuid references user_profiles(id),
  created_at timestamptz not null default now()
);

alter table job_media enable row level security;

create policy "office staff manage job_media" on job_media
  for all using (is_office_staff()) with check (is_office_staff());

create policy "techs manage job_media on their jobs" on job_media
  for all using (
    exists (select 1 from job_assignments ja where ja.job_id = job_media.job_id and ja.technician_id = auth.uid())
  ) with check (
    exists (select 1 from job_assignments ja where ja.job_id = job_media.job_id and ja.technician_id = auth.uid())
  );

-- Storage bucket for the actual files. Objects are stored at
-- "{job_id}/{filename}" so storage.objects policies can check access
-- from the path alone, without needing the job_media row to exist yet
-- (the client uploads the file first, then inserts the job_media row
-- pointing at it).
insert into storage.buckets (id, name, public) values ('job-media', 'job-media', false);

create policy "office staff manage job-media objects" on storage.objects
  for all to authenticated
  using (bucket_id = 'job-media' and public.is_office_staff())
  with check (bucket_id = 'job-media' and public.is_office_staff());

create policy "techs upload media for their jobs" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'job-media'
    and exists (
      select 1 from public.job_assignments ja
      where ja.technician_id = auth.uid()
        and ja.job_id::text = (storage.foldername(name))[1]
    )
  );

create policy "techs read media for their jobs" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'job-media'
    and exists (
      select 1 from public.job_assignments ja
      where ja.technician_id = auth.uid()
        and ja.job_id::text = (storage.foldername(name))[1]
    )
  );
