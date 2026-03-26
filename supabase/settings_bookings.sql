-- Optional: default row for pausing customer bookings (admin can toggle in Einstellungen).
-- The app upserts this key on first PATCH from /api/admin/bookings if missing.
INSERT INTO public.settings (key, value)
VALUES ('bookings', '{"paused": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;
