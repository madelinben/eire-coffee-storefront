import { describe, expect, it } from 'vitest';
import { buildBookingMessage, mailtoUrl, validateBooking, whatsappUrl, type BookingFields } from '@/features/booking-request/utilities/booking-message';

const valid: BookingFields = {
  name: 'Aoife Murphy',
  email: 'aoife@example.com',
  phone: '',
  eventType: 'Wedding',
  date: '2026-12-12',
  startTime: '13:00',
  hours: '4',
  guests: '80',
  location: 'Eaton Hall, Chester',
  packageName: 'Celebration',
  message: 'Outdoor ceremony.',
};

describe('validateBooking', () => {
  it('accepts a complete request', () => {
    expect(validateBooking(valid, [], '2026-10-08')).toEqual({});
  });

  it('refuses the past and a day already booked privately', () => {
    expect(validateBooking({ ...valid, date: '2026-10-01' }, [], '2026-10-08').date).toMatch(/passed/);
    expect(validateBooking(valid, ['2026-12-12'], '2026-10-08').date).toMatch(/already booked/);
  });

  it('allows short notice but needs the essentials', () => {
    expect(validateBooking({ ...valid, date: '2026-10-09' }, [], '2026-10-08')).toEqual({});
    const errors = validateBooking({ ...valid, name: '', email: 'nope', eventType: '', date: '', location: '' }, [], '2026-10-08');
    expect(Object.keys(errors).sort()).toEqual(['date', 'email', 'eventType', 'location', 'name']);
  });

  it('treats the optional numbers as optional but sensible', () => {
    expect(validateBooking({ ...valid, guests: '', hours: '', phone: '' }, [], '2026-10-08')).toEqual({});
    const errors = validateBooking({ ...valid, guests: '0', hours: '-1', phone: '12' }, [], '2026-10-08');
    expect(Object.keys(errors).sort()).toEqual(['guests', 'hours', 'phone']);
  });
});

describe('message builders', () => {
  it('skips empty lines and includes the message', () => {
    const text = buildBookingMessage({ ...valid, phone: '' });
    expect(text).toContain('Date: 2026-12-12');
    expect(text).not.toContain('Phone:');
    expect(text.endsWith('Outdoor ceremony.')).toBe(true);
  });

  it('encodes links', () => {
    expect(mailtoUrl('a@b.co', 'Hi there', 'x&y')).toBe('mailto:a@b.co?subject=Hi%20there&body=x%26y');
    expect(whatsappUrl('+44 7700 900123', 'hi')).toBe('https://wa.me/447700900123?text=hi');
  });
});
