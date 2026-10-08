# Éire Coffee Co.: storefront

Website for Éire Coffee Co., a mobile coffee trailer based in Chester. Good coffee, great craic.

Astro (static) with React islands for the cart, Tailwind v4, Zod. Shopify provides the shop (Storefront API, hosted checkout). Everything else is content in JSON, edited in a built-in admin that commits to GitHub.

| Page | What it does |
|---|---|
| `/` | Brand hero, next stop, story and values, menu preview, hire teaser, earlier venture, shop, FAQs |
| `/calendar` | Where the trailer will be: month grids, every stop, subscribe in a calendar app, add single stops to Google Calendar |
| `/book` | Hire packages and a booking-request form (date availability from the calendar; see `docs/environment/booking.md`) |
| `/menu`, `/our-story`, `/shop`, `/faqs`, `/contact` | As named. `/our-story` tells the earlier venture, Capuchin Coffee in Hale |
| `/admin` | Private content editor (off unless enabled, `docs/ADMIN.md`) |

## Run it

```bash
pnpm setup                          # install, seed .env.local, git hooks
node scripts/mock-storefront.mjs &  # fake Shopify, so no store is needed
pnpm dev                            # http://localhost:4321 (set PUBLIC_SHOPIFY_STOREFRONT_URL=http://localhost:4400 in .env.local)
```

Gates: `pnpm check` (entry files, lint, typecheck), `pnpm test`, `pnpm build && pnpm check:site`, `pnpm test:e2e`; `pnpm predeploy` runs them all. Rules and docs: start at `CLAUDE.md`, then `.cursor/rules/` and `docs/`.

## Before it goes live

- Replace the **sample stops** in `src/content/site/stops.json` (titles start “Sample”) with real ones, and the placeholder menu, packages and FAQ answers with the real ones.
- Add `contactEmail` and `whatsappNumber` in `settings.json`, and set `PUBLIC_BOOKING_ENDPOINT` for instant booking requests.
- Add the Shopify store domain and Storefront token (`docs/environment/shopify.md`).
- Swap in the real logo, colours and typeface (`theme.mdc` lists where) and upload real trailer photos in the admin.
- Set `SITE_ORIGIN`, `PUBLIC_SITE_NOINDEX=0` and `SEO_STRICT=1` for the production build (`docs/DEPLOYMENT_STRATEGY.md`).
