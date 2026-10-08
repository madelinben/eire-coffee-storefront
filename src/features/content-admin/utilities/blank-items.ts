/** What a new row looks like when the editor adds one to a list, by the list's field name. */
export const BLANK_ITEMS: Readonly<Record<string, unknown>> = {
  stops: { title: '', date: '', startTime: '09:00', endTime: '14:00', kind: 'pitch', repeatWeeks: 0, venueName: '', streetAddress: '', postalCode: '', locality: 'Chester', note: '', link: '' },
  sections: { name: '', note: '', items: [{ name: '', description: '', price: '' }] },
  items: { name: '', description: '', price: '' },
  packages: { name: '', bestFor: '', summary: '', includes: [''] },
  values: { title: '', text: '' },
  highlights: { title: '', text: '' },
  facts: { label: '', value: '' },
  reviews: { quote: '', author: '', source: '' },
  paragraphs: '',
  includes: '',
  included: '',
  ticker: '',
};

/** Fields that are a pick from a short list rather than free text. `picture` is filled with the picture library. */
export const FIXED_CHOICES: Readonly<Record<string, readonly string[]>> = {
  kind: ['pitch', 'market', 'festival', 'private'],
};

/** Fields shown as a taller box. */
export const LONG_TEXT = new Set(['text', 'summary', 'story', 'subline', 'quote', 'reviewSummary', 'value', 'paragraphs', 'intro', 'note', 'description', 'travelNote', 'shopNote', 'answer']);

/** Plain-English field help, shown under the label. */
export const FIELD_HELP: Readonly<Record<string, string>> = {
  whatsappNumber: 'Optional. Digits only with the country code and no plus sign (447700900123).',
  contactEmail: 'Where booking requests are sent when people choose email.',
  serviceArea: 'Shown in the hero and footer, e.g. Chester and the North West.',
  shopNote: 'Explains collection and delivery on the shop pages.',
  date: 'The first day of this stop. Past stops disappear by themselves.',
  startTime: '24-hour time, like 09:30.',
  endTime: '24-hour time, like 14:00.',
  kind: 'Private hides the place and shows "Booked" to the public. It also blocks that date on the booking form.',
  repeatWeeks: 'Extra weeks this stop repeats on the same weekday. 0 for a one-off, 12 for the next 12 weeks.',
  venueName: 'Where the trailer is, e.g. The Square. Not needed for private events.',
  link: 'Optional page about the stop, starting with https://',
  picture: 'Choose a photo from the Photos section, or leave empty to show the illustration.',
  reviews: 'Real quotes only, with where they were posted.',
  price: 'Free text like £3.20. Empty hides the price.',
  leadTimeDays: 'Notice you like for an event booking, in days.',
};

export function humanize(key: string): string {
  const spaced = key.replace(/([A-Z])/g, ' $1').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
