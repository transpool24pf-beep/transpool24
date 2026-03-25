-- TransPool24 editorial blog: posts, static pages, public Storage bucket.
-- Run in Supabase Dashboard → SQL Editor after schema.sql (needs uuid_generate_v4, set_updated_at).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locale TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL DEFAULT '',
  featured_image_url TEXT,
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  author_name TEXT NOT NULL DEFAULT 'TransPool24',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (locale, slug)
);

CREATE INDEX IF NOT EXISTS blog_posts_locale_status_published_idx
  ON public.blog_posts (locale, status, published_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS public.blog_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locale TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  featured_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  nav_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (locale, slug)
);

CREATE INDEX IF NOT EXISTS blog_pages_locale_status_nav_idx
  ON public.blog_pages (locale, status, nav_order, title);

-- ---------------------------------------------------------------------------
-- Triggers (set_updated_at from schema.sql)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS blog_pages_updated_at ON public.blog_pages;
CREATE TRIGGER blog_pages_updated_at
  BEFORE UPDATE ON public.blog_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: public read published only; writes via service role (admin API)
-- ---------------------------------------------------------------------------
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_posts_public_read" ON public.blog_posts;
CREATE POLICY "blog_posts_public_read" ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= NOW()
  );

DROP POLICY IF EXISTS "blog_pages_public_read" ON public.blog_pages;
CREATE POLICY "blog_pages_public_read" ON public.blog_pages
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= NOW()
  );

-- ---------------------------------------------------------------------------
-- Storage: public bucket for blog images (admin upload uses service role)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog',
  'blog',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "blog_storage_public_read" ON storage.objects;
CREATE POLICY "blog_storage_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'blog');
