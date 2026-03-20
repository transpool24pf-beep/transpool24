-- TransPool24 roadmap foundation: tracking, POD, multi-stop, consents, coupons, support types
-- Run in Supabase SQL Editor (idempotent where possible)

-- ---------- Jobs: ETA + last known position + Proof of Delivery ----------
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS estimated_arrival_at timestamptz,
  ADD COLUMN IF NOT EXISTS eta_minutes_remaining integer,
  ADD COLUMN IF NOT EXISTS last_driver_lat numeric(10, 7),
  ADD COLUMN IF NOT EXISTS last_driver_lng numeric(10, 7),
  ADD COLUMN IF NOT EXISTS last_driver_location_at timestamptz,
  ADD COLUMN IF NOT EXISTS pod_photo_url text,
  ADD COLUMN IF NOT EXISTS pod_signature_url text,
  ADD COLUMN IF NOT EXISTS pod_confirmation_code text,
  ADD COLUMN IF NOT EXISTS pod_completed_at timestamptz;

COMMENT ON COLUMN public.jobs.estimated_arrival_at IS 'Expected arrival at delivery (customer ETA)';
COMMENT ON COLUMN public.jobs.eta_minutes_remaining IS 'Optional remaining minutes shown to customer';
COMMENT ON COLUMN public.jobs.last_driver_lat IS 'Latest driver position (denormalized for quick map)';
COMMENT ON COLUMN public.jobs.last_driver_lng IS 'Latest driver position';
COMMENT ON COLUMN public.jobs.pod_photo_url IS 'Proof of delivery: photo URL (storage)';
COMMENT ON COLUMN public.jobs.pod_signature_url IS 'Proof of delivery: signature image URL';
COMMENT ON COLUMN public.jobs.pod_confirmation_code IS 'POD: recipient confirmation code';
COMMENT ON COLUMN public.jobs.pod_completed_at IS 'When POD was completed';

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS driver_tracking_token TEXT UNIQUE;
COMMENT ON COLUMN public.jobs.driver_tracking_token IS 'Secret for /driver/share-location page (driver GPS); not for customers';

-- ---------- Driver location history (for maps / in_transit) ----------
CREATE TABLE IF NOT EXISTS public.driver_location_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  accuracy_m numeric(10, 2),
  heading numeric(6, 2)
);

CREATE INDEX IF NOT EXISTS idx_driver_location_updates_job_recorded
  ON public.driver_location_updates (job_id, recorded_at DESC);

ALTER TABLE public.driver_location_updates ENABLE ROW LEVEL SECURITY;
-- No policies for authenticated users: only service_role (server) bypasses RLS
COMMENT ON TABLE public.driver_location_updates IS 'GPS trail per job; access only via server (service role) or token API';

-- ---------- Multi-stop / extra addresses ----------
CREATE TABLE IF NOT EXISTS public.job_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sequence_order integer NOT NULL DEFAULT 0,
  address text NOT NULL,
  city text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_stops_job ON public.job_stops (job_id, sequence_order);
ALTER TABLE public.job_stops ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.job_stops IS 'Extra stops between pickup and delivery; server-only writes';

-- ---------- GDPR / consent log (run at checkout or confirm) ----------
CREATE TABLE IF NOT EXISTS public.order_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  privacy_version text,
  terms_version text,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_consents_job ON public.order_consents (job_id);
ALTER TABLE public.order_consents ENABLE ROW LEVEL SECURITY;

-- ---------- Support: driver vs customer ----------
ALTER TABLE public.support_requests ALTER COLUMN driver_number DROP NOT NULL;

ALTER TABLE public.support_requests
  ADD COLUMN IF NOT EXISTS requester_type text NOT NULL DEFAULT 'driver'
    CHECK (requester_type IN ('driver', 'customer')),
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_email text;

COMMENT ON COLUMN public.support_requests.requester_type IS 'driver: Fahrernummer flow; customer: B2B/B2C support';

-- ---------- Coupons (loyalty / campaigns) ----------
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  percent_off integer CHECK (percent_off IS NULL OR (percent_off > 0 AND percent_off <= 100)),
  amount_off_cents integer CHECK (amount_off_cents IS NULL OR amount_off_cents >= 0),
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON public.coupon_redemptions (coupon_id);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
