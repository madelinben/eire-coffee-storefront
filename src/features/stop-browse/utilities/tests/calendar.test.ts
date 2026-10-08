import { describe, expect, it } from 'vitest';
import { buildIcs, escapeText, googleCalendarUrl, localBasic } from '@/features/stop-browse/utilities/calendar';
import { expandStops, type StopSource } from '@/domain/stop/stop-timing';

const source = (overrides: Partial<StopSource> = {}): StopSource => ({
  title: 'Market, day',
  date: '2026-10-17',
  startTime: '10:00',
  endTime: '16:00',
  kind: 'market',
  repeatWeeks: 0,
  venueName: 'The Market',
  streetAddress: 'High St',
  postalCode: 'CH1 1AA',
  locality: 'Chester',
  note: 'Say hi; bring a mug',
  link: '',
  ...overrides,
});

describe('calendar', () => {
  it('writes local wall-clock times', () => {
    expect(localBasic('2026-10-17', '10:00')).toBe('20261017T100000');
  });

  it('escapes commas, semicolons and newlines', () => {
    expect(escapeText('a, b; c\nd')).toBe('a\\, b\\; c\\nd');
  });

  it('builds a feed with public stops only', () => {
    const stops = expandStops([source(), source({ kind: 'private', title: 'Secret wedding', date: '2026-10-24' })]);
    const feed = buildIcs(new Date('2026-10-08T12:00:00Z'), stops, 'example.com', 'https://example.com/calendar/');
    expect(feed).toContain('BEGIN:VCALENDAR');
    expect(feed).toContain('DTSTART;TZID=Europe/London:20261017T100000');
    expect(feed).toContain('SUMMARY:Éire Coffee: Market\\, day');
    expect(feed).not.toContain('Secret wedding');
    expect(feed.split('\r\n').every((line) => line.length <= 75)).toBe(true);
    expect(feed.endsWith('\r\n')).toBe(true);
  });

  it('links a stop to Google Calendar', () => {
    const [stop] = expandStops([source()]);
    if (!stop) throw new Error('no stop');
    const url = new URL(googleCalendarUrl(stop));
    expect(url.searchParams.get('dates')).toBe('20261017T100000/20261017T160000');
    expect(url.searchParams.get('ctz')).toBe('Europe/London');
  });
});
