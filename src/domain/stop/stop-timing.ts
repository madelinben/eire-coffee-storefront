import { TIME_ZONE } from '@/utilities/time-zone';

export type StopKind = 'pitch' | 'market' | 'festival' | 'private';

/** One day, one place for the trailer. Repeating stops are expanded into one of these per week. */
export interface Stop {
  /** Stable, URL-safe: the date plus the title. */
  id: string;
  title: string;
  /** Calendar date, `YYYY-MM-DD`. */
  date: string;
  /** 24-hour `HH:MM`. */
  startTime: string;
  endTime: string;
  kind: StopKind;
  venueName: string;
  streetAddress: string;
  postalCode: string;
  locality: string;
  note: string;
  link: string;
}

export interface StopSource extends Omit<Stop, 'id' | 'date'> {
  date: string;
  /** Extra weeks the stop repeats, once a week. */
  repeatWeeks: number;
}

const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const clockFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const longFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });
const shortFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
const monthFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', month: 'long', year: 'numeric' });

const asUtcNoon = (date: string) => new Date(`${date}T12:00:00Z`);
const pad = (value: number) => String(value).padStart(2, '0');

/** Today's calendar date in Europe/London as `YYYY-MM-DD`. */
export function londonToday(now: Date): string {
  return dayFormatter.format(now);
}

/** The time on the clock in Europe/London as `HH:MM`. */
export function londonClock(now: Date): string {
  return clockFormatter.format(now);
}

/** "Saturday 10 October". The input is a plain calendar date, so no timezone shifting can move it a day. */
export function formatStopDate(date: string): string {
  return longFormatter.format(asUtcNoon(date)).replace(',', '');
}

/** "Sat 10 Oct". */
export function formatStopDateShort(date: string): string {
  return shortFormatter.format(asUtcNoon(date)).replace(',', '');
}

/** "October 2026". */
export function formatMonth(year: number, month: number): string {
  return monthFormatter.format(new Date(Date.UTC(year, month - 1, 1, 12)));
}

/** "09:00 to 14:00". */
export function formatTimes(stop: Pick<Stop, 'startTime' | 'endTime'>): string {
  return `${stop.startTime} to ${stop.endTime}`;
}

export function addDays(date: string, days: number): string {
  const moved = asUtcNoon(date);
  moved.setUTCDate(moved.getUTCDate() + days);
  return `${moved.getUTCFullYear()}-${pad(moved.getUTCMonth() + 1)}-${pad(moved.getUTCDate())}`;
}

const slugify = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** One stop per week for a repeating source, soonest first. */
export function expandStops(sources: readonly StopSource[]): Stop[] {
  return sources
    .flatMap(({ repeatWeeks, date, ...rest }) =>
      Array.from({ length: repeatWeeks + 1 }, (_, week) => {
        const day = addDays(date, week * 7);
        return { ...rest, date: day, id: `${day}-${slugify(rest.title)}` };
      }),
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}

/** Splits at this moment (London). A stop that is on today stays upcoming until it finishes. */
export function splitStops(stops: readonly Stop[], now: Date): { upcoming: Stop[]; past: Stop[] } {
  const today = londonToday(now);
  const clock = londonClock(now);
  const done = (stop: Stop) => stop.date < today || (stop.date === today && stop.endTime <= clock);
  return { upcoming: stops.filter((stop) => !done(stop)), past: stops.filter(done) };
}

/** The next stop the public can visit. Private events are never "the next stop". */
export function nextPublicStop(stops: readonly Stop[], now: Date): Stop | undefined {
  return splitStops(stops, now).upcoming.find((stop) => stop.kind !== 'private');
}

/** Private events block a date for booking; public stops only warn. Both lists are upcoming dates, soonest first. */
export function bookingDates(stops: readonly Stop[], now: Date): { booked: string[]; busy: string[] } {
  const { upcoming } = splitStops(stops, now);
  const unique = (kind: (stop: Stop) => boolean) => [...new Set(upcoming.filter(kind).map((stop) => stop.date))];
  return { booked: unique((stop) => stop.kind === 'private'), busy: unique((stop) => stop.kind !== 'private') };
}

function londonOffset(instant: Date): string {
  const zone = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, timeZoneName: 'longOffset' }).formatToParts(instant).find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  return zone === 'GMT' ? '+00:00' : zone.replace('GMT', '');
}

/** A London wall-clock date and time as ISO 8601 with the right GMT or BST offset, for schema.org. */
export function londonIso(date: string, time: string): string {
  return `${date}T${time}:00${londonOffset(new Date(`${date}T${time}:00Z`))}`;
}

export interface CalendarDay {
  date: string;
  inMonth: boolean;
  stops: Stop[];
}

/** A Monday-first month grid: full weeks, with the days either side of the month marked `inMonth: false`. */
export function monthGrid(year: number, month: number, stops: readonly Stop[]): CalendarDay[][] {
  const first = `${year}-${pad(month)}-01`;
  const mondayOffset = (asUtcNoon(first).getUTCDay() + 6) % 7;
  const start = addDays(first, -mondayOffset);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = `${year}-${pad(month)}-${pad(lastDay)}`;
  const weeks: CalendarDay[][] = [];
  for (let cursor = start; cursor <= last; cursor = addDays(cursor, 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, day) => {
        const date = addDays(cursor, day);
        return { date, inMonth: date.startsWith(`${year}-${pad(month)}-`), stops: stops.filter((stop) => stop.date === date) };
      }),
    );
  }
  return weeks;
}

/** The current month and the next `count - 1`, in London time. */
export function monthsFrom(now: Date, count: number): { year: number; month: number }[] {
  const [year = 0, month = 1] = londonToday(now).split('-').map(Number);
  return Array.from({ length: count }, (_, index) => {
    const total = year * 12 + (month - 1) + index;
    return { year: Math.floor(total / 12), month: (total % 12) + 1 };
  });
}

/** "Venue, street, town, postcode" with the empty parts left out. */
export function locationText(stop: Pick<Stop, 'venueName' | 'streetAddress' | 'locality' | 'postalCode'>): string {
  return [stop.venueName, stop.streetAddress, stop.locality, stop.postalCode].filter(Boolean).join(', ');
}
