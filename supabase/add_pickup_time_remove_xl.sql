-- Run in Supabase SQL Editor if jobs table already exists
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS preferred_pickup_at TIMESTAMPTZ;

-- Convert existing XL rows to L so the new constraint can be applied
UPDATE public.jobs SET cargo_size = 'L' WHERE cargo_size = 'XL';

-- Restrict cargo_size to XS, M, L only (remove XL)
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_cargo_size_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_cargo_size_check
  CHECK (cargo_size IN ('XS', 'M', 'L'));
