-- Admin: hide orders from main list without deleting (archive).
-- Run in Supabase SQL Editor after deployment.

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.jobs.archived_at IS 'When set, order is archived (hidden from default admin list).';

CREATE INDEX IF NOT EXISTS idx_jobs_archived_at ON public.jobs (archived_at) WHERE archived_at IS NOT NULL;
