-- Dispatch board (Phase D) needs to show "en route since 2:15pm" / "on site
-- since ..." and needs somewhere to record that the customer ETA text was
-- actually sent, so a dispatcher can't accidentally double-notify. The
-- board itself reuses the existing job_status values (scheduled/dispatched
-- -> "En Route" lane, in_progress -> "On Site", completed -> "Complete";
-- unassigned = no job_assignments row) rather than adding new status
-- values that would mean almost the same thing.
alter table jobs add column en_route_at timestamptz;
alter table jobs add column on_site_at timestamptz;
