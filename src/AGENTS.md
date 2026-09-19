# SPA (`src/`)

Nested rules for the React app. The root `AGENTS.md` is at its byte budget and
covers the whole repository; this file holds the rules that only apply inside
`src/`. **Budget: under 8 KB**, same gate (`bun run validate:agents-md`).

> Procedures live in `docs/`; history lives in git. This file holds only RULES.

## Oxy AI

**Taxonomy, claims registry, source-of-truth map and release gates:
`docs/AI-CONTENT-ARCHITECTURE.md`. What happened to the old copy:
`docs/AI-MIGRATION-MATRIX.md`.**

Oxy AI is the umbrella; Oxy Inference is the public API; Alia and Codea are
products built on it. This site explains and converts — **Oxy Console owns
accounts, applications, credentials, limits, usage and billing, and nothing here
creates any of them.**

- **A call to action is DERIVED from an availability state, never written per
  card** — `src/lib/ai/availability.ts`. That is what stops a `coming_soon`
  service rendering `Start building`; `internal_only` renders no action at all,
  because such an object should not have reached a public page.
- **Availability comes from the content or catalogue source, never from "a route
  exists".** Flipping a service to `available` is an edit to
  `OXY_INFERENCE_AVAILABILITY` in `src/data/ai/taxonomy.ts` plus a claims-registry
  entry — deliberately a decision someone makes, not a side effect of shipping.
- **Operational facts come from the catalogue snapshot; no page declares a model,
  a price, a region or a policy inline.** `src/lib/ai/catalog.ts` is the one
  schema. An unknown `schemaVersion` is REJECTED rather than half-parsed:
  confident, wrong-shaped product data is worse than an empty page.
- **A failed or empty refresh keeps the last-known-good snapshot**
  (`src/lib/ai/snapshot.ts`). An upstream outage must read as "prices from
  Tuesday", never as "Oxy has no models" — the second one is a claim about the
  product, published by an HTTP timeout.
- **Money is a decimal string in the catalogue and integer nano-dollars in
  arithmetic** — `src/lib/ai/estimator.ts`. `0.1 + 0.2` is the reason. A unit
  with no published price is REPORTED, never counted as free, and structured data
  omits the offer rather than emitting `price: 0` — search engines read the
  price, not the description beside it.
- **A route-level policy is never promoted to a platform-wide promise.** "This
  deployment is zero-retention" is a fact about a deployment; "Oxy AI is
  zero-retention" is a claim about every third-party route the platform can
  reach. `src/data/ai/claims.ts` registers each load-bearing claim with its
  scope, evidence owner and review date; `bun run test:ai` fails the build on an
  unqualified term, an expired claim, or a retired `alia-*` alias in published
  copy.
- **A routing profile is not a model.** `Automatic`, `Fast`, `Balanced`,
  `Quality` and `Coding` are policies over models; the catalogue's `kind` field
  is what keeps them rendering differently.
- **A model id is two route segments, not a splat** — `src/lib/ai/modelId.ts`.
  Ids carry `/`, `@`, `:` and dots; react-router decodes `%2F` back to `/` before
  the component sees it, so the slash is encoded as `~`.
- **`/ai/pricing` is INFERENCE pricing.** Alia's product plans are sold by Alia
  and get a visible handoff, never a table here. The page that fetched
  `api.alia.onl/billing/plans` and rendered another team's subscriptions under
  "Oxy AI pricing" is what this replaced.
- **AI routes are mounted only on the Oxy tree.** `isFairCoinHost()` in
  `src/App.tsx` decides; `src/lib/host.ts` is the one authority for the split.

## Forms that reach the backend

- **Validate with the SAME schema the endpoint uses.** `/contact/sales` parses
  `server/contracts/salesInquiry.ts` before it posts, so the form cannot accept
  something the API answers 400 to.
- **A failed submission loses nothing.** The error state renders ABOVE the form,
  which stays mounted and fully populated, and focus moves to the summary.
- **Never ask for a secret.** No API key, credential, prompt or regulated data —
  and no field one could be typed into by mistake and stored.
- **A client-supplied account id is a claim of access, not proof.** The server
  re-checks it against the control plane before storing it.
