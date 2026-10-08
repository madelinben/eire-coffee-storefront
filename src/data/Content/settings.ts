import { siteContent } from '@/data/Content/site-content';

export const settings = siteContent.settings;
/** Editable in the admin under Settings. */
export const SITE_TAGLINE = settings.tagline;
export const SERVICE_AREA = settings.serviceArea;

/** Social and contact links that are set, ready to render. */
export const socialLinks = {
  instagram: settings.instagramUrl || undefined,
  facebook: settings.facebookUrl || undefined,
  tiktok: settings.tiktokUrl || undefined,
  whatsappNumber: settings.whatsappNumber || undefined,
  email: settings.contactEmail || undefined,
} as const;
