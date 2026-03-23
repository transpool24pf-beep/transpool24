-- =============================================================================
-- FIX: "Save media for all languages" fails / فشل حفظ الوسائط لكل اللغات
-- =============================================================================
-- If your table was created from an old why_transpool24_locale.sql, the CHECK
-- on `locale` may only allow 6 codes (de,en,tr,fr,es,ar). The app now has 12
-- locales — bulk save then fails on e.g. ru, pl, … with a check constraint error.
--
-- Run this ONCE in Supabase → SQL Editor (same as why_transpool24_locale_extend.sql).
-- =============================================================================

ALTER TABLE public.why_transpool24_locale DROP CONSTRAINT IF EXISTS why_transpool24_locale_locale_check;

ALTER TABLE public.why_transpool24_locale ADD CONSTRAINT why_transpool24_locale_locale_check CHECK (
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
