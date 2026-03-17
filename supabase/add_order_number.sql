-- Short order number (6–8 digits) for display and invoices
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS order_number INTEGER UNIQUE;

-- Backfill: generate 6-digit numbers for existing rows (optional, run once)
-- UPDATE public.jobs SET order_number = (100000 + (random() * 899999)::integer) WHERE order_number IS NULL;
-- Or use a sequence: CREATE SEQUENCE IF NOT EXISTS jobs_order_number_seq; ALTER TABLE jobs ALTER COLUMN order_number SET DEFAULT nextval('jobs_order_number_seq');
