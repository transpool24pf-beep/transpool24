-- Extend allowed locales for editable Why page (matches app i18n routing)
ALTER TABLE why_transpool24_locale DROP CONSTRAINT IF EXISTS why_transpool24_locale_locale_check;
ALTER TABLE why_transpool24_locale ADD CONSTRAINT why_transpool24_locale_locale_check CHECK (
  locale IN (
    'de',
    'en',
    'tr',
    'fr',
    'es',
    'ar',
    'ru',
    'pl',
    'ro',
    'ku',
    'it',
    'uk'
  )
);
