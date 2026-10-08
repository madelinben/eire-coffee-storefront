## Summary

## Scope
<!-- Layers, routes, CMS fields / Storefront queries, env vars, payment-provider or auth changes -->

## Dev test plan
<!-- Local URLs; Shopify: test order path; the visitor path you checked -->

## Reviewer checklist
- [ ] Correct layer, no forbidden imports, no new barrels
- [ ] `pnpm check` green
- [ ] `pnpm predeploy` green (includes `check:site`: SEO, schema.org, size budgets)
- [ ] Copy follows `copy.mdc`; accessible per `accessibility.mdc`
- [ ] New env var added to the app's `.env.example` and `docs/CONFIG.md`

## Infra / deploy config
<!-- N/A, or Cloudflare Pages / DNS / env / webhook change; Shopify app scope change; booking form endpoint change -->

## Deployment plan
Preview deployment → check preview URL → merge → production deploy on `main`.

## Reversion plan
- [ ] Revert merge commit / redeploy previous Cloudflare deployment
- [ ] Data change (D1 / Shopify): none, or named recovery step
