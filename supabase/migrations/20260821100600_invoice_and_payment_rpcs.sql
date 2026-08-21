-- invoices/invoice_line_items/payments are deliberately "no dispatcher,
-- no tech" at the RLS layer (see row_level_security.sql's comment on
-- that section) -- and that's still the right default. These two RPCs
-- are narrow, verified exceptions for the one real need: an assigned
-- tech closing out *their own job's* payment on-site, nothing broader.
create sequence if not exists invoice_number_seq;

create or replace function public.create_invoice_from_job(p_job_id uuid)
returns invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_subtotal numeric(10,2);
  v_invoice invoices;
begin
  if not exists (
    select 1 from job_assignments ja where ja.job_id = p_job_id and ja.technician_id = auth.uid()
  ) and not is_office_staff() then
    raise exception 'not authorized for this job';
  end if;

  select customer_id into v_customer_id from jobs where id = p_job_id;
  if v_customer_id is null then
    raise exception 'job not found';
  end if;

  -- No tax-rate concept exists yet in the domain model -- tax_amount is
  -- 0 for now, a known simplification rather than a guessed rate.
  select coalesce(sum(total), 0) into v_subtotal
  from job_line_items where job_id = p_job_id and is_approved;

  if v_subtotal = 0 then
    raise exception 'no approved line items to invoice';
  end if;

  insert into invoices (job_id, customer_id, invoice_number, status, subtotal, tax_amount, total_amount, issued_at)
  values (
    p_job_id, v_customer_id, 'INV-' || lpad(nextval('invoice_number_seq')::text, 6, '0'),
    'sent', v_subtotal, 0, v_subtotal, now()
  )
  returning * into v_invoice;

  insert into invoice_line_items (invoice_id, pricebook_item_id, description, quantity, unit_price, sort_order)
  select v_invoice.id, jli.pricebook_item_id, jli.description, jli.quantity, jli.unit_price, jli.sort_order
  from job_line_items jli
  where jli.job_id = p_job_id and jli.is_approved;

  return v_invoice;
end;
$$;

revoke execute on function public.create_invoice_from_job(uuid) from anon;
grant execute on function public.create_invoice_from_job(uuid) to authenticated;

create or replace function public.record_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_method payment_method,
  p_reference_number text default null
)
returns payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid;
  v_total_amount numeric(10,2);
  v_new_paid numeric(10,2);
  v_payment payments;
begin
  select job_id, total_amount into v_job_id, v_total_amount from invoices where id = p_invoice_id;
  if v_job_id is null then
    raise exception 'invoice not found';
  end if;

  if not exists (
    select 1 from job_assignments ja where ja.job_id = v_job_id and ja.technician_id = auth.uid()
  ) and not is_office_staff() then
    raise exception 'not authorized for this invoice';
  end if;

  insert into payments (invoice_id, amount, method, reference_number, recorded_by)
  values (p_invoice_id, p_amount, p_method, p_reference_number, auth.uid())
  returning * into v_payment;

  select coalesce(sum(amount), 0) into v_new_paid from payments where invoice_id = p_invoice_id;

  update invoices
  set amount_paid = v_new_paid,
      status = case when v_new_paid >= v_total_amount then 'paid' else 'partially_paid' end,
      paid_at = case when v_new_paid >= v_total_amount then now() else paid_at end
  where id = p_invoice_id;

  return v_payment;
end;
$$;

revoke execute on function public.record_payment(uuid, numeric, payment_method, text) from anon;
grant execute on function public.record_payment(uuid, numeric, payment_method, text) to authenticated;
