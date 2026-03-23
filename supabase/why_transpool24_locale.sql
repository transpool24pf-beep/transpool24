-- Editable "Why TransPool24?" long-form page (per locale), managed in /website
-- Must match src/i18n/routing.ts `locales`.
-- Re-runnable in SQL Editor (DROP TRIGGER/POLICY IF EXISTS before create).
-- Already have the table and only need more locale codes? Use FIX_why_save_all_languages.sql only.
CREATE TABLE IF NOT EXISTS why_transpool24_locale (
  locale TEXT PRIMARY KEY CHECK (
    locale IN ('de', 'en', 'tr', 'fr', 'es', 'ar', 'ru', 'pl', 'ro', 'ku', 'it', 'uk')
  ),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent: safe if you re-run this script in SQL Editor
DROP TRIGGER IF EXISTS update_why_transpool24_locale_updated_at ON why_transpool24_locale;
CREATE TRIGGER update_why_transpool24_locale_updated_at
  BEFORE UPDATE ON why_transpool24_locale
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE why_transpool24_locale ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read why_transpool24_locale" ON why_transpool24_locale;
CREATE POLICY "Public can read why_transpool24_locale"
  ON why_transpool24_locale FOR SELECT
  USING (true);
