-- Soft-delete: hide from admin orders list, keep row for reports archive.
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
