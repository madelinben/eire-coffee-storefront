export const EVENT_TYPES = ['Wedding', 'Festival or market', 'Corporate or office', 'Birthday or private party', 'School or community', 'Something else'] as const;

export interface BookingFields {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  date: string;
  startTime: string;
  hours: string;
  guests: string;
  location: string;
  packageName: string;
  message: string;
}

export type BookingErrors = Partial<Record<keyof BookingFields, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Plain-English problems with a booking request, keyed by field. `bookedDates` are days the trailer is already committed to a private event;
 * `today` is `YYYY-MM-DD`. A short lead time is allowed (we may still be able to help), only the past and booked days are refused.
 */
export function validateBooking(fields: BookingFields, bookedDates: readonly string[], today: string): BookingErrors {
  const errors: BookingErrors = {};
  if (fields.name.trim().length < 2) errors.name = 'Tell us your name.';
  if (!EMAIL.test(fields.email.trim())) errors.email = 'Enter an email address we can reply to.';
  if (fields.phone.trim() !== '' && fields.phone.replace(/\D/g, '').length < 7) errors.phone = 'That phone number looks too short.';
  if (fields.eventType === '') errors.eventType = 'Choose the kind of event.';
  if (fields.date === '') errors.date = 'Pick the date of your event.';
  else if (fields.date < today) errors.date = 'That date has already passed.';
  else if (bookedDates.includes(fields.date)) errors.date = 'The trailer is already booked that day. Try another date, or tell us in the message and we will see what we can do.';
  if (fields.guests !== '' && !(Number(fields.guests) >= 1)) errors.guests = 'Enter a number of guests, or leave it blank.';
  if (fields.hours !== '' && !(Number(fields.hours) > 0)) errors.hours = 'Enter the hours of service, or leave it blank.';
  if (fields.location.trim().length < 3) errors.location = 'Tell us where the event is: a venue, town or postcode.';
  return errors;
}

const line = (label: string, value: string) => (value.trim() === '' ? [] : [`${label}: ${value.trim()}`]);

/** The request as plain text: it goes in an email, a WhatsApp message or a form post, and is shown back so nothing is lost. */
export function buildBookingMessage(fields: BookingFields): string {
  return [
    'Booking request for the Éire Coffee trailer',
    '',
    ...line('Name', fields.name),
    ...line('Email', fields.email),
    ...line('Phone', fields.phone),
    ...line('Event type', fields.eventType),
    ...line('Date', fields.date),
    ...line('Start time', fields.startTime),
    ...line('Hours of service', fields.hours),
    ...line('Guests', fields.guests),
    ...line('Location', fields.location),
    ...line('Package', fields.packageName),
    ...(fields.message.trim() === '' ? [] : ['', fields.message.trim()]),
  ].join('\n');
}

export function mailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function whatsappUrl(number: string, text: string): string {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
