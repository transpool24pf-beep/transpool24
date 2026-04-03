/** BCP 47 tag for <html lang> and native controls where supported */
export function localeToHtmlLang(locale: string): string {
  switch (locale) {
    case "de":
      return "de-DE";
    case "en":
      return "en-GB";
    case "tr":
      return "tr-TR";
    case "fr":
      return "fr-FR";
    case "es":
      return "es-ES";
    case "ar":
      return "ar";
    case "ru":
      return "ru-RU";
    case "pl":
      return "pl-PL";
    case "ro":
      return "ro-RO";
    case "ku":
      return "ku";
    case "it":
      return "it-IT";
    case "uk":
      return "uk-UA";
    default:
      return "de-DE";
  }
}
