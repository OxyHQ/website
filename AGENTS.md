# Website (`~/Oxy/website`)

Vite + React + react-router-dom + Tailwind v4 marketing/web presence. Single flat package, no workspaces. Uses `@oxyhq/core`, `@oxyhq/bloom`, `@oxyhq/services`.

> Universal standards live in `~/AGENTS.md`, Oxy-wide gotchas in `~/Oxy/AGENTS.md`. **Procedures live in `docs/`; history lives in git.** This file holds only RULES. **Budget: under 10 KB**, enforced by `scripts/check-agents-md-size.mjs` (`bun run validate:agents-md`).

`src/` is the SPA, `server/` the Express API plus MCP server, `scripts/` the build-time steps (docs and changelog sync, prerender, pagefind, OG images).

```bash
bun run dev / build / server / mcp / sync-docs / sync-changelog
```

## Rules

- **`tsc --noEmit` is NOT the check this project builds with.** `bun run build` runs `tsc -b`, which builds the referenced projects and sees errors the flat check does not (a locale missing a key, an unused declaration). The frontend build failed on `main` for four commits while `tsc --noEmit` passed locally every time. Run `bunx tsc -b`, or the whole build, before pushing.
- **Adding a key to `src/lib/i18n/locales/` means adding it to all eleven.** The locale type requires every key, so three locales is a build failure, not a fallback. Translate it — a placeholder is read by whoever opens the thing.
- **The MCP auth token is a request HEADER only**, never a query-string parameter.
- **Do not add local auth middleware** — `@oxyhq/core/server` for every new protected route.
- **Validate deploy-time configuration BEFORE `app.listen()`, never inside `connectWithRetry`.** Anything thrown in that loop is caught and reported as a database problem, the migrations re-run, and every retry stacks another sync interval.

## Database (PostgreSQL, drizzle + postgres.js)

`DATABASE_URL` is the only knob and there is no fallback host — a missing URL must fail at boot rather than quietly connect somewhere else. Schema in `server/db/schema/`, one file per domain; `bun run db:generate` writes SQL into `server/db/migrations/`, which are committed and applied by `connectWithRetry` at boot, so a task can never serve a schema older than its code.

- **Primary keys are 24-character hex ids under the name `_id`** — the admin UI, every API response and every cross-table reference speak in them. New rows get the same shape from `newObjectId()`.
- **`.populate()` is `server/db/refs.ts`** — one query per referenced TABLE for a whole page of rows, never one per row. The API hands the frontend the referenced ROW in that field.
- **Sub-documents read and written as a unit are `jsonb`** (a page's sections, a job's description blocks). Splitting them into child tables buys joins nobody asked for.
- **Every list query ends on `_id`.** Postgres returns heap order, which moves when a row is rewritten — so a list sorted on `order` alone reshuffles after an edit, and on a tied sort with `offset`/`limit` a row can appear on two pages or on neither. `_id` is unique and ascends with creation.
- **Never bind a JS array into a raw `sql` fragment** — `x = ANY(${ids})` sends it as ONE scalar and Postgres reads the first element as an array literal (`22P02`). Use `inArray`. A scalar into `@> ARRAY[${tag}]::text[]` is fine and is how the tag filters work.
- **A duplicate key is SQLSTATE `23505`, via `isUniqueViolation` in `server/db/pgErrors.ts`** — a route that does not check it answers 500 where it should answer 409.
- **Wholesale replacements run in a transaction** (pricing, testimonials, navigation, backup import) — the admin sends the full list, and a delete that succeeded without its insert leaves the site with no navigation.
- **A column holds shapes its declared type suggests it should not** (an absolute URL in a media-id field, text where blocks were declared). The frontend tolerates both, so this reads as content appearing rather than breaking — check the rows rather than trusting the declaration.

## Theme tokens

**Bloom is the only source of colour.** `src/index.css` imports `@oxyhq/bloom/design-tokens/theme.css` for the `--color-x` vocabulary and declares none of it locally — that import also brings `card`, `tertiary`, the status, chart and sidebar families, the type scale, radii and shadows, so reach for those before inventing a name.

- **Never hand-write a palette.** `src/styles/theme.generated.css` holds every resolved value and is written by `scripts/generate-theme-css.ts` from Bloom's own `getPresetVars` / `buildSeedScopeVars` (wired into `predev`/`prebuild`). The hand-written file it replaced claimed to mirror a preset and had drifted into a different palette, with no `--card` at all — and every page here is PRERENDERED, so that gap is what visitors saw first.
- **A brand surface is one seed in `src/theme/brands.ts`** and Bloom's engine derives the ramp. A product stylesheet may hold type scale, rhythm and shape — **never a colour**; every value in one is a `var()` or a `color-mix()` over Bloom tokens.
- **Scoped blocks must carry the `--color-x` aliases as well as the canonical tokens** (hence `buildSeedScopeVars`) — an alias substitutes where it is DECLARED, so overriding `--background` inside a scope cannot move a `--color-background` declared at `:root`.
- **A palette cannot take a Tailwind variant.** A surface that changes palette at a breakpoint gets a second generated class inside a media query, from the same seed.
- **Verify a theme change in a real browser, comparing the palette BEFORE the app's JS runs against after** — tsc and the build cannot see this class of bug. Block `**/*.js` in Playwright rather than disabling JavaScript, or `page.evaluate` reads an empty document and every route "passes".

## Prerendering and SEO

`scripts/prerender.ts` writes `dist/<route>/index.html` for every route it can enumerate, plus `sitemap.xml` from that same list. The `<head>` comes from the real `<SEO>` component through the SSR bundle, and markdown routes additionally render their prose through the app's own `ArticleMarkdown`.

- **A route serves prose only where prose is what it HAS** — newsroom posts and synced docs. A marketing page is built from components, and emitting a heading that repeats its `<title>` is boilerplate, not content.
- **Locale mirrors deliberately keep the shell** — the markdown behind them is the default locale's text, and a `/es/` URL serving English prose reads worse than one serving none.
- The app mounts with `createRoot`, which empties `#root` first, so prerendered prose is never markup React must reconcile. **Do not switch to `hydrateRoot`** without making the markup match the full page tree.
- Prose is capped per document, cut on a blank line, and every capped route is reported at the end of the build.
- **Verify with JavaScript blocked, and mind the trailing slash** — `vite preview` answers the slashless form with the SPA fallback, so a probe without it reads an empty shell and reports that nothing changed.

## Feature board

`TrackedRepo` is the single source for which repos the site knows about, and one row drives two unrelated surfaces. **Never conflate the switches:** `active` gates the changelog release sync only; `featureBoard` gates /features AND is the owner allow-list (which is why the board spans two orgs with no org constant anywhere — adding an org is a row, never a code change); `acceptsProposals` additionally lets a signed-in visitor open an issue.

- **A GitHub token env var must not be named `GITHUB_*`** — GitHub reserves that prefix for Actions secrets, so such a name can never be provisioned through the repo-secret → SSM sync. The board's write credential is `FEATURE_BOARD_GITHUB_TOKEN` for exactly that reason.
- **Priority labels are reconciled on a schedule with hysteresis, never per vote.** A label write is a permanent timeline event on someone's issue. Tiers carry `enterAt`/`exitAt` and the gap is what stops an issue on a boundary relabelling itself all day; the reconcile re-reads the issue's labels immediately before writing and writes nothing when they already match.

## Deploy

Frontend: Cloudflare Pages project `oxy-website` from `dist/`. Backend: ECS Fargate at `website-api.oxy.so` / `api.website.oxy.so`, `oven/bun` image running TypeScript directly (no compile step).

- **A green deploy job is not a deploy** — the circuit breaker rolls back and `ecs wait services-stable` exits 0 on the OLD image. Confirm the PRIMARY deployment's `rolloutState` or the running tasks' image digest.
- **Editing `.github/workflows/` can block every subsequent run** — GitHub rescans a changed workflow and can hold runs at `action_required` until someone clicks approve in the UI; there is no API for it. The scan is per file version, so reverting to bytes that already ran gets deploys moving again.
