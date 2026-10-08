import { requireSite } from '@/utilities/require-site';
import type { APIRoute } from 'astro';
import { stops } from '@/data/Stop/stops';
import { addDays, londonToday, splitStops } from '@/domain/stop/stop-timing';
import { buildIcs } from '@/features/stop-browse/utilities/calendar';
import { toAbsolute } from '@/utilities/with-base';

/** Subscribable calendar feed of the public stops, up to a year ahead. Regenerated on every build. */
export const GET: APIRoute = ({ site }) => {
  const now = new Date();
  const horizon = addDays(londonToday(now), 366);
  const upcoming = splitStops(stops, now).upcoming.filter((stop) => stop.date <= horizon);
  const body = buildIcs(now, upcoming, requireSite(site).host, toAbsolute(requireSite(site), '/calendar/'));
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
