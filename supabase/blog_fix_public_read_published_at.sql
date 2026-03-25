-- Fix: posts marked published but invisible on the public blog.
-- Cause: RLS required published_at <= NOW(); a wrong "published" datetime (e.g. next year)
-- hides rows from anon while admin (service role) still sees them.
-- Run once in Supabase SQL Editor after blog.sql.

DROP POLICY IF EXISTS "blog_posts_public_read" ON public.blog_posts;
CREATE POLICY "blog_posts_public_read" ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND published_at IS NOT NULL
  );

DROP POLICY IF EXISTS "blog_pages_public_read" ON public.blog_pages;
CREATE POLICY "blog_pages_public_read" ON public.blog_pages
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND published_at IS NOT NULL
  );
