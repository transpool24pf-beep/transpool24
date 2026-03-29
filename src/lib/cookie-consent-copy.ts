/** Public cookie banner copy (all routing locales; fallback English). */
export type CookieConsentCopy = {
  title: string;
  lead: string;
  body: string;
  /** Shorter text for the bottom bar layout */
  bodyShort: string;
  policyLabel: string;
  /** Link to open category customization (like “Details zeigen”) */
  showDetails: string;
  /** Primary label for “essential / technical only” (reference: Technische Cookies) */
  essentialOnlyBtn: string;
  reject: string;
  customize: string;
  acceptAll: string;
  customizeTitle: string;
  necessaryTitle: string;
  necessaryDesc: string;
  analyticsTitle: string;
  analyticsDesc: string;
  marketingTitle: string;
  marketingDesc: string;
  save: string;
  back: string;
  necessaryBadge: string;
};

const EN: CookieConsentCopy = {
  title: "This website uses cookies",
  lead: "Cookies help us improve your experience",
  body:
    "We use essential cookies to run the site. With your consent, we also use cookies for analytics and marketing. By clicking “Accept all”, you agree. Use “Customize” to change categories, or “Reject” to allow only essential cookies. Details: ",
  bodyShort:
    "Essential cookies are required to operate the site. Analytics and marketing cookies are only used with your consent. More in our ",
  policyLabel: "privacy policy",
  showDetails: "Show details ›",
  essentialOnlyBtn: "Essential cookies only",
  reject: "Reject",
  customize: "Customize",
  acceptAll: "Allow all cookies",
  customizeTitle: "Cookie preferences",
  necessaryTitle: "Essential",
  necessaryDesc: "Required for the website to function (session, security, forms). Always active.",
  analyticsTitle: "Analytics",
  analyticsDesc: "Helps us understand how visitors use the site (anonymous usage).",
  marketingTitle: "Marketing",
  marketingDesc: "Used for relevant offers and measuring campaigns, where applicable.",
  save: "Save choices",
  back: "Back",
  necessaryBadge: "Always on",
};

const DE: CookieConsentCopy = {
  title: "Diese Webseite verwendet Cookies",
  lead: "Cookies ermöglichen ein besseres Erlebnis",
  body:
    "Wir setzen technisch notwendige Cookies für den Betrieb der Website ein. Mit Ihrer Einwilligung nutzen wir zusätzlich Cookies für Statistik und Marketing. Mit „Alle akzeptieren“ stimmen Sie zu. Unter „Anpassen“ wählen Sie Kategorien; „Ablehnen“ erlaubt nur das Notwendige. Mehr in der ",
  bodyShort:
    "Technisch notwendige Cookies sind für den Betrieb erforderlich. Statistik- und Marketing-Cookies nutzen wir nur mit Ihrer Einwilligung. Mehr in der ",
  policyLabel: "Datenschutzerklärung",
  showDetails: "Details anzeigen ›",
  essentialOnlyBtn: "Technische Cookies",
  reject: "Ablehnen",
  customize: "Anpassen",
  acceptAll: "Alle Cookies",
  customizeTitle: "Cookie-Einstellungen",
  necessaryTitle: "Notwendig",
  necessaryDesc: "Erforderlich für Funktion, Sicherheit und Bestellablauf. Immer aktiv.",
  analyticsTitle: "Statistik",
  analyticsDesc: "Hilft uns, die Nutzung der Website zu verstehen (weitgehend anonymisiert).",
  marketingTitle: "Marketing",
  marketingDesc: "Für relevante Angebote und Reichweitenmessung, soweit eingesetzt.",
  save: "Auswahl speichern",
  back: "Zurück",
  necessaryBadge: "Immer an",
};

const AR: CookieConsentCopy = {
  title: "يستخدم هذا الموقع ملفات تعريف الارتباط",
  lead: "الكوكيز تساعدنا على تحسين تجربتك",
  body:
    "نستخدم كوكيز ضرورية لتشغيل الموقع. بموافقتك نستخدم أيضاً كوكيز للإحصائيات والتسويق. بالضغط على «قبول الكل» توافق. استخدم «تخصيص» لاختيار الفئات، أو «رفض» للاكتفاء بالضروري فقط. التفاصيل في ",
  bodyShort:
    "الكوكيز الضرورية مطلوبة لتشغيل الموقع. كوكيز الإحصائيات والتسويق تُستخدم فقط بموافقتك. المزيد في ",
  policyLabel: "سياسة الخصوصية",
  showDetails: "عرض التفاصيل ›",
  essentialOnlyBtn: "كوكيز تقنية فقط",
  reject: "رفض",
  customize: "تخصيص",
  acceptAll: "السماح بكل الكوكيز",
  customizeTitle: "تفضيلات الكوكيز",
  necessaryTitle: "ضروري",
  necessaryDesc: "مطلوب لتشغيل الموقع والأمان والنماذج. دائماً مفعّل.",
  analyticsTitle: "الإحصائيات",
  analyticsDesc: "يساعدنا على فهم استخدام الموقع (بشكل مجهول قدر الإمكان).",
  marketingTitle: "التسويق",
  marketingDesc: "لعروض ذات صلة وقياس الحملات حيثما يُطبَّق.",
  save: "حفظ الاختيار",
  back: "رجوع",
  necessaryBadge: "دائماً",
};

/** Locales from src/i18n/routing.ts */
const BY_LOCALE: Record<string, CookieConsentCopy> = {
  de: DE,
  ar: AR,
  en: EN,
  tr: EN,
  fr: EN,
  es: EN,
  ru: EN,
  pl: EN,
  ro: EN,
  ku: EN,
  it: EN,
  uk: EN,
};

export function cookieConsentCopy(locale: string): CookieConsentCopy {
  return BY_LOCALE[locale] ?? EN;
}
