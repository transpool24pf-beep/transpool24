-- Run this in Supabase SQL Editor if jobs table already exists (adds customer_email for invoice emails)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS customer_email TEXT;
