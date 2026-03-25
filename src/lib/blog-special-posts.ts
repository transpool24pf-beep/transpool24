/** Arabic «من نحن» article with custom layout (logo + DotLottie). */
export const AR_ABOUT_US_BLOG_SLUG = "man-nahnu-transpool24";

export function isArAboutUsBlogPost(locale: string, slug: string): boolean {
  return locale === "ar" && slug === AR_ABOUT_US_BLOG_SLUG;
}
