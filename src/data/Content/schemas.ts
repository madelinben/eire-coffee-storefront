import * as z from 'zod/mini';

/**
 * The shape of every editable piece of content. The site build and the admin forms both use these,
 * so content that would break the site can never be saved. Empty string means "not set" for optional text.
 */

const optionalUrl = z.union([z.literal(''), z.url('Enter a full link starting with https://')]);
const requiredText = (label: string, min = 2) => z.string().check(z.trim(), z.minLength(min, `${label} is required`));
const pictureId = z.string().check(z.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Pick a picture from the library'));
const clock = z.string().check(z.regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour time like 09:30'));
const calendarDate = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'), z.refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00Z`)), 'That is not a real date'));

export const STOP_KINDS = ['pitch', 'market', 'festival', 'private'] as const;
export type StopKind = (typeof STOP_KINDS)[number];

export const settingsSchema = z.object({
  whatsappNumber: z.string().check(z.regex(/^\d*$/, 'Digits only, with the country code and no + (e.g. 447700900123)')),
  contactEmail: z.union([z.literal(''), z.email('Enter a valid email address')]),
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  tagline: requiredText('The tagline', 5),
  serviceArea: requiredText('The service area', 5),
  shopNote: requiredText('The shop note', 10),
});

export const stopSchema = z.object({
  title: requiredText('The title', 3),
  date: calendarDate,
  startTime: clock,
  endTime: clock,
  kind: z.enum(STOP_KINDS),
  /** Extra weeks the stop repeats, once a week on the same day. Zero for a one-off. */
  repeatWeeks: z.int().check(z.minimum(0, 'Zero or more'), z.maximum(52, 'A year at most')),
  venueName: z.string(),
  streetAddress: z.string(),
  postalCode: z.string(),
  locality: z.string(),
  note: z.string(),
  link: optionalUrl,
});
export const stopsSchema = z.array(stopSchema).check(
  z.superRefine((stops, context) => {
    stops.forEach((stop, index) => {
      if (stop.endTime <= stop.startTime) context.addIssue({ code: 'custom', path: [index, 'endTime'], message: 'The end time must be after the start time' });
      if (stop.kind !== 'private' && stop.venueName.trim().length < 2) context.addIssue({ code: 'custom', path: [index, 'venueName'], message: 'Say where the trailer will be' });
      if (stop.kind !== 'private' && stop.locality.trim().length < 2) context.addIssue({ code: 'custom', path: [index, 'locality'], message: 'Add the town or city' });
    });
  }),
);

const menuItemSchema = z.object({
  name: requiredText('The name'),
  description: z.string(),
  /** Free text so "£3.20" or "from £3" both work. Empty hides the price. */
  price: z.string(),
});
export const menuSchema = z.object({
  intro: requiredText('The intro', 10),
  sections: z.array(z.object({ name: requiredText('The section name'), note: z.string(), items: z.array(menuItemSchema).check(z.minLength(1, 'Add at least one item')) })).check(z.minLength(1, 'Add at least one section')),
});

const packageSchema = z.object({
  name: requiredText('The name'),
  bestFor: requiredText('Who it is for', 3),
  summary: requiredText('The summary', 10),
  includes: z.array(requiredText('An inclusion', 2)).check(z.minLength(1, 'List at least one thing')),
});
export const hireSchema = z.object({
  intro: requiredText('The intro', 10),
  packages: z.array(packageSchema).check(z.minLength(1, 'Add at least one package')),
  included: z.array(requiredText('An item', 2)),
  leadTimeDays: z.int().check(z.minimum(0, 'Zero or more'), z.maximum(365)),
  travelNote: requiredText('The travel note', 10),
});

export const pictureSchema = z.object({
  id: pictureId,
  alt: requiredText('The description (alt text)', 5),
  /** Shown in the "On the road" strip on the home page. */
  gallery: z.boolean(),
  /** Leads the home page instead of the illustration (the first marked picture is used). */
  hero: z.boolean(),
});
export const picturesSchema = z.array(pictureSchema).check(
  z.superRefine((pictures, context) => {
    const seen = new Set<string>();
    pictures.forEach((picture, index) => {
      if (seen.has(picture.id)) context.addIssue({ code: 'custom', path: [index, 'id'], message: 'Two pictures share this name' });
      seen.add(picture.id);
    });
  }),
);

const venturePoint = z.object({ title: requiredText('The title'), text: requiredText('The text', 5) });
/** Their previous venture, told as "this is new, but this is what we did before". */
export const ventureSchema = z.object({
  title: requiredText('The title', 5),
  intro: requiredText('The intro', 10),
  paragraphs: z.array(requiredText('A paragraph', 10)).check(z.minLength(1, 'Add at least one paragraph')),
  /** Optional photo from the library. Leave empty to show the illustration. */
  picture: z.string(),
  highlights: z.array(venturePoint),
  facts: z.array(z.object({ label: requiredText('The label'), value: requiredText('The value', 2) })),
  reviewSummary: z.string(),
  reviews: z.array(z.object({ quote: requiredText('The quote', 10), author: requiredText('The author'), source: requiredText('The source') })),
  link: optionalUrl,
});

export const homeSchema = z.object({
  headline: requiredText('The headline', 5),
  subline: requiredText('The subline', 10),
  story: requiredText('The story', 20),
  values: z.array(z.object({ title: requiredText('The title'), text: requiredText('The text', 5) })).check(z.length(3, 'Exactly three values')),
  ticker: z.array(requiredText('A word', 1)).check(z.minLength(2, 'At least two words')),
});

export type Settings = z.infer<typeof settingsSchema>;
export type StopContent = z.infer<typeof stopSchema>;
export type MenuContent = z.infer<typeof menuSchema>;
export type HireContent = z.infer<typeof hireSchema>;
export type PictureContent = z.infer<typeof pictureSchema>;
export type VentureContent = z.infer<typeof ventureSchema>;
export type HomeContent = z.infer<typeof homeSchema>;

/** Every content file the admin can edit, with where it lives in the repo. */
export const CONTENT_FILES = {
  settings: { path: 'src/content/site/settings.json', schema: settingsSchema },
  stops: { path: 'src/content/site/stops.json', schema: stopsSchema },
  menu: { path: 'src/content/site/menu.json', schema: menuSchema },
  hire: { path: 'src/content/site/hire.json', schema: hireSchema },
  pictures: { path: 'src/content/site/pictures.json', schema: picturesSchema },
  home: { path: 'src/content/site/home.json', schema: homeSchema },
  venture: { path: 'src/content/site/venture.json', schema: ventureSchema },
} as const;
export type ContentKey = keyof typeof CONTENT_FILES;

/** The whole site's content as the build and the admin see it. */
export interface SiteContentData {
  settings: Settings;
  stops: StopContent[];
  menu: MenuContent;
  hire: HireContent;
  pictures: PictureContent[];
  home: HomeContent;
  venture: VentureContent;
}
