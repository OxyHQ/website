# Oxy website

Source for [oxy.so](https://oxy.so) and the FairCoin sub-brand at
[fairco.in](https://fairco.in) (dual-mounted from this same React app —
see `src/lib/host.ts` and `src/lib/faircoin-chrome.tsx`).

Oxy is an open-source ethical tech ecosystem building AI agents and apps:
Mention, Inbox, Codea Studio, Codea AI, Codea VS Code Extension,
Oxy AI (Alia), Oxy CRM, OxyOS, TNP, FairCoin and Homiio.

## Stack

- **React + Vite + TypeScript** — SPA with React Router.
- **Tailwind CSS** — utility-first styling with custom theme tokens in
  `src/styles/` and `src/index.css`.
- **TanStack Query** — server state. API hooks live in `src/api/hooks.ts`
  and bind to the CMS at `https://api.oxy.so`.
- **wagmi + viem** — wallet integration for FairCoin pages.
- **Express + Mongoose** — the API server lives under `server/`.

## Getting started

```sh
bun install
bun dev      # vite dev server on :5173, api server on :3001
```

Other scripts:

```sh
bun run build     # type-check + production build to dist/
bun run lint      # eslint
bun run preview   # serve the built bundle locally
```

## Project layout

```
src/
  api/         — REST client + TanStack Query hooks
  components/  — UI by surface area (homepage, codea, faircoin, ai, ...)
  data/        — Static fallback content & types used when the CMS is empty
  hooks/       — Domain hooks (FairCoin chain stats, scroll reveal, etc.)
  lib/         — Pure helpers (faircoin-links, host detection, wagmi config)
  pages/       — Route-level components (one per Route in App.tsx)
  stores/      — Zustand stores for cross-tree UI state
  styles/      — Page- and product-specific theme CSS
  constants.ts — Canonical positioning, founder, HQ, feature flags
```

## Feature flags

`src/constants.ts` exports a `FEATURES` object used to hide sections that
currently rely on placeholder content. Flip a flag to `true` once the
relevant section has real data wired up. See the comments in that file
for what each flag gates.

## Quarantined assets

The site was originally scaffolded by cloning marketing pages from other
products. Cloned/unused image assets now live under
`public/images/_unused/` (and `public/_unused/`) with a README explaining
their provenance. They are not deleted yet in case any are re-used after
the surrounding content is rewritten.

## Conventions

- Don&rsquo;t describe Oxy as a CRM. Oxy CRM is one product in the
  ecosystem; the parent brand is an open-source ecosystem of AI agents
  and apps.
- All team / blog / changelog / job / testimonial content should come
  from the CMS (`useTeamMembers`, `useNewsroomPosts`, `useJobs`, etc.).
  Static fallbacks under `src/data/` should stay empty or generic.
- Don&rsquo;t hardcode third-party customer logos or testimonials —
  they&rsquo;re still gated behind `FEATURES.SHOW_TRUSTED_LOGOS` /
  `FEATURES.SHOW_TESTIMONIALS` until real, verified ones exist.
