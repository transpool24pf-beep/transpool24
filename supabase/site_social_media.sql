-- Singleton row for social profile URLs (managed in /website/social, shown in Footer)
CREATE TABLE IF NOT EXISTS site_social_media (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  instagram_url TEXT NOT NULL DEFAULT '',
  tiktok_url TEXT NOT NULL DEFAULT '',
  linkedin_url TEXT NOT NULL DEFAULT '',
  facebook_url TEXT NOT NULL DEFAULT '',
  youtube_url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_social_media (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_social_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site_social_media"
  ON site_social_media FOR SELECT
  USING (true);
