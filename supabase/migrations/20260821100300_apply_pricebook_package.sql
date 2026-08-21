-- Techs already have full INSERT rights on job_line_items for their own
-- jobs (existing "techs manage job_line_items on their jobs" policy), so
-- this runs SECURITY INVOKER -- it needs no elevated privilege, just
-- atomicity across however many items a package contains.
create or replace function public.apply_pricebook_package(p_job_id uuid, p_package_id uuid)
returns setof job_line_items
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1 from job_assignments ja where ja.job_id = p_job_id and ja.technician_id = auth.uid()
  ) and not is_office_staff() then
    raise exception 'not authorized for this job';
  end if;

  return query
    insert into job_line_items (job_id, pricebook_item_id, description, quantity, unit_price, is_approved)
    select p_job_id, pi.id, pi.name, ppi.quantity, pi.unit_price, true
    from pricebook_package_items ppi
    join pricebook_items pi on pi.id = ppi.pricebook_item_id
    where ppi.package_id = p_package_id
    returning *;
end;
$$;

revoke execute on function public.apply_pricebook_package(uuid, uuid) from anon;
grant execute on function public.apply_pricebook_package(uuid, uuid) to authenticated;
