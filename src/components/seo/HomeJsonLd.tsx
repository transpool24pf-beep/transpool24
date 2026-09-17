import { getTranslations } from "next-intl/server";
import { getPublicSiteUrl } from "@/lib/public-site-url";
import { locales } from "@/i18n/routing";
import { FALLBACK_SOCIAL } from "@/lib/site-social-media";
import { getPublicContactEmail, getPublicContactPhone } from "@/lib/site-contact";

/** Organization + WebSite structured data on the localized homepage only. */
export async function HomeJsonLd({ locale }: { locale: string }) {
  const site = getPublicSiteUrl();
  const t = await getTranslations({ locale, namespace: "siteMetadata" });
  const email = getPublicContactEmail();
  const telephone = getPublicContactPhone();

  const graph = [
    {
      "@type": ["Organization", "LocalBusiness"],
      "@id": `${site}/#organization`,
      name: "TransPool24",
      legalName: "Omar Mdeik – TransPool24",
      founder: { "@type": "Person", name: "Omar Mdeik" },
      url: site,
      logo: `${site}/favicon.png`,
      image: `${site}/favicon.png`,
      email,
      telephone,
      description: t("description"),
      address: {
        "@type": "PostalAddress",
        streetAddress: "Kaiser-Friedrich-Straße 139",
        postalCode: "75172",
        addressLocality: "Pforzheim",
        addressRegion: "Baden-Württemberg",
        addressCountry: "DE",
      },
      areaServed: [
        { "@type": "City", name: "Pforzheim" },
        { "@type": "AdministrativeArea", name: "Baden-Württemberg" },
        { "@type": "Country", name: "Germany" },
      ],
      sameAs: [
        FALLBACK_SOCIAL.instagramUrl,
        FALLBACK_SOCIAL.facebookUrl,
        FALLBACK_SOCIAL.linkedinUrl,
        FALLBACK_SOCIAL.pinterestUrl,
      ],
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
