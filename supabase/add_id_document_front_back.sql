-- ID / residence permit: separate front & back (like driving license).
-- Run once in Supabase SQL Editor.

ALTER TABLE public.driver_applications
  ADD COLUMN IF NOT EXISTS id_document_front_url TEXT,
  ADD COLUMN IF NOT EXISTS id_document_back_url TEXT;

-- Legacy single image → treat as front
UPDATE public.driver_applications
SET id_document_front_url = id_document_url
WHERE id_document_front_url IS NULL
  AND id_document_url IS NOT NULL;

COMMENT ON COLUMN public.driver_applications.id_document_front_url IS 'ID or residence permit – front';
COMMENT ON COLUMN public.driver_applications.id_document_back_url IS 'ID or residence permit – back';
