-- Table for managing homepage driver testimonials
CREATE TABLE IF NOT EXISTS homepage_drivers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  photo TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ordering
CREATE INDEX IF NOT EXISTS homepage_drivers_order_idx ON homepage_drivers("order");

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_homepage_drivers_updated_at
  BEFORE UPDATE ON homepage_drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Allow public read, admin write
ALTER TABLE homepage_drivers ENABLE ROW LEVEL SECURITY;

-- Public can read
CREATE POLICY "Public can read homepage_drivers"
  ON homepage_drivers FOR SELECT
  USING (true);

-- Only authenticated admin can write (you'll need to set up admin auth in Supabase)
-- For now, we'll use service role in API routes, so this is optional
-- CREATE POLICY "Admin can write homepage_drivers"
--   ON homepage_drivers FOR ALL
--   USING (auth.role() = 'service_role');
