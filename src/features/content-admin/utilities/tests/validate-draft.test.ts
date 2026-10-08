import { describe, expect, it } from 'vitest';
import { validateDraft } from '@/features/content-admin/utilities/validate-draft';
import { siteContent } from '@/data/Content/site-content';

const draft = { ...siteContent };
const images = new Set(siteContent.pictures.map((picture) => picture.id));

describe('validateDraft', () => {
  it('accepts the live content', () => {
    expect(validateDraft(draft, images).problems).toEqual([]);
  });

  it('names the field when a link is wrong', () => {
    const result = validateDraft({ ...draft, settings: { ...siteContent.settings, instagramUrl: 'not a link' } }, images);
    expect(result.problems.join(' ')).toContain('instagramUrl');
  });

  it('blocks a stop that ends before it starts, and a public stop with no place', () => {
    const [first] = siteContent.stops;
    if (!first) throw new Error('seed has stops');
    const result = validateDraft({ ...draft, stops: [{ ...first, endTime: '08:00', venueName: '' }] }, images);
    expect(result.problems.join(' ')).toContain('end time must be after');
    expect(result.problems.join(' ')).toContain('Say where the trailer will be');
  });

  it('blocks a picture whose image file is missing', () => {
    const picture = { id: 'trailer-front', alt: 'The trailer at a market', gallery: true, hero: false };
    const result = validateDraft({ ...draft, pictures: [picture] }, new Set());
    expect(result.problems.join(' ')).toContain('image file is missing');
  });
});
