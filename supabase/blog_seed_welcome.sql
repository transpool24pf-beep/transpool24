-- Optional welcome posts so the magazine is not empty after go-live.
-- Run after blog.sql. Safe to run once; delete rows manually if you prefer a blank slate.
-- Arabic «أهلاً» row: after first seed, run blog_post_ar_ahlan_future_vision.sql for the full vision article + images.

INSERT INTO public.blog_posts (
  locale, slug, title, excerpt, body, category, tags, status, published_at, author_name, meta_title, meta_description
)
VALUES
(
  'de',
  'willkommen-transpool24-magazin',
  'Willkommen im TransPool24 Magazin',
  'Einordnung zu Transport, Märkten und Logistik — redaktionell, unabhängig von der Buchung.',
  E'# Willkommen\n\nHier veröffentlichen wir **Hintergründe und Analysen** zu Themen wie Kraftstoffpreisen, Strecken, Branchendynamik und Marktentwicklungen.\n\n- Fokus: Deutschland und Europa  \n- Getrennt von unserem Buchungsprodukt auf der [Hauptwebsite](/de)\n\n> Hinweis: Die Beiträge dienen der Information und ersetzen keine Rechts- oder Steuerberatung.\n',
  'Editorial',
  ARRAY['logistik', 'einordnung']::text[],
  'published',
  NOW(),
  'TransPool24',
  'TransPool24 Magazin — Logistik & Transport',
  'Redaktionelle Einordnung zu Transport, Märkten und Logistik.'
),
(
  'en',
  'welcome-transpool24-magazine',
  'Welcome to the TransPool24 Magazine',
  'Editorial context on transport, markets, and logistics — separate from booking.',
  E'# Welcome\n\nWe publish **analysis and context** on fuel prices, routes, industry trends, and market dynamics.\n\n- Focus: Germany and Europe  \n- Separate from our booking product on the [main site](/en)\n\n> Articles are for general information only, not legal or financial advice.\n',
  'Editorial',
  ARRAY['logistics', 'markets']::text[],
  'published',
  NOW(),
  'TransPool24',
  'TransPool24 Magazine — logistics & transport',
  'Editorial insights on transport, markets, and logistics.'
),
(
  'ar',
  'ahlan-transpool24-magazine',
  'مرحباً بكم في مجلة TransPool24',
  'تحليلات ومقالات حول النقل واللوجستيات والأسواق — منفصلة عن صفحة الحجز.',
  E'# أهلاً بكم\n\nننشر هنا **تحليلات وسياقاً** حول أسعار الوقود، المسارات، اتجاهات القطاع، وديناميكيات السوق.\n\n- التركيز: ألمانيا وأوروبا  \n- منفصل عن خدمة الحجز على [الموقع الرئيسي](/ar)\n\n> المقالات للمعلومات العامة فقط وليست استشارة قانونية أو مالية.\n',
  'تحرير',
  ARRAY['لوجستيات', 'نقل']::text[],
  'published',
  NOW(),
  'TransPool24',
  'مجلة TransPool24 — النقل واللوجستيات',
  'مقالات تحريرية حول النقل واللوجستيات والأسواق.'
)
ON CONFLICT (locale, slug) DO NOTHING;
