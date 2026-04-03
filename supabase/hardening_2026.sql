-- TransPool24 hardening (run once in Supabase SQL Editor on existing projects)
-- Idempotent: safe to re-run.

-- 1) Jobs: remove anonymous INSERT (app uses service role on server only)
DROP POLICY IF EXISTS "Users can insert jobs" ON public.jobs;

-- 2) Support requests: RLS on, no policies → anon/authenticated cannot read/write via PostgREST; server service role still works
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'support_requests'
  ) THEN
    ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 3) Reminder tracking + list performance
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS last_ops_reminder_at TIMESTAMPTZ;
COMMENT ON COLUMN public.jobs.last_ops_reminder_at IS 'Last customer ops reminder email (cron)';

CREATE INDEX IF NOT EXISTS idx_jobs_created_at_desc ON public.jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_logistics_created ON public.jobs (logistics_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_payment_status ON public.jobs (payment_status);
CREATE INDEX IF NOT EXISTS idx_jobs_stripe_session ON public.jobs (stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_customer_email ON public.jobs (customer_email) WHERE customer_email IS NOT NULL;
