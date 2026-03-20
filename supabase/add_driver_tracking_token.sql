-- Secret token for driver GPS share page (per job). Run in Supabase SQL Editor.
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS driver_tracking_token TEXT UNIQUE;

COMMENT ON COLUMN public.jobs.driver_tracking_token IS 'Secret for /driver/share-location — not shown to customers';

CREATE INDEX IF NOT EXISTS idx_jobs_driver_tracking_token ON public.jobs (driver_tracking_token) WHERE driver_tracking_token IS NOT NULL;
