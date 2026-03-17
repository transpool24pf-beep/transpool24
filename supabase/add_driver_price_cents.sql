-- Optional driver price (for group invoice); customer price remains price_cents
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS driver_price_cents INTEGER;
