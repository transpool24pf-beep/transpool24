-- Add optional cargo details to jobs (dimensions, weight, type, stackable)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS cargo_details JSONB DEFAULT NULL;
