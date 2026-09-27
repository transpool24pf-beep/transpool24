import type { BlogPost } from "@/lib/blog";

export const CAREER_POST_SLUG = "karriere-paketzusteller-fahrer-transpool24";

const PUBLISHED = "2026-09-27T14:00:00.000Z";
const HERO = "/images/blog/career-driver-hero.jpg";

function post(
  locale: string,
  id: string,
  fields: Omit<BlogPost, "id" | "locale" | "slug" | "status" | "published_at" | "created_at" | "updated_at" | "featured_image_url">
): BlogPost {
  return {
    id,
    locale,
    slug: CAREER_POST_SLUG,
    featured_image_url: HERO,
    status: "published",
    published_at: PUBLISHED,
    created_at: PUBLISHED,
    updated_at: PUBLISHED,
    ...fields,
  };
}

export const CAREER_SEED_POSTS: BlogPost[] = [
  post("de", "seed-career-de", {
    title: "Karriere bei TransPool24: Werde Teil unseres Teams als Paketzusteller / Fahrer (m/w/d)",
    excerpt:
      "Du suchst einen zukunftssicheren Job mit fairer Vergütung und einem starken Team im Rücken? TransPool24 expandiert weiter und sucht motivierte Paketzusteller und Fahrer (m/w/d) für regionale Auslieferungstouren. Jetzt bewerben und durchstarten!",
    body: `## Zuverlässig, dynamisch und fair: Arbeiten bei TransPool24

Die Logistikbranche wächst unaufhaltsam – und mit ihr auch unser Team bei **TransPool24**. Als modernes Transport- und Logistikunternehmen setzen wir nicht nur auf zufriedene Kunden und termingerechte Lieferungen, sondern vor allem auf zufriedene Mitarbeiter. Für unsere täglichen Zustelltouren im Großraum **Pforzheim, Stuttgart, Karlsruhe** und Umgebung suchen wir ab sofort engagierte **Paketzusteller und Auslieferungsfahrer (m/w/d)**.

![TransPool24 Fahrer belädt den Transporter mit Paketen](/images/blog/career-van-loading.jpg)

[Jetzt als Fahrer bewerben](/de/driver "cta")

## Deine Aufgaben bei uns

Als Fahrer bei TransPool24 bist du das Gesicht unseres Unternehmens vor Ort und sorgst dafür, dass Sendungen schnell und unversehrt ihr Ziel erreichen:

* Beladung deines Zustellfahrzeugs und Überprüfung der Ladungssicherung.
* Zuverlässige und termingerechte Zustellung von Paketen und Sendungen auf geplanten, optimierten Touren.
* Freundlicher, professioneller Umgang mit Privat- und Geschäftskunden.
* Sicheres Führen des bereitgestellten Transporters unter Einhaltung aller Straßenverkehrsvorschriften.

![Fahrer von TransPool24 mit Paketen vor dem Zustellfahrzeug](/images/blog/career-parcels-city.jpg)

## Was du mitbringen solltest

* Gültiger Führerschein der Klasse B (Pkw / Transporter bis 3,5t).
* Zuverlässigkeit, Pünktlichkeit und ein ausgeprägtes Verantwortungsbewusstsein.
* Freundliches Auftreten sowie Freude am eigenständigen Arbeiten.
* Grundlegende Deutsch- oder Englischkenntnisse für die Kommunikation mit Kunden und im Team.
* Körperliche Fitness und Belastbarkeit im Arbeitsalltag.

## Was TransPool24 dir bietet

* **Attraktive & faire Vergütung:** Pünktliche Bezahlung und leistungsgerechte Prämien.
* **Moderner Fuhrpark:** Gepflegte, technisch einwandfreie Fahrzeuge für maximale Sicherheit und Komfort.
* **Planbare Arbeitszeiten:** Feste Touren und klare Abläufe für eine ausgewogene Work-Life-Balance.
* **Starkes Teamklima:** Ein respektvolles, kollegiales Arbeitsumfeld mit direkten Ansprechpartnern auf Augenhöhe.
* **Schneller Einstieg:** Unkomplizierter Bewerbungsprozess und sorgfältige Einarbeitung.

## Jetzt bewerben – so einfach geht’s

Möchtest du Teil unseres wachsenden Logistik-Netzwerks werden? Wir freuen uns auf dich. Bewirb dich in wenigen Minuten über unser Fahrerformular – oder schreib uns:

* E-Mail: [transpool24pf@gmail.com](mailto:transpool24pf@gmail.com)
* Telefon / WhatsApp: [+49 179 6923602](tel:+491796923602)

[Jetzt Partner werden – zur Bewerbung](/de/driver "cta")`,
    category: "Karriere",
    tags: ["Karriere", "Paketzusteller", "Fahrer", "Jobs", "Pforzheim", "Logistik"],
    meta_title: "Karriere als Paketzusteller / Fahrer (m/w/d) | TransPool24",
    meta_description:
      "TransPool24 sucht Paketzusteller und Fahrer (m/w/d) in Pforzheim, Stuttgart und Karlsruhe. Faire Vergütung, modernes Team – jetzt bewerben.",
    author_name: "TransPool24 Redaktion",
  }),
  post("ar", "seed-career-ar", {
    title: "وظيفة في TransPool24: انضم إلى فريقنا كموزّع طرود / سائق",
    excerpt:
      "تبحث عن عمل مستقبلي بأجر عادل وفريق قوي؟ TransPool24 تتوسع وتبحث عن موزّعي طرود وسائقين لجولات التوصيل الإقليمية. قدّم الآن وابدأ.",
    body: `## موثوق، ديناميكي وعادل: العمل مع TransPool24

قطاع اللوجستيات ينمو باستمرار – ومعه فريق **TransPool24**. كشركة نقل حديثة نركّز على رضا العملاء والتسليم في الموعد، وقبل كل شيء على رضا الزملاء. لجولات التوصيل اليومية في منطقة **بفورتسهايم، شتوتغارت، كارلسروه** وما حولها نبحث فوراً عن **موزّعي طرود وسائقي توصيل**.

![سائق TransPool24 يحمّل الطرود في المركبة](/images/blog/career-van-loading.jpg)

[قدّم الآن لتصبح شريكاً معنا](/ar/driver "cta")

## مهامك معنا

كالسائق أنت وجه الشركة في الميدان، وتضمن وصول الشحنات بسرعة وبسلامة:

* تحميل مركبة التوصيل والتحقق من تثبيت الحمولة.
* تسليم موثوق وفي الموعد للطرود على جولات مخططة ومحسّنة.
* تعامل ودّي ومهني مع العملاء من الأفراد والشركات.
* قيادة آمنة للمركبة وفق قواعد المرور.

![سائق TransPool24 يحمل طروداً أمام المركبة](/images/blog/career-parcels-city.jpg)

## ما الذي تحتاجه

* رخصة قيادة سارية فئة B (سيارة / فان حتى 3,5 طن).
* الالتزام بالمواعيد والمسؤولية.
* حضور ودّي والقدرة على العمل بشكل مستقل.
* أساسيات الألمانية أو الإنجليزية للتواصل مع العملاء والفريق.
* لياقة بدنية تناسب يوم العمل.

## ماذا نقدّم لك

* **أجر عادل:** دفع في الموعد ومكافآت حسب الأداء.
* **أسطول حديث:** مركبات مرتبة وآمنة.
* **أوقات عمل قابلة للتخطيط:** جولات ثابتة وتوازن بين العمل والحياة.
* **فريق محترم:** تواصل مباشر على مستوى واحد.
* **دخول سريع:** تقديم بسيط وتدريب واضح.

## قدّم الآن

انضم إلى شبكة اللوجستيات المتنامية. عبّئ نموذج السائق في دقائق، أو راسلنا:

* البريد: [transpool24pf@gmail.com](mailto:transpool24pf@gmail.com)
* الهاتف / واتساب: [+49 179 6923602](tel:+491796923602)

[قدّم الآن لتصبح شريكاً معنا](/ar/driver "cta")`,
    category: "وظائف",
    tags: ["وظائف", "سائق", "طرود", "بفورتسهايم", "لوجستيات"],
    meta_title: "وظيفة موزّع طرود / سائق | TransPool24",
    meta_description:
      "TransPool24 تبحث عن موزّعي طرود وسائقين في بفورتسهايم وشتوتغارت وكارلسروه. أجر عادل – قدّم الآن.",
    author_name: "TransPool24 Redaktion",
  }),
  post("en", "seed-career-en", {
    title: "Careers at TransPool24: Join our team as a parcel courier / driver",
    excerpt:
      "Looking for a future-proof job with fair pay and a strong team? TransPool24 is growing and hiring motivated parcel couriers and drivers for regional delivery tours. Apply now.",
    body: `## Reliable, dynamic and fair: working at TransPool24

Logistics is growing – and so is the **TransPool24** team. As a modern transport company we care about on-time deliveries and, above all, about our people. For daily delivery tours around **Pforzheim, Stuttgart, Karlsruhe** and the region we are hiring **parcel couriers and delivery drivers**.

![TransPool24 driver loading parcels into the van](/images/blog/career-van-loading.jpg)

[Apply now and become a partner](/en/driver "cta")

## Your role

As a driver you represent TransPool24 on the road and make sure shipments arrive quickly and undamaged:

* Load the delivery vehicle and check cargo securing.
* Deliver parcels on planned, optimised tours – on time.
* Friendly, professional contact with private and business customers.
* Drive the transporter safely and follow traffic rules.

![TransPool24 driver with parcels in front of the van](/images/blog/career-parcels-city.jpg)

## What you bring

* Valid category B licence (car / van up to 3.5 t).
* Reliability, punctuality and a sense of responsibility.
* A friendly manner and independence.
* Basic German or English for customers and the team.
* Physical fitness for a delivery day.

## What we offer

* **Fair pay:** on-time wages and performance bonuses.
* **Modern fleet:** well-maintained vehicles.
* **Plannable hours:** clear tours and work-life balance.
* **Strong team:** respectful, direct communication.
* **Fast start:** simple application and thorough onboarding.

## Apply now

Become part of our growing logistics network. Use the driver form, or contact us:

* Email: [transpool24pf@gmail.com](mailto:transpool24pf@gmail.com)
* Phone / WhatsApp: [+49 179 6923602](tel:+491796923602)

[Apply now and become a partner](/en/driver "cta")`,
    category: "Careers",
    tags: ["careers", "driver", "parcel", "Pforzheim", "logistics"],
    meta_title: "Parcel courier / driver jobs | TransPool24",
    meta_description:
      "TransPool24 is hiring parcel couriers and drivers in Pforzheim, Stuttgart and Karlsruhe. Fair pay – apply now.",
    author_name: "TransPool24 Editorial",
  }),
];

export function mergeCareerSeedPosts<T extends { locale: string; slug: string }>(rows: T[]): T[] {
  const have = new Set(rows.map((r) => `${r.locale}:${r.slug}`));
  const extra = CAREER_SEED_POSTS.filter((p) => !have.has(`${p.locale}:${p.slug}`));
  return [...extra, ...rows] as T[];
}
