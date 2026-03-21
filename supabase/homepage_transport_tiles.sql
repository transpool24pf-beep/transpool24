-- Homepage “transport operations” image tiles (managed in /website)
CREATE TABLE IF NOT EXISTS homepage_transport_tiles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS homepage_transport_tiles_order_idx ON homepage_transport_tiles("order");

CREATE TRIGGER update_homepage_transport_tiles_updated_at
  BEFORE UPDATE ON homepage_transport_tiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE homepage_transport_tiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read homepage_transport_tiles"
  ON homepage_transport_tiles FOR SELECT
  USING (true);
