import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const privacyDe = {
  metaTitle: "Datenschutzerklärung | TransPool24",
  metaDescription:
    "Informationen zur Verarbeitung personenbezogener Daten bei TransPool24 (Website, Buchung, Fahrerbewerbungen) gemäß DSGVO.",
  breadcrumbHome: "Startseite",
  breadcrumbCurrent: "Datenschutz",
  pageTitle: "Datenschutzerklärung",
  pageLead:
    "Diese Datenschutzerklärung informiert Sie gemäß Art. 13 und 14 EU-Datenschutz-Grundverordnung (DSGVO) über die Verarbeitung personenbezogener Daten beim Besuch unserer Website, bei der Nutzung unseres Online-Buchungssystems für Transportleistungen sowie bei Bewerbungen als Fahrerin oder Fahrer.",
  updated: "Stand: März 2026",
  tocTitle: "Auf dieser Seite",
  contactTitle: "Kontakt Datenschutz",
  contactCta: "Nachricht senden",
  contactEmailLabel: "E-Mail",
  privacyEmail: "transpool24@hotmail.com",
  socialTitle: "Social Media und Drittanbieter",
  socialIntro:
    "Wenn Sie unsere Profile in sozialen Netzwerken besuchen, können die Betreiber der Plattformen personenbezogene Daten verarbeiten (z. B. IP-Adresse, Nutzungsverhalten). Wir verweisen auf die Datenschutzhinweise der jeweiligen Anbieter:",
  toc: {
    scope: "1. Zweck und Geltungsbereich",
    controller: "2. Verantwortliche Stelle",
    processing: "3. Welche Daten verarbeiten wir?",
    legal: "4. Rechtsgrundlagen",
    retention: "5. Speicherdauer und Empfänger",
    rights: "6. Ihre Rechte",
    changes: "7. Änderung dieser Erklärung",
  },
  s1: {
    title: "1. Zweck und Geltungsbereich",
    p1:
      "TransPool24 bietet Transport- und Logistikdienstleistungen mit Schwerpunkt Pforzheim und Umgebung an. Personenbezogene Daten verarbeiten wir nur, soweit dies zur Bereitstellung der Website, zur Vertragsanbahnung und -durchführung, zur Erfüllung rechtlicher Pflichten oder auf Grundlage Ihrer Einwilligung erforderlich ist.",
    p2:
      "Gegenstand dieser Erklärung sind unsere öffentliche Website, das Buchungsformular bzw. der Bestellprozess, die Kommunikation per E-Mail oder Kontaktformular sowie der Bewerbungsprozess für Fahrerinnen und Fahrer.",
    p3:
      "Eine automatisierte Entscheidungsfindung einschließlich Profiling im Sinne von Art. 22 DSGVO findet nicht statt.",
  },
  s2: {
    title: "2. Verantwortliche Stelle",
    p1:
      "Verantwortlich im Sinne der DSGVO ist TransPool24 (Kontaktdaten siehe Impressum bzw. Website). Für datenschutzrechtliche Anfragen erreichen Sie uns unter der oben genannten E-Mail-Adresse oder über unser Kontaktformular.",
    p2:
      "Sofern wir Auftragsverarbeiter einsetzen (z. B. Hosting, Zahlungsdienstleister, E-Mail-Versand), geschieht dies auf Grundlage eines Vertrags nach Art. 28 DSGVO.",
  },
  s3: {
    title: "3. Welche Daten verarbeiten wir?",
    intro:
      "Die folgende Übersicht beschreibt typische Kategorien personenbezogener Daten in Zusammenhang mit unseren Angeboten. Je nach Nutzung können einzelne Punkte entfallen oder ergänzt werden.",
    colData: "Datenkategorien",
    colPurpose: "Zweck",
    colLegal: "Rechtsgrundlage",
    r1: {
      data: "Stammdaten Buchung: Name, Firma, Adressen, Telefon, E-Mail, Auftragsdetails",
      purpose: "Durchführung des Transportauftrags, Abwicklung der Buchung, Kommunikation",
      legal: "Art. 6 Abs. 1 lit. b DSGVO (Vertrag); ggf. lit. a (Einwilligung)",
    },
    r2: {
      data: "Zahlungsdaten (über Stripe): Zahlungsstatus, ggf. abgekürzte Kartendaten — keine vollständigen Kartennummern bei uns",
      purpose: "Zahlungsabwicklung",
      legal: "Art. 6 Abs. 1 lit. b DSGVO; Art. 6 Abs. 1 lit. c bei steuerlichen Pflichten",
    },
    r3: {
      data: "Bewerbungsdaten Fahrer: Identität, Kontakt, Führerschein, Fahrzeug, ggf. Ausweisdokumente",
      purpose: "Prüfung und Bearbeitung der Bewerbung, Vertragsanbahnung",
      legal: "Art. 6 Abs. 1 lit. b DSGVO; § 26 BDSG soweit anwendbar",
    },
    r4: {
      data: "Technische Daten: IP-Adresse, Datum/Uhrzeit, Browsertyp, ggf. Logfiles",
      purpose: "Betrieb und Sicherheit der Website, Fehleranalyse in begrenztem Umfang",
      legal: "Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem Betrieb)",
    },
    outro:
      "Bei aktiver Standortfreigabe durch Fahrer (z. B. für Live-Tracking) verarbeiten wir Standortdaten nur im jeweils beschriebenen Umfang und auf der angegebenen Rechtsgrundlage. Details entnehmen Sie bitte der jeweiligen Funktionsbeschreibung.",
  },
  s4: {
    title: "4. Rechtsgrundlagen im Überblick",
    p1:
      "Vertragsdurchführung (Art. 6 Abs. 1 lit. b DSGVO): Buchung und Erbringung der Transportleistung, zugehörige Kommunikation.",
    p2:
      "Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO): IT-Sicherheit, Missbrauchsprävention, statistische Auswertungen in anonymisierter Form, soweit nicht Ihre Interessen überwiegen.",
    p3:
      "Einwilligung (Art. 6 Abs. 1 lit. a DSGVO): nur, wenn wir Sie ausdrücklich darum bitten und Sie zustimmen — Sie können eine erteilte Einwilligung mit Wirkung für die Zukunft widerrufen.",
  },
  s5: {
    title: "5. Speicherdauer, Weitergabe und Drittlandübermittlung",
    p1:
      "Wir speichern personenbezogene Daten nur so lange, wie dies für die genannten Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen (z. B. handels- oder steuerrechtlich).",
    p2:
      "Eine Weitergabe an Dritte erfolgt nur, wenn dies zur Vertragserfüllung notwendig ist (z. B. Zahlungsdienstleister, technischer Hosting-Provider), wir gesetzlich verpflichtet sind oder Sie eingewilligt haben.",
    p3:
      "Sofern Daten in ein Drittland übermittelt werden (z. B. US-Dienste), stützen wir uns — soweit erforderlich — auf Angemessenheitsbeschlüsse oder geeignete Garantien gemäß Art. 44 ff. DSGVO und informieren Sie gesondert, sofern gesetzlich nötig.",
  },
  s6: {
    title: "6. Ihre Rechte",
    intro: "Sie haben — soweit die gesetzlichen Voraussetzungen erfüllt sind — insbesondere folgende Rechte:",
    a: "Auskunft über die zu Ihrer Person gespeicherten Daten (Art. 15 DSGVO)",
    b: "Berichtigung unrichtiger Daten (Art. 16 DSGVO)",
    c: "Löschung (Art. 17 DSGVO) und Einschränkung der Verarbeitung (Art. 18 DSGVO)",
    d: "Datenübertragbarkeit (Art. 20 DSGVO), soweit anwendbar",
    e: "Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21 DSGVO)",
    f: "Widerruf einer Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)",
    outro:
      "Sie haben zudem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO). Zuständig ist insbesondere die Behörde Ihres gewöhnlichen Aufenthaltsorts oder unseres Standorts.",
  },
  s7: {
    title: "7. Änderung dieser Datenschutzerklärung",
    p1:
      "Wir passen diese Erklärung an, wenn sich unsere Datenverarbeitung oder rechtliche Rahmenbedingungen ändern. Die jeweils aktuelle Version finden Sie auf dieser Seite mit Datum „Stand“.",
    p2:
      "Bitte prüfen Sie die Erklärung bei wiederkehrendem Besuch, insbesondere wenn Sie neue Funktionen nutzen.",
  },
};

const locales = ["de", "en", "ar", "fr", "es", "tr"];
const privacyEn = {
  ...privacyDe,
  metaTitle: "Privacy Policy | TransPool24",
  metaDescription:
    "How TransPool24 processes personal data (website, bookings, driver applications) under the GDPR.",
  breadcrumbHome: "Home",
  breadcrumbCurrent: "Privacy",
  pageTitle: "Privacy Policy",
  pageLead:
    "This privacy notice explains, in accordance with Articles 13 and 14 GDPR, how we process personal data when you visit our website, use our online booking for transport services, or apply as a driver.",
  updated: "Last updated: March 2026",
  tocTitle: "On this page",
  contactTitle: "Privacy contact",
  contactCta: "Send a message",
  contactEmailLabel: "Email",
  socialTitle: "Social media and third-party providers",
  socialIntro:
    "When you visit our social media profiles, platform operators may process personal data (e.g. IP address). Please refer to each provider’s privacy policy:",
  toc: {
    scope: "1. Purpose and scope",
    controller: "2. Controller",
    processing: "3. What data we process",
    legal: "4. Legal bases",
    retention: "5. Retention and recipients",
    rights: "6. Your rights",
    changes: "7. Changes to this notice",
  },
  s1: {
    title: "1. Purpose and scope",
    p1:
      "TransPool24 provides transport and logistics services focused on Pforzheim and the region. We only process personal data where necessary to operate the website, conclude and perform contracts, comply with legal obligations, or based on your consent.",
    p2:
      "This notice covers our public website, the booking / order process, communication by email or contact form, and driver applications.",
    p3: "We do not use solely automated decision-making including profiling within the meaning of Art. 22 GDPR.",
  },
  s2: {
    title: "2. Controller",
    p1:
      "The controller under GDPR is TransPool24 (see imprint / website for contact). For privacy requests use the email above or our contact form.",
    p2:
      "Where we use processors (e.g. hosting, payment, email), this is done under Art. 28 GDPR agreements.",
  },
  s3: {
    title: "3. What data we process?",
    intro: "The table lists typical categories. Depending on your use, some items may not apply.",
    colData: "Data categories",
    colPurpose: "Purpose",
    colLegal: "Legal basis",
    r1: {
      data: "Booking master data: name, company, addresses, phone, email, order details",
      purpose: "Performing the transport, processing the booking, communication",
      legal: "Art. 6(1)(b) GDPR (contract); where applicable (a) (consent)",
    },
    r2: {
      data: "Payment data (via Stripe): payment status, limited card metadata — no full card numbers stored by us",
      purpose: "Payment processing",
      legal: "Art. 6(1)(b) GDPR; Art. 6(1)(c) for tax/legal retention",
    },
    r3: {
      data: "Driver application data: identity, contact, licence, vehicle, ID documents if provided",
      purpose: "Reviewing applications, pre-contract steps",
      legal: "Art. 6(1)(b) GDPR; § 26 BDSG where applicable",
    },
    r4: {
      data: "Technical data: IP address, date/time, browser type, server logs where needed",
      purpose: "Secure operation of the site, limited troubleshooting",
      legal: "Art. 6(1)(f) GDPR (legitimate interest in secure operation)",
    },
    outro:
      "If drivers share live location, we process location data only as described in the relevant feature and on the stated legal basis.",
  },
  s4: {
    title: "4. Legal bases",
    p1: "Contract performance (Art. 6(1)(b)): booking and providing the transport service.",
    p2:
      "Legitimate interests (Art. 6(1)(f)): IT security, fraud prevention, anonymised statistics where your interests do not override.",
    p3: "Consent (Art. 6(1)(a)): only where we ask explicitly — you may withdraw consent for the future.",
  },
  s5: {
    title: "5. Retention, sharing and transfers",
    p1:
      "We keep data only as long as needed for the purposes above or as required by law (e.g. commercial/tax retention).",
    p2:
      "We share data with third parties only if needed for the contract (e.g. payment provider, hosting), we are legally required, or you have consented.",
    p3:
      "If data is transferred outside the EEA, we rely where required on adequacy decisions or appropriate safeguards under Art. 44 ff. GDPR.",
  },
  s6: {
    title: "6. Your rights",
    intro: "Subject to legal requirements, you have in particular:",
    a: "Access (Art. 15 GDPR)",
    b: "Rectification (Art. 16 GDPR)",
    c: "Erasure (Art. 17 GDPR) and restriction (Art. 18 GDPR)",
    d: "Data portability (Art. 20 GDPR) where applicable",
    e: "Objection to processing based on Art. 6(1)(f) GDPR (Art. 21 GDPR)",
    f: "Withdraw consent for the future (Art. 7(3) GDPR)",
    outro: "You may lodge a complaint with a supervisory authority (Art. 77 GDPR).",
  },
  s7: {
    title: "7. Changes",
    p1: "We update this notice when processing or legal requirements change. The current version is on this page with the “Last updated” date.",
    p2: "Please review it when you use new features.",
  },
};

// For ar, fr, es, tr use English text as base with localized UI strings - user asked translation: provide shorter localized versions
const privacyFr = {
  ...privacyEn,
  metaTitle: "Politique de confidentialité | TransPool24",
  metaDescription: "Traitement des données personnelles chez TransPool24 (RGPD).",
  breadcrumbHome: "Accueil",
  breadcrumbCurrent: "Confidentialité",
  pageTitle: "Politique de confidentialité",
  pageLead: privacyEn.pageLead,
  updated: "Dernière mise à jour : mars 2026",
  tocTitle: "Sur cette page",
  contactTitle: "Contact confidentialité",
  contactCta: "Envoyer un message",
  contactEmailLabel: "E-mail",
  socialTitle: "Réseaux sociaux",
  socialIntro: privacyEn.socialIntro,
  toc: {
    scope: "1. Objet et champ d’application",
    controller: "2. Responsable du traitement",
    processing: "3. Données traitées",
    legal: "4. Bases juridiques",
    retention: "5. Conservation et destinataires",
    rights: "6. Vos droits",
    changes: "7. Modifications",
  },
};

const privacyEs = {
  ...privacyEn,
  metaTitle: "Política de privacidad | TransPool24",
  metaDescription: "Tratamiento de datos personales en TransPool24 (RGPD).",
  breadcrumbHome: "Inicio",
  breadcrumbCurrent: "Privacidad",
  pageTitle: "Política de privacidad",
  pageLead: privacyEn.pageLead,
  updated: "Última actualización: marzo 2026",
  tocTitle: "En esta página",
  contactTitle: "Contacto privacidad",
  contactCta: "Enviar mensaje",
  contactEmailLabel: "Correo",
  socialTitle: "Redes sociales",
  socialIntro: privacyEn.socialIntro,
  toc: {
    scope: "1. Finalidad y alcance",
    controller: "2. Responsable",
    processing: "3. Datos tratados",
    legal: "4. Bases legales",
    retention: "5. Conservación y destinatarios",
    rights: "6. Sus derechos",
    changes: "7. Cambios",
  },
};

const privacyTr = {
  ...privacyEn,
  metaTitle: "Gizlilik Politikası | TransPool24",
  metaDescription: "TransPool24 kişisel veri işleme (GDPR).",
  breadcrumbHome: "Ana sayfa",
  breadcrumbCurrent: "Gizlilik",
  pageTitle: "Gizlilik Politikası",
  pageLead: privacyEn.pageLead,
  updated: "Son güncelleme: Mart 2026",
  tocTitle: "Bu sayfada",
  contactTitle: "Gizlilik iletişimi",
  contactCta: "Mesaj gönder",
  contactEmailLabel: "E-posta",
  socialTitle: "Sosyal medya",
  socialIntro: privacyEn.socialIntro,
  toc: {
    scope: "1. Amaç ve kapsam",
    controller: "2. Veri sorumlusu",
    processing: "3. İşlenen veriler",
    legal: "4. Hukuki dayanaklar",
    retention: "5. Saklama ve alıcılar",
    rights: "6. Haklarınız",
    changes: "7. Değişiklikler",
  },
};

const privacyAr = {
  ...privacyEn,
  metaTitle: "سياسة الخصوصية | TransPool24",
  metaDescription: "معالجة البيانات الشخصية لدى TransPool24 وفق GDPR.",
  breadcrumbHome: "الرئيسية",
  breadcrumbCurrent: "الخصوصية",
  pageTitle: "سياسة الخصوصية",
  pageLead:
    "نُعلِمكم وفق المادتين 13 و14 من اللائحة العامة لحماية البيانات (GDPR) بمعالجة بياناتكم عند استخدام موقعنا، وحجز خدمات النقل، والتقديم كسائق.",
  updated: "آخر تحديث: مارس 2026",
  tocTitle: "في هذه الصفحة",
  contactTitle: "التواصل بخصوص الخصوصية",
  contactCta: "إرسال رسالة",
  contactEmailLabel: "البريد الإلكتروني",
  socialTitle: "وسائل التواصل والأطراف الخارجية",
  socialIntro:
    "عند زيارة ملفاتنا على الشبكات الاجتماعية قد تعالج المنصات بياناتاً (مثل عنوان IP). راجع سياسات الخصوصية لكل مزود:",
  toc: {
    scope: "1. الغرض والنطاق",
    controller: "2. المسؤول عن المعالجة",
    processing: "3. البيانات التي نعالجها",
    legal: "4. الأسس القانونية",
    retention: "5. المدة والإفصاح",
    rights: "6. حقوقك",
    changes: "7. التعديلات على البيانات",
  },
  s1: {
    title: "1. الغرض والنطاق",
    p1:
      "تقدّم TransPool24 خدمات نقل ولوجستيات مع التركيز على بفورتسهايم والمنطقة. نعالج البيانات الشخصية فقط عند الحاجة لتشغيل الموقع، وإبرام العقود وتنفيذها، والامتثال للقانون، أو بموافقتكم.",
    p2:
      "تشمل هذه السياسة الموقع العام، وعملية الحجز/الطلب، والتواصل عبر البريد أو نموذج الاتصال، وطلبات التقديم كسائق.",
    p3: "لا نستخدم اتخاذ قرارات آليّة بحتة بما في ذلك الإنشاء المفصّل للملفات وفق المادة 22 من GDPR.",
  },
  s2: {
    title: "2. المسؤول عن المعالجة",
    p1:
      "المسؤول عن المعالجة وفق GDPR هو TransPool24 (راجع بيانات الاتصال في الموقع). لطلبات الخصوصية استخدموا البريد أعلاه أو نموذج الدعم.",
    p2: "عند الاستعانة بمعالجين (استضافة، دفع، بريد) نبرم عقوداً وفق المادة 28 من GDPR.",
  },
  s3: {
    title: "3. البيانات التي نعالجها؟",
    intro: "الجدول يوضح فئات البيانات النموذجية؛ قد لا تنطبق بعض البنود حسب الاستخدام.",
    colData: "فئات البيانات",
    colPurpose: "الغرض",
    colLegal: "الأساس القانوني",
    r1: {
      data: "بيانات الحجز: الاسم، الشركة، العناوين، الهاتف، البريد، تفاصيل الطلب",
      purpose: "تنفيذ النقل ومعالجة الحجز والتواصل",
      legal: "المادة 6(1)(ب) GDPR (عقد)؛ وقد تنطبق (أ) بموافقة",
    },
    r2: {
      data: "بيانات الدفع (عبر Stripe): حالة الدفع وبيانات وصفية — لا نخزن أرقام البطاقات كاملة",
      purpose: "معالجة المدفوعات",
      legal: "المادة 6(1)(ب)؛ و(ج) للالتزامات الضريبية/القانونية",
    },
    r3: {
      data: "بيانات التقديم كسائق: الهوية، الاتصال، الرخصة، المركبة، مستندات الهوية إن وُجدت",
      purpose: "مراجعة الطلب وخطوات ما قبل التعاقد",
      legal: "المادة 6(1)(ب)؛ و§26 BDSG حيث ينطبق",
    },
    r4: {
      data: "بيانات تقنية: عنوان IP، التاريخ/الوقت، المتصفح، سجلات الخادم عند الحاجة",
      purpose: "تشغيل آمن للموقع وتحديد محدود للأعطال",
      legal: "المادة 6(1)(ف) GDPR (مصلحة مشروعة في الأمان)",
    },
    outro:
      "عند مشاركة السائق لموقعه المباشر نعالج بيانات الموقع فقط كما هو موضح في الميزة ذات الصلة.",
  },
  s4: {
    title: "4. الأسس القانونية",
    p1: "تنفيذ العقد (المادة 6(1)(ب)): الحجز وتقديم خدمة النقل.",
    p2: "مصلحة مشروعة (المادة 6(1)(ف)): أمن تقنية المعلومات، منع الإساءة، إحصاءات مجهولة المصدر حيث لا تغلب مصالحكم.",
    p3: "الموافقة (المادة 6(1)(أ)): فقط عند طلب صريح — ويمكن سحبها للمستقبل.",
  },
  s5: {
    title: "5. المدة والمستلمون والنقل",
    p1: "نحتفظ بالبيانات للمدة اللازمة للأغراض أو وفق مدد الاحتفاظ القانونية.",
    p2: "نُفصح لأطراف ثالثة فقط عند الحاجة للعقد (مثل الدفع والاستضافة) أو بوجه قانوني أو بموافقتكم.",
    p3: "عند النقل خارج المنطقة الاقتصادية الأوروبية نعتمد حيث يلزم على قرارات كفاية أو ضمانات وفق المواد 44 فما بعد GDPR.",
  },
  s6: {
    title: "6. حقوقك",
    intro: "وفق الشروط القانونية لديكم على سبيل المثال:",
    a: "الاطلاع (المادة 15)",
    b: "التصحيح (المادة 16)",
    c: "المحو والتقييد (المادتان 17 و18)",
    d: "قابلية النقل (المادة 20) حيث ينطبق",
    e: "الاعتراض على المعالجة المبنية على المادة 6(1)(ف) (المادة 21)",
    f: "سحب الموافقة (المادة 7(3))",
    outro: "يمكنكم تقديم شكوى لدى سلطة رقابية (المادة 77).",
  },
  s7: {
    title: "7. تعديل هذه السياسة",
    p1: "نحدّث السياسة عند تغيّر المعالجة أو المتطلبات القانونية. النسخة الحالية على هذه الصفحة مع تاريخ «آخر تحديث».",
    p2: "يُرجى المراجعة عند استخدام ميزات جديدة.",
  },
};

const bundles = { de: privacyDe, en: privacyEn, fr: privacyFr, es: privacyEs, tr: privacyTr, ar: privacyAr };

const socialLabels = {
  de: { socialTiktok: "TikTok", socialFacebook: "Facebook", socialYoutube: "YouTube" },
  en: { socialTiktok: "TikTok", socialFacebook: "Facebook", socialYoutube: "YouTube" },
  fr: { socialTiktok: "TikTok", socialFacebook: "Facebook", socialYoutube: "YouTube" },
  es: { socialTiktok: "TikTok", socialFacebook: "Facebook", socialYoutube: "YouTube" },
  tr: { socialTiktok: "TikTok", socialFacebook: "Facebook", socialYoutube: "YouTube" },
  ar: { socialTiktok: "تيك توك", socialFacebook: "فيسبوك", socialYoutube: "يوتيوب" },
};

for (const loc of locales) {
  const path = resolve(root, "messages", `${loc}.json`);
  const raw = readFileSync(path, "utf8");
  const j = JSON.parse(raw);
  j.privacyPolicy = bundles[loc];
  j.infoPageClosing = { ...j.infoPageClosing, ...socialLabels[loc] };
  writeFileSync(path, JSON.stringify(j, null, 2) + "\n", "utf8");
  console.log("merged privacyPolicy ->", loc);
}
