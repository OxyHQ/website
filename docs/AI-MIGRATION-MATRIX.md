# Oxy AI — content and route migration matrix

Every place the site described AI, Alia, models, the API, credits or pricing
before the rebuild, what it claimed, where that responsibility moved, and what
was done to it. Companion to `docs/AI-CONTENT-ARCHITECTURE.md`.

Actions: **reuse** (unchanged), **repurpose** (kept, re-pointed), **replace**
(rewritten), **delete**.

## Pages and components

| Current path | Current claim | Target route / owner | Action | Dependency |
|---|---|---|---|---|
| `src/pages/AIPage.tsx` | "open models you can inspect, fine-tune and self-host", "conversations that never train anyone else" | `/ai`, umbrella landing | replace | none |
| `src/components/ai/AIPageContent.tsx` | giant Alia mark, prompt box, Alia + API + Developer Docs cards | `src/components/ai/platform/*` | replace | none |
| `src/components/ai/ConversationHero.tsx` | Alia chat demo as the platform hero | — | delete | none |
| `src/components/ai/GlobeScene.tsx` | decorative 1,200px globe on `/ai` | kept in the tree, off `/ai` | repurpose | real region data (Oxy #972) |
| `src/components/ai/ParticleCanvas.tsx` | research-section backdrop | research section on `/ai` | reuse | none |
| `src/components/ai/ApiCardCanvas.tsx` | API card hover canvas | quickstart section on `/ai` | reuse | none |
| `src/components/ai/AIResearchSection.tsx` | research positioning, also used by `/` | unchanged, `/ai` + `/` | reuse | none |
| `src/components/ai/*Mockup.tsx` | Alia product mockups, already unreferenced | Alia product surfaces | repurpose | Alia #139 |
| `src/data/ai.ts` | "Alia AI", "API", "Developer Docs" as the AI proposition | `src/data/ai/` | replace | none |
| `src/pages/AIPricingPage.tsx` | `api.alia.onl/billing/plans?product=alia` rendered as Oxy AI pricing | `/ai/pricing`, inference pricing | replace | pricing source (Oxy #972) |
| `src/pages/DevelopersPage.tsx` | no AI/inference entry point | `Build with AI` section | repurpose | none |
| `src/pages/PricingPage.tsx` | `price: '0'` structured data for paid and custom tiers | pricing hub | repurpose | none |
| `src/pages/HomePage.tsx` | AI implied to be Oxy-owned models | AI section with two paths | repurpose | none |

## Data and copy

| Location | Current claim | Action | Note |
|---|---|---|---|
| `src/data/content.ts` — `platformNavDropdown` | "Oxy AI — Private models, API and SDKs" | replace | becomes the AI dropdown |
| `src/data/content.ts` — `defaultFooterColumns` | one `Oxy AI` link under Platform | replace | dedicated AI column |
| `src/data/content.ts` — `technologiesNavFallbackItems` | `Alia` pointing at `/ai` | replace | Alia points at Alia |
| `src/data/content.ts` — `capabilities` | "Run AI models locally or through Oxy's privacy-first cloud"; "conversations are never used to train models" | replace | scoped to Oxy's own handling |
| `src/lib/i18n/locales/**` — `ai.*` | "Alia is your private, open-source AI assistant" as the definition of Oxy AI | replace | new namespace, all 15 locales |
| `public/llms.txt` | AI described as Alia | replace | new taxonomy |

## Assets under `public/ai/`

| Asset | Action | Reason |
|---|---|---|
| `research/**` | reuse | still referenced by `src/data/content.ts` and the research section |
| `hero-bg.png`, `shadow-bg.png`, `cta-*-bg.png` | reuse | generic backdrops, no product semantics |
| `managed-inbox.mp4`, `morning-briefing-*.mp4`, `todo*.mp4`, `catch-up.mp4`, `evening-briefing.mp4` | repurpose | Alia product footage; belongs on an Alia surface, not the umbrella page |
| `feature-integrations.png`, `feature-otg.png`, `pro-left.avif`, `pro-right.avif` | repurpose | same |

Nothing under `public/ai/` is deleted in this change: the OG-image build and the
research section still reference parts of the tree, and an asset removed while a
generated `_headers`/OG path still names it fails silently in production rather
than at build time.

## External and inbound URLs

| URL | Behaviour after the change |
|---|---|
| `/ai` | same route, rebuilt content |
| `/ai/pricing` | same route, now inference pricing, with a visible Alia-plans handoff |
| `/ai/models`, `/ai/inference`, `/ai/enterprise`, `/ai/trust`, `/enterprise`, `/contact/sales` | new |
| `/clarity` | unchanged; it was never an AI-platform route |

No AI marketing URL was retired, so no redirect was added. A redirect for a URL
that still resolves is what put 725 URLs in Search Console under "Page with
redirect", and `_redirects` carries no `200` rewrite ever.

## What deliberately did not move here

- Account, application and credential creation — Oxy Console.
- Model availability, routing and usage — the Oxy control plane.
- Provider credentials — Kaana only.
- Alia product plans — Alia.
