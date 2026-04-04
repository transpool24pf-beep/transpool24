-- Email footer: contact line under social icons (order confirmation etc.)
-- Run in Supabase SQL Editor if not already applied.
ALTER TABLE site_social_media
  ADD COLUMN IF NOT EXISTS email_footer_email_primary TEXT NOT NULL DEFAULT 'transpool24pf@gmail.com',
  ADD COLUMN IF NOT EXISTS email_footer_email_secondary TEXT NOT NULL DEFAULT 'transpool24@hotmail.com';

COMMENT ON COLUMN site_social_media.email_footer_email_primary IS 'Shown in transactional email footer; Gmail icon mailto target';
COMMENT ON COLUMN site_social_media.email_footer_email_secondary IS 'Shown in transactional email footer; envelope icon mailto target';
