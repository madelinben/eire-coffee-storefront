import { SERVICE_AREA, SITE_TAGLINE } from '@/data/Content/settings';
import { SITE_NAME } from '@/utilities/brand';
import { londonIso, type Stop } from '@/domain/stop/stop-timing';

export interface JsonLdNode {
  '@type': string | string[];
  '@id'?: string;
  [property: string]: unknown;
}

export interface Crumb {
  name: string;
  path: string;
}


/** `origin` is the site root URL INCLUDING any base path (see `siteRoot`), so paths resolve under it. */
const at = (origin: string, path: string) => new URL(path.replace(/^\//, ''), origin.endsWith('/') ? origin : `${origin}/`).href;
export const organizationId = (origin: string) => at(origin, '/#organization');
export const websiteId = (origin: string) => at(origin, '/#website');

export function organizationNode(input: { origin: string; sameAs: string[]; email?: string; whatsapp?: string }): JsonLdNode {
  const contactPoints = [
    input.email && { '@type': 'ContactPoint', contactType: 'customer support', email: input.email, availableLanguage: 'en' },
    input.whatsapp && { '@type': 'ContactPoint', contactType: 'customer support', url: `https://wa.me/${input.whatsapp.replace(/\D/g, '')}`, availableLanguage: 'en' },
  ].filter(Boolean);
  return {
    '@type': ['Organization', 'CafeOrCoffeeShop'],
    '@id': organizationId(input.origin),
    name: SITE_NAME,
    alternateName: 'Éire Coffee',
    slogan: SITE_TAGLINE,
    url: at(input.origin, '/'),
    logo: { '@type': 'ImageObject', url: at(input.origin, '/apple-touch-icon.png'), width: 180, height: 180 },
    description: 'A mobile coffee trailer based in Chester, serving markets, festivals, weddings and private events across the North West.',
    address: { '@type': 'PostalAddress', addressLocality: 'Chester', addressCountry: 'GB' },
    areaServed: SERVICE_AREA,
    ...(input.sameAs.length > 0 && { sameAs: input.sameAs }),
    ...(contactPoints.length > 0 && { contactPoint: contactPoints }),
  };
}

export function websiteNode(origin: string): JsonLdNode {
  return { '@type': 'WebSite', '@id': websiteId(origin), url: at(origin, '/'), name: SITE_NAME, inLanguage: 'en-GB', publisher: { '@id': organizationId(origin) } };
}

export function webPageNode(input: { origin: string; url: string; name: string; description: string; type?: string | undefined; image?: string | undefined; hasBreadcrumb: boolean }): JsonLdNode {
  return {
    '@type': input.type ?? 'WebPage',
    '@id': `${input.url}#webpage`,
    url: input.url,
    name: input.name,
    description: input.description,
    inLanguage: 'en-GB',
    isPartOf: { '@id': websiteId(input.origin) },
    about: { '@id': organizationId(input.origin) },
    ...(input.image && { primaryImageOfPage: { '@type': 'ImageObject', url: input.image } }),
    ...(input.hasBreadcrumb && { breadcrumb: { '@id': `${input.url}#breadcrumb` } }),
  };
}

export function breadcrumbNode(origin: string, url: string, crumbs: Crumb[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, name: crumb.name, item: at(origin, crumb.path) })),
  };
}

export function faqPageNode(url: string, items: { question: string; answer: string }[]): JsonLdNode {
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: items.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })),
  };
}

/** A public stop of the trailer as a schema.org Event. Private events are never described. */
export function stopEventNode(input: { origin: string; url: string; image: string; stop: Stop }): JsonLdNode {
  const { stop } = input;
  return {
    '@type': 'Event',
    '@id': `${input.url}#${stop.id}`,
    url: input.url,
    name: `${SITE_NAME}: ${stop.title}`,
    description: stop.note || `Éire Coffee trailer at ${stop.venueName}, ${stop.locality}.`,
    startDate: londonIso(stop.date, stop.startTime),
    endDate: londonIso(stop.date, stop.endTime),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: [input.image],
    location: {
      '@type': 'Place',
      name: stop.venueName,
      address: {
        '@type': 'PostalAddress',
        ...(stop.streetAddress && { streetAddress: stop.streetAddress }),
        addressLocality: stop.locality,
        ...(stop.postalCode && { postalCode: stop.postalCode }),
        addressCountry: 'GB',
      },
    },
    organizer: { '@id': organizationId(input.origin) },
  };
}

export interface ProductOffer {
  /** Decimal string, e.g. "20.00". */
  price: string;
  inStock: boolean;
  name?: string | undefined;
}

export function productNode(input: { url: string; origin: string; name: string; description: string; images: string[]; offers: ProductOffer[]; sku?: string }): JsonLdNode {
  return {
    '@type': 'Product',
    '@id': `${input.url}#product`,
    url: input.url,
    name: input.name,
    description: input.description,
    image: input.images,
    ...(input.sku && { sku: input.sku }),
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: input.offers.map((offer) => ({
      '@type': 'Offer',
      ...(offer.name && { name: offer.name }),
      url: input.url,
      price: offer.price,
      priceCurrency: 'GBP',
      availability: offer.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': organizationId(input.origin) },
    })),
  };
}

export function itemListNode(url: string, items: { url: string; name: string; image: string }[]): JsonLdNode {
  return {
    '@type': 'ItemList',
    '@id': `${url}#items`,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, url: item.url, name: item.name, image: item.image })),
  };
}
