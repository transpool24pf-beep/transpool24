export type WhyIconId = "zap" | "shield" | "mapPin" | "clipboard" | "truck" | "package";

export type WhySidebarItem = { icon: WhyIconId; title: string; body: string };
export type WhyTip = { title: string; detail: string };
export type WhyServiceType = { name: string; body: string };
export type WhyFaq = { q: string; a: string };
export type WhyHowStep = { title: string; body: string };

export type WhyPagePayload = {
  metaTitle: string;
  heroBadge: string;
  headline: string;
  heroSub: string;
  sidebarTitle: string;
  sidebar: WhySidebarItem[];
  introTitle: string;
  introLead: string;
  h2_1: string;
  p1: string;
  h2_2: string;
  p2: string;
  h2_3: string;
  p3: string;
  tipsTitle: string;
  tipsIntro: string;
  tips: WhyTip[];
  servicesTitle: string;
  servicesIntro: string;
  serviceTypes: WhyServiceType[];
  platformTitle: string;
  platformBody: string;
  completingTitle: string;
  completingP1: string;
  completingP2: string;
  completingP3: string;
  closingLine: string;
  heroImageUrl: string;
  sceneImageUrl: string;
  howTitle: string;
  howSteps: WhyHowStep[];
  howCta: string;
  faqTitle: string;
  faqs: WhyFaq[];
};

export function isValidWhyPayload(x: unknown): x is WhyPagePayload {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.headline === "string" &&
    Array.isArray(o.faqs) &&
    o.faqs.length > 0 &&
    Array.isArray(o.sidebar) &&
    Array.isArray(o.howSteps)
  );
}
