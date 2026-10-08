# Booking requests

`/book/` is an enquiry form, not a booking engine: no server, no database, no payment. A visitor sends a request; the team replies and confirms by hand.

## What the form does

1. Validates in the browser (`validateBooking`): name, email, kind of event, date, place. The past and any date a **private** stop holds are refused. Short notice and days with a public stop only warn.
2. If `PUBLIC_BOOKING_ENDPOINT` is set, POSTs JSON (`name, email, phone, eventType, date, startTime, hours, guests, location, packageName, message, subject`). The `message` field is the whole request as plain text. A 2xx shows “Request sent”.
3. Otherwise, or if the POST fails, shows the request back with buttons for each channel that is configured: **email** (`contactEmail`), **WhatsApp** (`whatsappNumber`), **Instagram** (`instagramUrl`), plus a copy button. Nothing is lost if no channel exists.
4. A hidden field catches simple bots: a filled-in trap shows a fake success and sends nothing.

## Setting up an endpoint

Any service that accepts a JSON POST and emails the owner works: Formspree, Web3Forms, Basin. Create a form, copy its URL into `PUBLIC_BOOKING_ENDPOINT` (a build variable; the URL is public by design, so use the service's allowed-origin setting and its spam filter). Rebuild.

## Availability

Dates come from the stops calendar. Add a stop with kind **Private** for a confirmed booking: the public calendar shows only “Booked” (no place), the feed omits it, and the form refuses that date. Delete or change it if the booking falls through.

## Privacy

The form says details are used only to reply. Do not add analytics or third-party scripts to the page. If a form service is used, name it in the privacy policy.
