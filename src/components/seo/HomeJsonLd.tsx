import { getTranslations } from "next-intl/server";
import { getPublicSiteUrl } from "@/lib/public-site-url";
import { locales } from "@/i18n/routing";

/** Organization + WebSite structured data on the localized homepage only. */
export async function HomeJsonLd({ locale }: { locale: string }) {
  const site = getPublicSiteUrl();
  const t = await getTranslations({ locale, namespace: "siteMetadata" });

  const graph = [
    {
      "@type": "Organization",
      "@id": `${site}/#organization`,
      name: "TransPool24",
      url: site,
      logo: `${site}/favicon.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${site}/#website`,
      url: site,
      name: "TransPool24",
      description: t("description"),
      inLanguage: [...locales],
      publisher: { "@id": `${site}/#organization` },
    },
  ];

  const payload = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
