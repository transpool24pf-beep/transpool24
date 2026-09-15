-- Optional driver portrait on homepage transport tiles (CMS: /website/transport)
ALTER TABLE public.homepage_transport_tiles
  ADD COLUMN IF NOT EXISTS driver_photo_url TEXT;

COMMENT ON COLUMN public.homepage_transport_tiles.driver_photo_url IS
  'Portrait of a site/approved driver shown on the popular-transport card';
