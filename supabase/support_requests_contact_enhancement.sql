-- Extended contact fields + admin reply (run after support_requests + roadmap_foundation)
ALTER TABLE public.support_requests
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS inquiry_type text,
  ADD COLUMN IF NOT EXISTS comm_language text,
  ADD COLUMN IF NOT EXISTS page_locale text,
  ADD COLUMN IF NOT EXISTS privacy_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_reply text;

COMMENT ON COLUMN public.support_requests.phone_e164 IS 'Digits only, international (e.g. 4917629767442) for wa.me';
