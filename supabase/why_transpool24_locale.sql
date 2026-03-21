-- Editable "Why TransPool24?" long-form page (per locale), managed in /website
CREATE TABLE IF NOT EXISTS why_transpool24_locale (
  locale TEXT PRIMARY KEY CHECK (locale IN ('de', 'en', 'tr', 'fr', 'es', 'ar')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_why_transpool24_locale_updated_at
  BEFORE UPDATE ON why_transpool24_locale
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE why_transpool24_locale ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read why_transpool24_locale"
  ON why_transpool24_locale FOR SELECT
  USING (true);
