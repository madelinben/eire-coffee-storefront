import { describe, expect, it } from 'vitest';
import { buildTitle, productMetaDescription } from '@/features/site-seo/utilities/meta-text';

describe('buildTitle', () => {
  it('appends the brand when it fits', () => {
    expect(buildTitle('Club Merchandise')).toBe('Club Merchandise – Éire Coffee Co.');
  });

  it('drops the brand for a long product name, then truncates a very long one', () => {
    const long = 'Éire House Blend Whole Bean Coffee Roasted In Chester';
    expect(buildTitle(long)).toBe(long);
    const huge = 'Éire House Blend Whole Bean Coffee Roasted Limited Edition Anniversary Release';
    expect(buildTitle(huge).length).toBeLessThanOrEqual(60);
    expect(buildTitle(huge).endsWith('…')).toBe(true);
  });

  it('honours an absolute title', () => {
    expect(buildTitle('Home', 'Éire Coffee Co.: Mobile Coffee Trailer in Chester')).toBe('Éire Coffee Co.: Mobile Coffee Trailer in Chester');
  });
});

describe('productMetaDescription', () => {
  it('pads a missing description with the pickup facts', () => {
    const text = productMetaDescription('Tote Bag', '£15.00', '');
    expect(text.length).toBeGreaterThanOrEqual(70);
    expect(text).toContain('collect from the trailer');
  });

  it('caps a long description at 160 chars on a word boundary', () => {
    const text = productMetaDescription('Tee', '£20.00', 'word '.repeat(80));
    expect(text.length).toBeLessThanOrEqual(160);
    expect(text.endsWith('…')).toBe(true);
  });

  it('keeps a good description untouched', () => {
    const description = 'Soft cotton tote in forest green with the lighthouse mark, big enough for a week of beans.';
    expect(productMetaDescription('Tote', '£20.00', description)).toBe(`Tote, £20.00. ${description}`);
  });
});
