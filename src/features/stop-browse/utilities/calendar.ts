import { locationText, type Stop } from '@/domain/stop/stop-timing';
import { TIME_ZONE } from '@/utilities/time-zone';

const BACKSLASH = String.fromCharCode(92);

/** `2026-10-10` and `09:00` become `20261010T090000` (local wall-clock time, paired with a TZID). */
export function localBasic(date: string, time: string): string {
  return `${date.replaceAll('-', '')}T${time.replace(':', '')}00`;
}

const utcBasic = (date: Date) => `${date.toISOString().slice(0, 19).replaceAll('-', '').replaceAll(':', '')}Z`;

/** RFC 5545 text escaping: backslash, semicolon, comma and newline each get a leading backslash. */
export function escapeText(text: string): string {
  return [...text].map((char) => (char === BACKSLASH || char === ';' || char === ',' ? BACKSLASH + char : char === '\n' ? `${BACKSLASH}n` : char)).join('');
}

/** RFC 5545 line folding: lines over 75 characters continue on a new line starting with a space. */
function fold(line: string): string {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = ` ${rest.slice(75)}`;
  }
  parts.push(rest);
  return parts.join('\r\n');
}

const LONDON_TIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${TIME_ZONE}`,
  'BEGIN:STANDARD',
  'DTSTART:19701025T020000',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0000',
  'TZNAME:GMT',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'BEGIN:DAYLIGHT',
  'DTSTART:19700329T010000',
  'TZOFFSETFROM:+0000',
  'TZOFFSETTO:+0100',
  'TZNAME:BST',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'END:VTIMEZONE',
];

/** What a calendar entry says about a stop. Private events are never in the public feed. */
function describe(stop: Stop): string {
  return [stop.note, stop.link].filter(Boolean).join('\n');
}

/** A subscribable iCalendar feed: one event per public stop. Private events (who booked us) are left out. */
export function buildIcs(now: Date, stops: readonly Stop[], host: string, url: string): string {
  const events = stops
    .filter((stop) => stop.kind !== 'private')
    .flatMap((stop) => [
      'BEGIN:VEVENT',
      `UID:${stop.id}@${host}`,
      `DTSTAMP:${utcBasic(now)}`,
      `DTSTART;TZID=${TIME_ZONE}:${localBasic(stop.date, stop.startTime)}`,
      `DTEND;TZID=${TIME_ZONE}:${localBasic(stop.date, stop.endTime)}`,
      `SUMMARY:${escapeText(`Éire Coffee: ${stop.title}`)}`,
      `LOCATION:${escapeText(locationText(stop))}`,
      `DESCRIPTION:${escapeText(describe(stop))}`,
      `URL:${url}`,
      'END:VEVENT',
    ]);
  const header = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Eire Coffee Co.//Stops//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Éire Coffee: where is the trailer?', `X-WR-TIMEZONE:${TIME_ZONE}`];
  return `${[...header, ...LONDON_TIMEZONE, ...events, 'END:VCALENDAR'].map(fold).join('\r\n')}\r\n`;
}

/** "Add to Google Calendar" link for one stop. */
export function googleCalendarUrl(stop: Stop): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Éire Coffee: ${stop.title}`,
    dates: `${localBasic(stop.date, stop.startTime)}/${localBasic(stop.date, stop.endTime)}`,
    ctz: TIME_ZONE,
    location: locationText(stop),
    details: describe(stop),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** A map search link for the stop's address. */
export function mapUrl(stop: Pick<Stop, 'venueName' | 'streetAddress' | 'locality' | 'postalCode'>): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText(stop))}`;
}
