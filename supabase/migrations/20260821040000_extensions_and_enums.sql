-- Extensions
create extension if not exists pgcrypto;

-- Enum types
create type entity_class as enum ('residential', 'commercial');
create type user_role as enum ('admin', 'manager', 'dispatcher', 'csr', 'tech');
create type customer_status as enum ('active', 'inactive', 'do_not_service');
create type property_relationship as enum ('owner', 'tenant', 'property_manager', 'billing_contact');
create type equipment_status as enum ('active', 'needs_repair', 'replaced', 'removed');
create type booking_source as enum ('phone', 'web', 'referral', 'walk_in', 'membership_renewal');
create type booking_status as enum ('requested', 'confirmed', 'converted', 'cancelled');
create type job_type as enum ('service', 'maintenance', 'install', 'callback', 'commercial');
create type job_status as enum ('unscheduled', 'scheduled', 'dispatched', 'in_progress', 'completed', 'cancelled', 'on_hold');
create type job_priority as enum ('low', 'normal', 'high', 'emergency');
create type pricebook_item_type as enum ('labor', 'material', 'equipment', 'discount', 'fee');
create type invoice_status as enum ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'void');
create type payment_method as enum ('cash', 'check', 'card', 'ach', 'financing', 'other');
create type membership_status as enum ('active', 'paused', 'cancelled', 'expired');
create type billing_frequency as enum ('monthly', 'annual');

-- Shared trigger function for updated_at columns
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
