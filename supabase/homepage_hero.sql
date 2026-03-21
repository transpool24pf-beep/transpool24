-- Homepage hero section (image + headline/subtitle/cta per locale), managed in /website
-- Requires: update_updated_at_column() from homepage_drivers.sql or similar
CREATE TABLE IF NOT EXISTS homepage_hero (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  image_url TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- payload: { headline: { de, en, ar, fr, es, tr }, subtitle: {...}, cta: {...} }

CREATE TRIGGER update_homepage_hero_updated_at
  BEFORE UPDATE ON homepage_hero
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE homepage_hero ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read homepage_hero"
  ON homepage_hero FOR SELECT
  USING (true);

-- Insert default row if not exists
INSERT INTO homepage_hero (id, image_url, payload)
VALUES (1, NULL, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
