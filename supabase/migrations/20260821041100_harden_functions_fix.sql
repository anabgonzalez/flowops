-- The previous migration revoked from PUBLIC, but Supabase grants EXECUTE
-- directly to anon/authenticated by default on new public-schema routines,
-- which isn't inherited through PUBLIC membership -- it has to be revoked
-- from those roles by name directly.
revoke execute on function public.current_staff_role() from anon;
revoke execute on function public.is_office_staff() from anon;
revoke execute on function public.is_admin_or_manager() from anon;
revoke execute on function public.is_billing_staff() from anon;
revoke execute on function public.handle_new_user() from anon, authenticated;
