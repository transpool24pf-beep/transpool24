-- Support/contact requests from drivers (Fahrernummer required, validated against driver_applications)
CREATE TABLE IF NOT EXISTS public.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_number integer NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional: index for listing by date
CREATE INDEX IF NOT EXISTS idx_support_requests_created_at ON public.support_requests (created_at DESC);
