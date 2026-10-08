# Context — ubiquitous language

One row per domain noun, one spelling. Every doc, rule, identifier and UI label reuses it (`naming.mdc`).

| Term | Meaning |
|---|---|
| Stop | One day, one place for the trailer: date, start and end time, venue, kind. A repeating stop is expanded to one stop per week. Not “event” or “session”. |
| Kind | `pitch` (regular spot), `market`, `festival` or `private`. A private stop shows the public only “Booked” and blocks that date on the booking form. |
| Booking request | What the visitor sends from `/book/`: an enquiry, not a confirmed booking. Sent to a form endpoint, or handed back for email, WhatsApp or Instagram. |
| Package | A way of hiring the trailer (`hire.json`): who it suits, what is included. |
| Venture | The earlier business (Capuchin Coffee, Hale) told on `/our-story/`. |
| Product | A bag of beans or merchandise item staff manage in Shopify, with variants and a price. Not “item”. |
| Cart | The visitor’s chosen product variants, held by Shopify; the browser keeps only the cart id in `localStorage`. Not “basket”. |
| Order | A paid Shopify order. Staff manage it in Shopify admin or the Shopify mobile app. |
| Staff | The Éire team with a Shopify staff login. |
