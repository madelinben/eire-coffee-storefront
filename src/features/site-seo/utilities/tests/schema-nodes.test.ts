import { describe, expect, it } from 'vitest';
import { expandStops } from '@/domain/stop/stop-timing';
import { breadcrumbNode, faqPageNode, organizationNode, productNode, stopEventNode } from '@/features/site-seo/utilities/schema-nodes';

const origin = 'https://www.example.test';

describe('schema nodes', () => {
  it('Organization omits empty sameAs and contactPoint', () => {
    const node = organizationNode({ origin, sameAs: [] });
    expect(node).not.toHaveProperty('sameAs');
    expect(node).not.toHaveProperty('contactPoint');
    expect(node['@id']).toBe('https://www.example.test/#organization');
  });

  it('Organization builds a wa.me link from a formatted number', () => {
    const node = organizationNode({ origin, sameAs: ['https://x.test'], whatsapp: '+44 7700 900123' });
    expect(JSON.stringify(node)).toContain('https://wa.me/447700900123');
  });

  it('stop Event has London offsets, the venue address and no free claim', () => {
    const [stop] = expandStops([{ title: 'Market', date: '2026-07-04', startTime: '10:00', endTime: '16:00', kind: 'market', repeatWeeks: 0, venueName: 'The Market', streetAddress: 'High St', postalCode: 'CH1 1AA', locality: 'Chester', note: '', link: '' }]);
    if (!stop) throw new Error('no stop');
    const node = stopEventNode({ origin, url: `${origin}/calendar/`, image: `${origin}/og-default.png`, stop });
    expect(node.startDate).toBe('2026-07-04T10:00:00+01:00');
    expect(node.endDate).toBe('2026-07-04T16:00:00+01:00');
    expect(node).not.toHaveProperty('isAccessibleForFree');
    expect(JSON.stringify(node.location)).toContain('CH1 1AA');
  });

  it('Product offers carry real availability, GBP and the price shown', () => {
    const node = productNode({ origin, url: `${origin}/shop/tote/`, name: 'Tee', description: 'd', images: ['https://i.test/a.png'], offers: [{ price: '20.00', inStock: true }, { price: '20.00', inStock: false, name: 'L' }] });
    const offers = node.offers as { priceCurrency: string; availability: string }[];
    expect(offers.map((offer) => offer.availability)).toEqual(['https://schema.org/InStock', 'https://schema.org/OutOfStock']);
    expect(offers.every((offer) => offer.priceCurrency === 'GBP')).toBe(true);
  });

  it('Breadcrumb positions start at 1 with absolute URLs', () => {
    const node = breadcrumbNode(origin, `${origin}/faqs/`, [{ name: 'Home', path: '/' }, { name: 'FAQs', path: '/faqs/' }]);
    expect(node.itemListElement).toMatchObject([{ position: 1, item: 'https://www.example.test/' }, { position: 2, item: 'https://www.example.test/faqs/' }]);
  });

  it('FAQPage maps every question', () => {
    expect(faqPageNode(`${origin}/faqs/`, [{ question: 'Q?', answer: 'A.' }]).mainEntity).toHaveLength(1);
  });
});
