# Website (`~/Oxy/website`)

Vite 8 + React 19 + react-router-dom v7 + Tailwind v4 + TypeScript 6 marketing/web presence. Single flat package (no workspaces). Oxy SDK packages used: `@oxyhq/core`, `@oxyhq/bloom`, `@oxyhq/services`.

## Structure

- `src/` — React SPA (pages, components, hooks, stores, content)
- `server/` — Express backend API (`server/index.ts`) + MCP server (`server/mcp.ts`)
- `scripts/` — build-time scripts: `sync-docs.ts`, `sync-changelog.ts`, `prerender.ts`, pagefind runner, OG image generation

## Commands

```bash
bun run dev           # predev: sync-docs + sync-changelog; then Express + Vite in parallel
bun run build         # prebuild: sync-docs + sync-changelog + OG images; tsc + vite build; postbuild: search index + prerender + pagefind
bun run server        # Express backend only
bun run mcp           # MCP server
bun run sync-docs     # sync docs content to src/
bun run sync-changelog  # sync changelog to src/
```

## Deploy

- **Frontend**: CF Pages project `oxy-website` (`dist/` output) via `.github/workflows/deploy.yml`. `VITE_API_URL=https://website-api.oxy.so`.
- **Backend**: ECS Fargate (`~/Oxy/oxy-infra`) at `website-api.oxy.so` / `api.website.oxy.so`. Dockerfile `oven/bun:1.3.14-alpine`; CMD `bun server/index.ts` (TypeScript runs directly via Bun — no compile step).

## Database

PostgreSQL, reached through Drizzle + `postgres.js` — the same stack as Mention's
backend. `DATABASE_URL` is the only knob; there is no fallback host, because a
missing URL should fail at boot rather than quietly connect somewhere else.

- **Schema** in `server/db/schema/`, one file per domain, `bun run db:generate`
  writes the SQL into `server/db/migrations/`. Migrations are committed and
  applied by `connectWithRetry` at boot, so a task can never serve a schema
  older than the code that shipped with it. `bun run db:migrate` runs them by
  hand.
- **Primary keys are the Mongo ObjectId, under its Mongo name `_id`.** The admin
  UI, every API response and every cross-table reference already speak in those
  ids, so the copy from Mongo was a straight insert and the DTOs the frontend
  receives did not change during the cutover. New rows get an id of the same
  shape from `newObjectId()`.
- **`.populate()` is `server/db/refs.ts`**: one query per referenced table for a
  whole page of rows, never one per row. The API still hands the frontend the
  referenced ROW in that field, which is what `resolveProductLogoUrl` and the
  admin forms read.
- Sub-documents that are read and written as a unit (a page's sections, a job's
  description blocks, the hero's carousel slots) are `jsonb`. Splitting them
  into child tables would buy joins nobody asked for.
- **Duplicate-key handling changed shape:** Mongo's `err.code === 11000` is
  SQLSTATE `23505` — `isUniqueViolation` in `server/db/pgErrors.ts`. A route that
  checks the old value answers 500 where it used to answer 409.
- **Wholesale replacements run in a transaction** (pricing, testimonials,
  navigation, backup import). The admin sends the full list, and a delete that
  succeeded without its insert would leave the site with no navigation.
- `server/db/copyFromMongo.ts` (`bun run db:copy`) copies a Mongo database in,
  keyed on `_id`, idempotent and re-runnable, and never deletes. It verifies by
  reading counts back out of Postgres rather than trusting what the loop did.
  In production it runs as a one-off ECS task via the **Copy Mongo to Postgres**
  workflow, because neither database is reachable from a laptop or a GitHub
  runner. Steps and the cutover order: `docs/POSTGRES-CUTOVER.md`.
- **`mongodb` is pinned to 6, and is a runtime dependency, only for that copy.**
  Driver 7 pulls a `bson` that calls `v8.startupSnapshot.isBuildingSnapshot()`
  at import time, which Bun does not implement — the copier dies before it opens
  a connection, and the production image runs Bun. Both the pin and the
  dependency come out once the cutover is done.

## Theme tokens

Bloom is the only source of colour. `src/index.css` imports
`@oxyhq/bloom/design-tokens/theme.css` for the `--color-x` alias vocabulary and
declares none of it locally — it also brings `card`, `tertiary`,
`success/error/warning/info`, the chart and sidebar families, the type scale,
radii and shadows, so reach for those before inventing a name.

- **Never hand-write a palette.** `src/styles/theme.generated.css` holds every
  resolved value — the site palette, the FairCoin apex, `.force-dark`, and each
  brand scope — and is written by `scripts/generate-theme-css.ts` (wired into
  `predev` / `prebuild`, or `bun run generate:theme`) from Bloom's own
  `getPresetVars` / `buildSeedScopeVars`. The file that preceded it claimed to
  mirror the `oxy` preset and had drifted into a different palette: a light-grey
  `--secondary` where the preset resolves to teal, and no `--card` at all, so
  `bg-fill` was transparent until React mounted. Every page here is prerendered,
  so that gap is what visitors saw first.
- **A brand surface is one seed in `src/theme/brands.ts`**, and Bloom's engine
  derives the ramp. A product stylesheet may hold type scale, rhythm, shape —
  never a colour. `pay-theme.css` and `slice-theme.css` are the reference: every
  value there is a `var()` or a `color-mix()` over Bloom tokens.
- Scoped blocks must carry the `--color-x` aliases as well as the canonical
  tokens, which is why they come from `buildSeedScopeVars`: an alias substitutes
  where it is declared, so overriding `--background` inside `.tnp-theme` cannot
  move a `--color-background` declared at `:root`.
- A palette cannot take a Tailwind variant — `lg:force-dark` is not a thing,
  since a variant applies to a utility and a palette is a declaration block. A
  surface that changes palette at a breakpoint (the newsroom hero, dark only from
  `lg`) gets a second generated class inside a media query, `.force-dark-lg`,
  from the same seed as the first.
- Verify a theme change in a real browser, comparing the palette BEFORE the app's
  JS runs against after — tsc and the build cannot see this class of bug. Block
  `**/*.js` in Playwright rather than disabling JavaScript, or `page.evaluate`
  reads an empty document and every route "passes".

## Feature board

`TrackedRepo` is the single source for which repos the site knows about, and one
row drives two unrelated surfaces, so each has its own switch. Never conflate
them:

- `active` gates the changelog release sync only. It predates the board.
- `featureBoard` gates /features: which issues are listed, where votes may be
  cast, and which priority labels are reconciled. **It is also the owner
  allow-list**, which is why the board spans OxyHQ and FairCoinOfficial with no
  org constant anywhere. Adding an org is a row, never a code change.
- `acceptsProposals` additionally lets a signed-in visitor open an issue there.

Seed the real repos with `bun run seed:feature-board` (idempotent, safe on
production, only ever turns the two board switches on) and manage them
afterwards under /admin/repos.

- **A GitHub token env var must not be named `GITHUB_*`.** GitHub reserves that
  prefix for Actions secrets, so such a name can never be provisioned through
  the repo-secret to SSM sync in `deploy-aws.yml`. The board's write credential
  is `FEATURE_BOARD_GITHUB_TOKEN` for exactly this reason. (The existing
  read-only `GITHUB_TOKEN` hits the same wall: the sync explicitly skips it, so
  the changelog sync runs anonymous in production.)
- **Priority labels are reconciled on a schedule with hysteresis, never per
  vote.** A label write is a permanent timeline event on someone's issue. Tiers
  carry `enterAt`/`exitAt` and the gap between them is what stops an issue on a
  boundary relabelling itself all day. The reconcile re-reads the issue's labels
  immediately before writing, and writes nothing when they already match.
- **Validate deploy-time configuration before `app.listen()`, not inside
  `connectWithRetry`.** Anything thrown in that loop is caught and reported as
  "MongoDB unavailable", the migrations re-run, and `startSyncInterval` stacks
  another interval on every retry. `getPriorityTiers()` is called at boot for
  this reason.

## Prerendering and SEO

`scripts/prerender.ts` writes `dist/<route>/index.html` for every route it can
enumerate, plus `sitemap.xml` from that same list. Two halves come from the SSR
bundle (`src/entry-server.tsx`): the `<head>`, rendered through the real `<SEO>`
component, and — for routes whose content is markdown — the page's prose,
rendered through the app's own `ArticleMarkdown`.

- **A route serves prose only where prose is what it has.** Newsroom posts (the
  API returns `content`) and the synced docs (markdown on disk). A marketing
  page is built from components; emitting a heading that repeats its `<title>`
  would be boilerplate, not content, so it keeps the shell.
- **Locale mirrors deliberately keep the shell** — the markdown behind them is
  the default locale's text, and a `/es/` URL serving English prose reads worse
  than one serving none.
- The app mounts with `createRoot`, which empties `#root` first, so prerendered
  prose is never markup React has to reconcile. Do not switch to `hydrateRoot`
  without making the markup match the full page tree, which is exactly what
  `entry-server.tsx` explains it cannot do.
- Prose is capped at 40,000 characters per document, cut on a blank line, and
  every capped route is reported at the end of the build. The generated API
  references are why: one typedoc page is 200 kB of markdown and rendered to
  nearly a megabyte of HTML.
- **Verify with JavaScript blocked, and mind the trailing slash.** `vite
  preview` answers the slashless form with the SPA fallback, so a probe without
  it reads an empty shell and reports that nothing changed.

## Rules

- **MCP auth token**: passed as a request header ONLY — never as a query string parameter.
- **Backend auth middleware**: do not add new local auth middleware. Use `@oxyhq/core/server` (`createOxyAuthMiddleware` / `getRequiredOxyUserId`) for all new protected routes.
