import { siteContent } from '@/data/Content/site-content';
import { expandStops, type Stop } from '@/domain/stop/stop-timing';

/** Every stop, with repeating ones expanded to one per week, from `src/content/site/stops.json`. Add stops in the admin; the calendar, home page, feed and booking form follow. */
export const stops: readonly Stop[] = expandStops(siteContent.stops);
