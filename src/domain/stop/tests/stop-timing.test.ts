import { describe, expect, it } from 'vitest';
import { addDays, bookingDates, expandStops, londonIso, monthGrid, monthsFrom, nextPublicStop, splitStops, type StopSource } from '@/domain/stop/stop-timing';

const source = (overrides: Partial<StopSource> = {}): StopSource => ({
  title: 'Saturday Pitch',
  date: '2026-10-10',
  startTime: '09:00',
  endTime: '14:00',
  kind: 'pitch',
  repeatWeeks: 0,
  venueName: 'The Square',
  streetAddress: '',
  postalCode: '',
  locality: 'Chester',
  note: '',
  link: '',
  ...overrides,
});

describe('expandStops', () => {
  it('repeats weekly and keeps ids unique', () => {
    const stops = expandStops([source({ repeatWeeks: 2 })]);
    expect(stops.map((stop) => stop.date)).toEqual(['2026-10-10', '2026-10-17', '2026-10-24']);
    expect(new Set(stops.map((stop) => stop.id)).size).toBe(3);
  });

  it('sorts mixed sources by date then start time', () => {
    const stops = expandStops([source({ date: '2026-10-12', startTime: '12:00', endTime: '13:00' }), source({ date: '2026-10-12' }), source({ date: '2026-10-11' })]);
    expect(stops.map((stop) => `${stop.date} ${stop.startTime}`)).toEqual(['2026-10-11 09:00', '2026-10-12 09:00', '2026-10-12 12:00']);
  });

  it('crosses a month end', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });
});

describe('splitStops', () => {
  const stops = expandStops([source({ date: '2026-10-09' }), source({ date: '2026-10-10' })]);
  it('keeps a stop upcoming until it finishes (London time)', () => {
    expect(splitStops(stops, new Date('2026-10-10T10:00:00Z')).upcoming.map((stop) => stop.date)).toEqual(['2026-10-10']); // 11:00 BST, ends 14:00
    expect(splitStops(stops, new Date('2026-10-10T13:30:00Z')).upcoming).toEqual([]); // 14:30 BST
  });
});

describe('nextPublicStop and bookingDates', () => {
  const stops = expandStops([source({ kind: 'private', date: '2026-10-11' }), source({ date: '2026-10-13' })]);
  const now = new Date('2026-10-10T20:00:00Z');
  it('skips private events', () => {
    expect(nextPublicStop(stops, now)?.date).toBe('2026-10-13');
  });
  it('separates blocking and warning dates', () => {
    expect(bookingDates(stops, now)).toEqual({ booked: ['2026-10-11'], busy: ['2026-10-13'] });
  });
});

describe('londonIso', () => {
  it('uses the BST and GMT offsets', () => {
    expect(londonIso('2026-07-01', '09:00')).toBe('2026-07-01T09:00:00+01:00');
    expect(londonIso('2026-12-01', '09:00')).toBe('2026-12-01T09:00:00+00:00');
  });
});

describe('monthGrid', () => {
  it('builds Monday-first full weeks and places stops', () => {
    const stops = expandStops([source({ date: '2026-10-10' })]);
    const weeks = monthGrid(2026, 10, stops);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0]?.[0]?.date).toBe('2026-09-28'); // 1 Oct 2026 is a Thursday
    expect(weeks.flat().filter((day) => day.stops.length > 0).map((day) => day.date)).toEqual(['2026-10-10']);
    expect(weeks.flat().filter((day) => day.inMonth)).toHaveLength(31);
  });
  it('rolls months over the year end', () => {
    expect(monthsFrom(new Date('2026-12-15T12:00:00Z'), 3)).toEqual([{ year: 2026, month: 12 }, { year: 2027, month: 1 }, { year: 2027, month: 2 }]);
  });
});
