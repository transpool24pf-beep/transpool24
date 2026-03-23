/**
 * Legal reference for PDFs and admin UI. Bump when `WORK_POLICY_TEXT` changes materially.
 * Not a substitute for lawyer-reviewed contracts.
 */
export const DRIVER_POLICY_LEGAL_REF = "TP24-DRIVER-POLICY-2025-03";

/** Country codes for driver form (WhatsApp): Germany first */
export const DRIVER_COUNTRY_CODES: { code: string; flag: string }[] = [
  { code: "+49", flag: "🇩🇪" },
  { code: "+43", flag: "🇦🇹" },
  { code: "+41", flag: "🇨🇭" },
  { code: "+31", flag: "🇳🇱" },
  { code: "+32", flag: "🇧🇪" },
  { code: "+33", flag: "🇫🇷" },
  { code: "+44", flag: "🇬🇧" },
  { code: "+39", flag: "🇮🇹" },
  { code: "+34", flag: "🇪🇸" },
  { code: "+90", flag: "🇹🇷" },
  { code: "+962", flag: "🇯🇴" },
  { code: "+961", flag: "🇱🇧" },
  { code: "+966", flag: "🇸🇦" },
  { code: "+971", flag: "🇦🇪" },
  { code: "+20", flag: "🇪🇬" },
  { code: "+1", flag: "🇺🇸" },
];

/** Service policy (contact via WhatsApp) – short consent for step 1 */
export const SERVICE_POLICY_TEXT =
  "Ich stimme zu, dass mich die Personalabteilung per WhatsApp zur Verfolgung des Bewerbungsverfahrens kontaktieren darf.";

/** Work policy – company policy for step 4 (aligned with German law and transport rules) */
export const WORK_POLICY_TITLE = "Arbeits- und Unternehmensrichtlinie – verbindliche Zustimmung";

export const WORK_POLICY_TEXT = `
Mit Ihrer Zustimmung erkennen Sie Folgendes an:

1) Einhaltung des deutschen Rechts: Die Tätigkeit unterliegt dem Arbeitszeitgesetz (ArbZG), den Lenk- und Ruhezeiten (VO (EU) 561/2006) sowie der DSGVO. Maximal 9 Stunden Lenkzeit pro Tag, mit Pausen und wöchentlicher Ruhezeit.

2) Unterlagen und Fahrzeug: gültige Ausweise (Identität/Aufenthalt), Führerschein, Fahrzeugpapiere soweit erforderlich; gesetzlich vorgeschriebene Versicherung. Das Fahrzeug muss verkehrssicher sein.

3) Datenschutz: Verarbeitung Ihrer personenbezogenen Daten nur für Bewerbung, Einsatzplanung und gesetzliche Pflichten; keine Weitergabe an Dritte ohne Rechtsgrundlage oder Einwilligung.

4) Professionelles Verhalten: Vertraulichkeit gegenüber Unternehmen und Kunden; keine missbräuchliche Nutzung der Position; respektvoller Umgang.

5) Folgen: Verstöße gegen diese Richtlinie oder geltendes Recht können zur Beendigung der Zusammenarbeit und ggf. rechtlichen Schritten führen.

Mit Klick auf „Antrag absenden“ bestätigen Sie, dass Sie diese Richtlinie gelesen, verstanden und akzeptiert haben.
`.trim();
