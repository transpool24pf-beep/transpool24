-- Run in Supabase SQL Editor if jobs table already exists (adds confirmed flow + confirmation_token)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS confirmation_token TEXT UNIQUE;

-- Allow new status 'confirmed' (drop and re-add CHECK)
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_logistics_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_logistics_status_check
  CHECK (logistics_status IN ('draft', 'confirmed', 'paid', 'assigned', 'in_transit', 'delivered', 'cancelled'));
