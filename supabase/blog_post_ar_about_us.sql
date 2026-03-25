-- مقال عربي «من نحن» — تخطيط مخصص في التطبيق (شعار + Lottie): AboutUsArArticle + slug أدناه.
-- شغّل من Supabase → SQL Editor. الصور: /images/123.png في public.

INSERT INTO public.blog_posts (
  locale,
  slug,
  title,
  excerpt,
  body,
  featured_image_url,
  category,
  tags,
  status,
  published_at,
  author_name,
  meta_title,
  meta_description
)
VALUES (
  'ar',
  'man-nahnu-transpool24',
  'من نحن | TransPool24 — رؤية هندسية ولوجستيات مرنة',
  'ولدنا من رؤية هندسية لإعادة صياغة اللوجستيات المرنة: Minimalist Modern، الأزرق البروسي والبرتقالي، وأتمتة كاملة من بفورتسهايم إلى ألمانيا.',
  $arabic$
<!-- المحتوى الكامل يُعرض من القالب AboutUsArArticle.tsx؛ هذا النص للأرشفة ولوحة الإدارة. -->

لم تبدأ TransPool24 كمجرد منصة للنقل، بل ولدت من رؤية هندسية تهدف إلى إعادة صياغة مفهوم «اللوجستيات المرنة»، مع فلسفة Minimalist Modern (Prussian Blue + برتقالي نابض).

**أهدافنا الاستراتيجية:** شريان رقمي يربط بفورتسهايم (Pforzheim) بالولايات الاتحادية — أتمتة كاملة، شفافية عبر دفع آمن، ومسؤولية اجتماعية (فرص عمل، دمج كفاءات، تخطي البطالة في بادن فورتمبيرغ وألمانيا).

**جزء من الدولة الاتحادية:** شركة ألمانية تنقل الثقة وتساهم في الاقتصاد واللوجستيات الرقمية الذكية.
$arabic$,
  '/images/123.png',
  'من نحن',
  ARRAY['TransPool24', 'بفورتسهايم', 'Pforzheim', 'تصميم', 'لوجستيات', 'ألمانيا']::text[],
  'published',
  NOW(),
  'فريق تحرير TransPool24',
  'من نحن | TransPool24 — الرؤية والهوية الرقمية',
  'رؤية هندسية، أهداف استراتيجية، ومسؤولية اجتماعية من قلب بفورتسهايم.'
)
ON CONFLICT (locale, slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  featured_image_url = EXCLUDED.featured_image_url,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  status = EXCLUDED.status,
  published_at = COALESCE(blog_posts.published_at, EXCLUDED.published_at),
  author_name = EXCLUDED.author_name,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  updated_at = NOW();
