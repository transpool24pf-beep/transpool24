-- Customer-requested delivery date/time (order form, admin, driver sheet).
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS preferred_delivery_at TIMESTAMPTZ;
