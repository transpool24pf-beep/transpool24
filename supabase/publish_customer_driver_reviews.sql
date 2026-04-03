-- Customer ratings from rate-driver: optional publication on homepage carousel
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS customer_review_published BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS customer_driver_rated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.jobs.customer_review_published IS 'When true, this job customer rating appears in /api/public/content/drivers (homepage carousel)';
COMMENT ON COLUMN public.jobs.customer_driver_rated_at IS 'Set when customer submits rating via rate-driver';
