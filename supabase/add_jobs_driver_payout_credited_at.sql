-- Idempotent flag: driver payable balance credited when delivery is confirmed.
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS driver_payout_credited_at TIMESTAMPTZ;
