-- Admin dashboard: settings, driver profile fields, job assignment
-- Run in Supabase SQL Editor

-- Settings (key-value for prices etc.)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default pricing (admin can change from dashboard)
INSERT INTO public.settings (key, value)
VALUES (
  'pricing',
  '{"price_per_km_cents": {"XS": 80, "M": 120, "L": 200}, "driver_hourly_rate_cents": 2500}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Driver profile fields: star rating, avatar
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS star_rating NUMERIC(2,1);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Job assignment to driver
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- RLS: settings readable/updatable only via service role (no direct client access)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only settings" ON public.settings;
CREATE POLICY "Service role only settings" ON public.settings FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
