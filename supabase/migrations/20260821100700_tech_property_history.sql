-- The Phase E tech app needs to show property/equipment history when a
-- tech opens a job -- including past jobs at that property done by a
-- *different* tech. The existing "techs read their assigned jobs" policy
-- only covers a tech's own assignments, not other jobs at the same
-- property. This adds that without loosening anything else: still scoped
-- to properties the tech is (or was) actually assigned to work at.
create policy "techs read job history for their properties" on jobs
  for select using (
    exists (
      select 1 from job_assignments ja
      join jobs j2 on j2.id = ja.job_id
      where ja.technician_id = auth.uid() and j2.property_id = jobs.property_id
    )
  );
