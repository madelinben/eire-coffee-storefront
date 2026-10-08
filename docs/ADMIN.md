# Site admin

`/admin/` is a form-based editor for all site content except Shopify products and orders (those stay in Shopify admin). Saving makes one GitHub commit; the deploy then rebuilds and publishes the site.

## What it edits

| Section | File | Notes |
|---------|------|-------|
| Contact and links | `src/content/site/settings.json` | Email, WhatsApp number, Instagram, Facebook, TikTok, tagline, service area, shop note |
| Stops calendar | `src/content/site/stops.json` | Where the trailer will be. `Repeat weeks` repeats a weekly pitch. Kind `private` = booked: public sees “Booked”, the booking form refuses the date |
| Menu | `src/content/site/menu.json` | Sections and items; an empty price hides the price |
| Hire packages | `src/content/site/hire.json` | Packages, what is included, notice wanted, travel note |
| Our story | `src/content/site/venture.json` | The earlier venture: story, highlights, facts, quoted reviews, photo |
| Home page | `src/content/site/home.json` | Headline, subline, story, three values, scrolling words |
| Photos | `src/content/site/pictures.json` + `src/assets/uploads/*.webp` | Resized to 1600 px WebP in the browser before upload. Mark one as the home lead and others for the “On the road” strip |
| FAQs | `src/content/faqs/*.md` | Question, answer, position |

Empty contact fields hide their buttons. Past stops disappear on the next build; the site rebuilds on every content save.

## How content is protected from mistakes

- `src/data/Content/schemas.ts` is the single definition of every file. The admin checks a save against it, and the build checks the same files again. A bad edit (broken link, a stop that ends before it starts, a public stop with no place) is refused with a plain message, and fails the build if it arrives some other way, so a broken page is never published.
- `src/data/Content/validate-content.ts` checks across files: every listed photo must have an image and every image a description, and the story page's photo must exist.
- A save is one commit, so the site never builds from half an edit. Revert a bad edit with `git revert` on that commit.

## Turning it on

1. Set `PUBLIC_ADMIN_ENABLED=1`, `PUBLIC_ADMIN_REPOSITORY=owner/name` (and `PUBLIC_ADMIN_BRANCH`, `PUBLIC_ADMIN_CONTENT_ROOT` if the app is in a sub-folder) in the build environment. Without them `/admin/` builds as a one-line “switched off” page.
2. Create a **fine-grained personal access token** (GitHub, Settings, Developer settings): this repository only, permission **Contents: Read and write**, short expiry. Nothing else.
3. Open `/admin/`, paste the token, sign in. The token lives in memory in that tab only; closing the tab forgets it. Do not paste it into chat or commit it.

Anyone with a token like that can already change the repository, so the admin adds no new power. It only makes the allowed changes easy.

## Protection today and later

Today:
- `PUBLIC_ADMIN_ENABLED` flag (off by default), `noindex, nofollow`, `Disallow: /admin` in robots.txt, not in the sitemap.
- A Content-Security-Policy meta tag: scripts and styles from this site only, connections only to `https://api.github.com`, no forms, no referrer.
- The GitHub token is the lock: without a token that can write to the repository, the page can read nothing private and save nothing.
- `scripts/check-site-quality.mjs` fails the build if the admin loses its noindex or CSP, or loads a third-party script.

Later (the seams are ready): `AdminAuth` and `ContentStore` in `src/features/content-admin/models/content-store.ts` are the two interfaces the screens use. Put Cloudflare Access on `/admin/*` for real page protection; the page holds no secrets, so that is hardening, not a fix.

## Adding a field

1. Add it to the schema in `schemas.ts` and to the JSON file.
2. Read it where it is shown.
3. The form shows it automatically: the editor builds inputs from the shape of the data. Add help text, a short choice list or a blank row template in `src/features/content-admin/utilities/blank-items.ts` if needed.

## Tests

- Unit: `src/features/content-admin/utilities/tests/` (GitHub commit sequence, FAQ files, draft validation).
- E2E: `e2e/admin.spec.ts` runs the real admin page against a fake GitHub API (nothing real is touched), checks one-commit saves, refusal of bad input, axe on every section.
