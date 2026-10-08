import type { ImageMetadata } from 'astro';
import type * as z from 'zod/mini';
import { CONTENT_FILES, type ContentKey, type SiteContentData } from '@/data/Content/schemas';
import { crossCheckContent } from '@/data/Content/validate-content';
import settingsJson from '@/content/site/settings.json';
import stopsJson from '@/content/site/stops.json';
import menuJson from '@/content/site/menu.json';
import hireJson from '@/content/site/hire.json';
import picturesJson from '@/content/site/pictures.json';
import homeJson from '@/content/site/home.json';
import ventureJson from '@/content/site/venture.json';

/**
 * All editable content, checked at build time. A bad edit stops the build with a plain-English message
 * instead of shipping a broken page. The admin edits the same JSON files and uses the same schemas.
 */
const raw: Record<ContentKey, unknown> = { settings: settingsJson, stops: stopsJson, menu: menuJson, hire: hireJson, pictures: picturesJson, home: homeJson, venture: ventureJson };

function parseFile<Schema extends z.ZodMiniType>(key: ContentKey, schema: Schema): z.output<Schema> {
  const result = schema.safeParse(raw[key]);
  if (!result.success) {
    const lines = result.error.issues.map((issue) => `  ${issue.path.join('.') || '(whole file)'}: ${issue.message}`);
    throw new Error(`Content problem in ${CONTENT_FILES[key].path}:\n${lines.join('\n')}`);
  }
  return result.data;
}

const pictureFiles = import.meta.glob<{ default: ImageMetadata }>('/src/assets/uploads/*.{webp,jpg,jpeg,png,avif}', { eager: true });

/** Picture id (file name without extension) to its image. */
export const pictureImages: ReadonlyMap<string, ImageMetadata> = new Map(
  Object.entries(pictureFiles).map(([path, module]) => [path.slice(path.lastIndexOf('/') + 1).replace(/\.[^.]+$/, ''), module.default]),
);

export const siteContent: SiteContentData = {
  settings: parseFile('settings', CONTENT_FILES.settings.schema),
  stops: parseFile('stops', CONTENT_FILES.stops.schema),
  menu: parseFile('menu', CONTENT_FILES.menu.schema),
  hire: parseFile('hire', CONTENT_FILES.hire.schema),
  pictures: parseFile('pictures', CONTENT_FILES.pictures.schema),
  home: parseFile('home', CONTENT_FILES.home.schema),
  venture: parseFile('venture', CONTENT_FILES.venture.schema),
};

const problems = crossCheckContent(siteContent, new Set(pictureImages.keys()));
if (problems.length > 0) throw new Error(`Content problem:\n${problems.map((line) => `  ${line}`).join('\n')}`);
