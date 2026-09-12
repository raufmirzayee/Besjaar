-- The transactional email log is support's, not the warehouse's.
--
-- 20260911130000 replaced the old is_staff() policy with a permission check,
-- but allowed `support:view` OR `orders:view`. The warehouse role holds
-- orders:view — it has to, to pick and pack — so it also got the log of every
-- message the shop has sent: recipient addresses, subjects, delivery failures.
--
-- Found by the RLS suite in supabase/tests/rls.test.sql, which asks each role
-- what it can actually read rather than what it is supposed to.
--
-- The log exists to answer "did this customer get their email?" — a support
-- and management question. `support:view` names exactly the roles whose job
-- that is: super_admin, store_manager and customer_service.
--
-- Nothing in the application loses anything: both places that read email_log
-- (the admin order detail screen, and the writer in email.server.ts) go
-- through the service-role client, which RLS does not apply to. The warehouse
-- still sees an order's email history on the order screen.

DROP POLICY IF EXISTS "Staff read email log" ON public.email_log;
CREATE POLICY "Support reads email log" ON public.email_log
  FOR SELECT TO authenticated
  USING (private.has_permission(auth.uid(), 'support', 'view'));

COMMENT ON TABLE public.email_log IS
  'Every transactional message the shop attempted, with its outcome. Readable by roles holding support:view; the admin order screen reads it through the service role.';
