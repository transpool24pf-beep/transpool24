-- Optional: suggested payout for assistant (Helfer) per job; editable in admin.
-- Run in Supabase SQL Editor after deploy.
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assistant_price_cents INTEGER;

COMMENT ON COLUMN public.jobs.assistant_price_cents IS 'Admin-set assistant (Helfer) amount in cents; used when service_type = driver_car_assistant';
