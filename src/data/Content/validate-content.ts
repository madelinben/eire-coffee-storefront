import type { SiteContentData } from '@/data/Content/schemas';

/**
 * Checks that hold across files: every picture in the list needs an image file and every image file needs a description.
 * Returns plain-English problems, empty when the content is fine.
 * `libraryIds` are the picture ids that have an image file, including ones the editor has just uploaded.
 */
export function crossCheckContent(content: SiteContentData, libraryIds: ReadonlySet<string>): string[] {
  const problems: string[] = [];
  const known = new Set(content.pictures.map((picture) => picture.id));
  for (const picture of content.pictures) if (!libraryIds.has(picture.id)) problems.push(`Picture "${picture.id}" is listed but its image file is missing`);
  for (const id of libraryIds) if (!known.has(id)) problems.push(`Image "${id}" has no entry in the picture list, so it has no description`);
  if (content.venture.picture !== '' && !known.has(content.venture.picture)) problems.push(`The Our story page uses the picture "${content.venture.picture}", which is not in the library`);
  return problems;
}
