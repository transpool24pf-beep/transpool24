-- Run in Supabase SQL Editor if jobs table already exists (adds duration for traffic-aware pricing)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
