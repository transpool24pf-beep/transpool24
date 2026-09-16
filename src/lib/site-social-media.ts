export type SiteSocialMediaRow = {
  id: number;
  instagram_url: string;
  tiktok_url: string;
  linkedin_url: string;
  facebook_url: string;
  youtube_url: string;
  updated_at: string;
};

export type SiteSocialMediaPayload = {
  instagramUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
};

export function mapSocialRow(row: SiteSocialMediaRow): SiteSocialMediaPayload {
  return {
    instagramUrl: row.instagram_url?.trim() ?? "",
    tiktokUrl: row.tiktok_url?.trim() ?? "",
    linkedinUrl: row.linkedin_url?.trim() ?? "",
    facebookUrl: row.facebook_url?.trim() ?? "",
    youtubeUrl: row.youtube_url?.trim() ?? "",
  };
}

export const EMPTY_SOCIAL: SiteSocialMediaPayload = {
  instagramUrl: "",
  tiktokUrl: "",
  linkedinUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
};

export const FALLBACK_SOCIAL = {
  instagramUrl: "https://www.instagram.com/transpool24/",
  linkedinUrl: "https://www.linkedin.com/in/trans-pool-1235803b8",
  facebookUrl: "https://www.facebook.com/transpool24",
} as const;

export function resolvedSocialUrls(social: SiteSocialMediaPayload | null | undefined): SiteSocialMediaPayload {
  return {
    instagramUrl: social?.instagramUrl?.trim() || FALLBACK_SOCIAL.instagramUrl,
    tiktokUrl: social?.tiktokUrl?.trim() || "",
    linkedinUrl: social?.linkedinUrl?.trim() || FALLBACK_SOCIAL.linkedinUrl,
    facebookUrl: social?.facebookUrl?.trim() || FALLBACK_SOCIAL.facebookUrl,
    youtubeUrl: social?.youtubeUrl?.trim() || "",
  };
}
