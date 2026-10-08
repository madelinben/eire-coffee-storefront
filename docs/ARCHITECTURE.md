# Architecture

System design index. Local run: [SETUP.md](./SETUP.md). Shipping: [DEPLOYMENT_STRATEGY.md](./DEPLOYMENT_STRATEGY.md). Law lives in `../.cursor/rules/*.mdc`; this file points, does not repeat.

## Stack

| Layer | Choice |
|---|---|
| Framework | Astro (static output) + React islands |
| Language | TypeScript strict, no `any` |
| Commerce | Shopify: Storefront API (GraphQL), Shopify-hosted checkout |
| Content | JSON files validated by one schema (`zod/mini`), FAQ markdown in an Astro content collection |
| Validation | Zod (Storefront responses parsed at the service boundary) |
| Styling | Tailwind CSS v4 + tailwind-merge + tailwind-variants |
| Animation | CSS transitions + `IntersectionObserver` |
| Client state | Nano Stores (cart id in `localStorage`) |
| Hosting | Cloudflare Pages, static only |
| Testing | Vitest (unit), Playwright (e2e) |

No server code, no database, no secrets in this repo.

## Repo layout

Single app at this folder's root (the git root is one level up), code under `src/` (alias `@/`). Rules: `project-structure.mdc`, `layers.mdc`.

| Path | Role |
|---|---|
| `src/pages/` | Static routes, thin |
| `src/features/<entity>-<objective>/` | Visitor jobs |
| `src/data/<Entity>/` | `get*Server` / `get*Client` + `dto` transforms |
| `src/services/shopify/` | Storefront API client (the only Shopify caller) |
| `src/stores/` | Client stores |
| `src/content/` | Site JSON (`site/*.json`) and FAQ markdown |
| `src/utilities/` | Pure helpers |

```
page / feature → data, services, stores
data → dto, services
services → utilities
```

## Features

| Folder | Job |
|---|---|
| `site-shell` | Header, footer, `Illustration`, `OrnamentDivider`, ticker, page banner, scroll reveals |
| `brand-story` | Home hero, values, photo strip, the earlier-venture story and teaser |
| `stop-browse` | Next stop, month grid, stop cards, subscribe links, iCalendar feed + Google Calendar links |
| `booking-request` | Packages, the booking form and its message and validation helpers |
| `menu-browse` | Menu sections and the home preview |
| `faq-browse` | Accordion |
| `contact-hub` | Contact cards and the follow band |
| `product-browse` | Product list/detail from Shopify |
| `cart-manage` | Add, change quantity, remove, go to checkout |
| `content-admin` | The `/admin/` editor that commits content to GitHub |

`src/domain/stop/` holds the one rule this repo owns: how stops repeat, when they are past, the month grid and which dates a private event blocks. Everything else commercial is Shopify's.

## Shop request trace

Add to cart (browser):

1. **feature** — `cart-manage` island handles the click.
2. **data** — `addCartLine` reads the stored cart id (or creates a cart) and returns the updated cart view-model.
3. **services** — `services/shopify` sends `cartLinesAdd`, parses the response with Zod.

Checkout: cart view-model carries `checkoutUrl`; the button is a plain `<a href>` to Shopify. Payment, order creation, stock and staff notification are Shopify’s.

## Not applicable (by design)

a database, a booking back end (requests go to an email, a messaging app or a form endpoint), custom order state machine, background jobs, own database, auth, module-ownership table, shared packages.
