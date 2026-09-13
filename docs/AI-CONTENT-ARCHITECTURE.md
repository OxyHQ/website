# Oxy AI — website content architecture

What this website is allowed to say about Oxy AI, where each statement comes
from, and who owns the decision to change it.

Companion platform epics: [Oxy control plane #972](https://github.com/OxyHQ/oxy/issues/972),
[Alia migration #139](https://github.com/OxyHQ/Alia/issues/139), and the website
epic [#64](https://github.com/OxyHQ/website/issues/64) this document was written for.

---

## 1. The website is a content consumer, not the AI control plane

The Oxy website explains and converts. It does not configure, meter or bill.

```text
Website        explains, markets, converts, links out
Oxy Console    accounts, applications, credentials, balances, limits, usage, billing
Kaana          inference execution; provider credentials live only there
Alia / Codea   products built on the platform
```

Consequences that are not negotiable:

- The website never creates an account, organization, application, credential,
  balance or invoice. Every configuration and purchase CTA ends in Oxy Console.
- The website server never connects to Oxy's private billing or catalogue
  database. It reads a **customer-safe** public artifact (§4).
- A public static build never requires a production API secret.
- A model that exists internally for Alia is not, by that fact, publicly
  purchasable. Commercial availability is a separate field from technical
  availability.

## 2. Public taxonomy

```text
Oxy AI                    umbrella for Oxy's AI platform, products and services
├── Oxy Inference         unified API, catalogue, routing and usage-based service
├── Managed Inference     selected models served on infrastructure managed by Oxy
├── Dedicated Inference   private endpoints, reserved capacity, enterprise deployments
├── Alia                  assistant/product for people and teams
├── Codea                 coding and agent product
└── Alia Models           future model family, only after genuine releases exist
```

Terms that must stay distinct:

- **Oxy AI** is not a model.
- **Alia** is not the generic inference API.
- **Oxy Inference** is not a second control plane and not a second developer
  account system.
- **Oxy-hosted** means Oxy serves a model. It does not mean Oxy created it.
- **Publisher**, **model**, **model revision**, **serving provider**,
  **deployment** and **routing profile** are six different objects and render
  differently. `Automatic`, `Fast`, `Balanced`, `Quality` and `Coding` are
  routing profiles, never models.
- `alia/*` is reserved for real Alia-owned or Alia-derived releases that have an
  artifact, a revision and a model card. Until then the family is
  `coming_soon`, and `alia-v1`, `alia-v1-pro` and `alia-lite` are retired
  aliases that the site does not advertise as models.
- **Relay** is a provisional *internal* data-plane name. It does not appear in
  marketing copy. The only public origin for Kaana is `https://kaana.ai`.

### Which surface may use which name

| Name | Website | Console | Docs | Product UI |
|---|---|---|---|---|
| Oxy AI | yes, as the umbrella | yes | yes | no |
| Oxy Inference | yes | yes | yes | no |
| Managed Inference | yes | yes | yes | no |
| Dedicated Inference | yes, sales-led | yes | yes | no |
| Alia Models | only with an availability state | no | no | no |
| Relay | no | no | no | no |

## 3. Availability and claim model

One vocabulary, declared once in `src/lib/ai/availability.ts`, shared by every
service card, model row, navigation entry and CTA:

| State | What the site shows |
|---|---|
| `available` | the real purchase/configuration CTA (`Start building`) |
| `beta` | a beta label and the beta path |
| `private_preview` | `Request access` / `Request evaluation` |
| `coming_soon` | a waitlist/announcement CTA, never a checkout CTA |
| `internal_only` | nothing — it is not a public object |
| `deprecated` | the replacement and the sunset information |

Rules:

- Availability is **supplied by the content or catalogue source**. It is never
  inferred from "a frontend route exists".
- `internal_only` objects are stripped before anything is rendered, indexed,
  sitemapped or written into structured data. `scripts/ai-catalog.test.ts` checks
  the filter, and `scripts/ai-dist-guard.ts` re-checks the built artifact — the
  first guards the path the data is supposed to take, the second catches the
  paths nobody thought of.
- Before a service moves to `available`, the checklist in §7 has to pass.

### Prohibited and qualified terms

These may not appear unqualified anywhere in AI copy.
**`PROHIBITED_UNQUALIFIED_TERMS` in `src/data/ai/claims.ts` is the enforced list**
— `scripts/ai-claims.test.ts` fails the build on any of them appearing in
published copy without a qualifier from `SCOPE_QUALIFIERS` in the same sentence.
It currently covers zero retention, no training, self-hosting, EU-only hosting,
`unlimited`, the compliance certifications, guaranteed uptime and uptime
percentages.

Two more are prohibited by review rather than by the test, because they are too
ordinary a word to grep for: **`our model`** of a model Oxy did not publish, and
**`private`** or **`open model`** of a model, where the licence term is what
should be named instead.

Each of these is either route-specific or contractual. A route-level policy is
never promoted to a platform-wide promise: "this deployment is zero-retention"
is a fact about a deployment; "Oxy AI is zero-retention" is a claim about
every third-party route the platform can reach, which nobody can make.

Distinguish in copy:

- **open-source platform** — the code Oxy publishes.
- **open-weight model** — weights downloadable under some licence.
- **open model** — ambiguous; do not use.
- **source-available model** — source published, licence not open.

### Claims registry

`src/data/ai/claims.ts` is the machine-readable registry: every load-bearing
public claim carries its exact text, its scope, the evidence owner, the review
date and a status. `scripts/ai-claims.test.ts` asserts that every registered
claim has an owner and an unexpired review date, and that no page renders a
prohibited term outside a registered, scoped claim.

## 4. Source-of-truth map

| Content | Source of truth | Reaches the site via |
|---|---|---|
| Editorial marketing copy | this repository (`src/data/ai/**`) | code |
| Page SEO/title/description | i18n dictionaries + CMS `/api/seo` | code + CMS |
| Navigation, footer | CMS, with the code fallback in `src/data/content.ts` | API |
| Model catalogue | Oxy control plane (#972) | build-time snapshot + runtime refresh |
| Model revisions | Oxy control plane | snapshot |
| Serving providers, deployments, regions | Oxy control plane | snapshot |
| Capabilities | Oxy control plane | snapshot |
| Retention/training policy per route | Oxy control plane | snapshot |
| Commercial availability | Oxy control plane | snapshot |
| Customer pricing | Oxy control plane pricing service | snapshot + runtime refresh |
| Status/health | `/status`, `server/services/infrastructureStatus.ts` | API |
| Product availability (Alia, Codea) | product teams, recorded here as a claim | code |
| Legal/trust documents | legal, published under `/legal` | CMS/MDX |

Nothing in the left column is hand-maintained in a website constant once its
upstream source exists. Until #972 publishes the catalogue endpoint, the
snapshot is **empty** and the pages say so — an empty catalogue is truthful,
an invented one is not.

### Build-time snapshot and runtime refresh

```text
build   OXY_PUBLIC_CATALOG_URL set?  ── yes ─▶ fetch ─▶ validate ─▶ strip internal ─▶ write snapshot
                │                                            │
                no                                        failure
                │                                            │
                └────────── keep the committed last-known-good snapshot ◀──┘

runtime  committed snapshot renders first ─▶ client refresh ─▶ newer data replaces it
                                                    │
                                                 failure ─▶ snapshot stays on screen
```

- A failed or empty response never replaces a valid snapshot.
- The snapshot is what the FIRST render shows, so a catalogue surface never
  starts on a spinner or an empty state it is about to contradict. The
  prerenderer writes the `<head>`, not the body: prose for model detail pages
  lands with the catalogue (`docs/AI-MIGRATION-MATRIX.md`).
- The snapshot records `schemaVersion`, `generatedAt` and `priceVersion`.
- An unknown `schemaVersion` is rejected outright rather than rendered as
  partial data.

## 5. Routes and their owners

| Route | Purpose | Primary CTA |
|---|---|---|
| `/ai` | Oxy AI umbrella landing | Start building / Explore models / Talk to sales |
| `/ai/inference` | the inference service, for technical evaluators | Start building |
| `/ai/models` | public model catalogue | View model |
| `/ai/models/:publisher/:model` | model or revision detail | Start building |
| `/ai/pricing` | inference pricing and estimator | Start building |
| `/ai/enterprise` | shared/managed/dedicated for organizations | Talk to sales |
| `/ai/trust` | data handling, policies, regions | Read the policy |
| `/enterprise` | cross-Oxy B2B hub | Talk to sales |
| `/contact/sales` | sales and private-evaluation requests | Submit |

`/company/business` is unchanged and unrelated: it explains how Oxy itself makes
money. `/enterprise` is what Oxy sells to organizations.

`/ai/pricing` is **inference** pricing. Alia's product plans live on Alia and
are reached through a visible handoff link, never rendered here.

AI routes are mounted only on the Oxy route tree. `fairco.in` gets none of them
(`isFairCoinHost()` in `src/App.tsx`), and `src/lib/host.ts` is the one authority
for that split.

## 6. Editorial vs operational content

- **Editorial** (hero copy, explanations, use cases, FAQs, CTA labels) lives in
  `src/data/ai/**` in English and is translated through
  `src/lib/i18n/locales/**` for the chrome-level strings. CMS overrides are
  additive: an empty CMS response never erases required product or legal
  context, because the code fallback is what renders.
- **Operational** (models, prices, regions, policies, availability) only ever
  comes from the snapshot. No page declares a model or a price inline.

## 7. Release gates

A service or model moves to a more permissive availability state only after:

1. **Commercial** — a documented permission to resell or serve the route.
2. **Pricing** — a documented customer price with a price version.
3. **Data policy** — a documented retention and training policy for the route.
4. **Readiness** — deployment/adapter readiness supplied by the Oxy catalogue,
   not inferred from a provider logo or an adapter existing in source.
5. **Licence** — licence and attribution reviewed, trademark attribution added
   where the licence requires it.
6. **Legal/geography** — publication reviewed for geography-specific
   restrictions.
7. **Claims** — every new claim registered in `src/data/ai/claims.ts` with an
   owner and a review date.

Rolling back never means restoring "Alia alias = Oxy model" messaging. The
acceptable rollback is to an earlier signed snapshot or to a more conservative
availability state.

## 8. Conversion measurement

No analytics collector is wired up by this change, and that is deliberate: this
site ships no third-party tracking, and adding one is a decision for the people
who own Oxy's privacy position rather than a side effect of building a funnel.

What is defined here is the **event vocabulary**, so that when an approved
first-party collector exists the funnel is a wiring job rather than a naming
argument.

| Event | Fires when |
|---|---|
| `ai_landing_view` | `/ai` rendered |
| `ai_inference_view` | `/ai/inference` rendered |
| `ai_models_search` | catalogue search or filter changed |
| `ai_model_view` | a model detail page rendered |
| `ai_pricing_interact` | a pricing table or handoff link used |
| `ai_estimator_use` | the estimator produced a total |
| `ai_console_cta` | a Console deep link followed |
| `ai_docs_cta` | a documentation link followed |
| `sales_form_start` | first field of `/contact/sales` edited |
| `sales_form_submit` | a submission accepted |
| `sales_preview_request` | a submission with a private-preview interest |

Rules that hold whatever collector is chosen:

- **Never record content.** No prompt text, no sales-message body, no API key,
  no form field value. An event carries that something happened, and which
  surface it happened on.
- **No user-level cross-site tracking**, and no IP address — the same invariant
  the rest of the Oxy stack holds to.
- Campaign attribution only through privacy-safe parameters already on the URL.
- Each event's purpose and retention is documented before it is collected.
- Catalogue and pricing fetch failures, and sales-form submission failures, are
  worth error monitoring; they are the two places where a silent failure looks
  identical to "there is nothing here".

## 9. Parallel-work contracts

- One operational schema (`src/lib/ai/catalog.ts`). No page-local copies.
- One availability vocabulary (`src/lib/ai/availability.ts`).
- One canonical English copy source per surface, under `src/data/ai/`.
- No page invents prices, model names, providers, regions, compliance claims or
  launch dates.
- Account, application and credential creation is never implemented here.
