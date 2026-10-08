import { homeSchema, hireSchema, menuSchema, picturesSchema, settingsSchema, stopsSchema, ventureSchema, type SiteContentData } from '@/data/Content/schemas';
import { crossCheckContent } from '@/data/Content/validate-content';

export interface DraftDocuments {
  settings: unknown;
  stops: unknown;
  menu: unknown;
  hire: unknown;
  venture: unknown;
  home: unknown;
  pictures: unknown;
}

/** Checks the whole draft the way the build will, so a save that would break the site is refused up front. */
export function validateDraft(draft: DraftDocuments, imageIds: ReadonlySet<string>): { content: SiteContentData; problems: never[] } | { content: undefined; problems: string[] } {
  const problems: string[] = [];
  const check = <Output>(label: string, result: { success: true; data: Output } | { success: false; error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] } }): Output | undefined => {
    if (result.success) return result.data;
    result.error.issues.forEach((issue) => problems.push(`${label}${issue.path.length > 0 ? ` › ${issue.path.map(String).join(' › ')}` : ''}: ${issue.message}`));
    return undefined;
  };

  const settings = check('Contact and links', settingsSchema.safeParse(draft.settings));
  const stops = check('Stops calendar', stopsSchema.safeParse(draft.stops));
  const menu = check('Menu', menuSchema.safeParse(draft.menu));
  const hire = check('Hire packages', hireSchema.safeParse(draft.hire));
  const venture = check('Our story', ventureSchema.safeParse(draft.venture));
  const home = check('Home page', homeSchema.safeParse(draft.home));
  const pictures = check('Pictures', picturesSchema.safeParse(draft.pictures));

  if (!settings || !stops || !menu || !hire || !venture || !home || !pictures) return { content: undefined, problems };
  const content: SiteContentData = { settings, stops, menu, hire, home, venture, pictures };
  const pictureIds = new Set(pictures.map((picture) => picture.id));
  const crossProblems = crossCheckContent(content, new Set([...imageIds].filter((id) => pictureIds.has(id))));
  return crossProblems.length > 0 ? { content: undefined, problems: crossProblems } : { content, problems: [] };
}
