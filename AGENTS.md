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

## Rules

- **MCP auth token**: passed as a request header ONLY — never as a query string parameter.
- **Backend auth middleware**: do not add new local auth middleware. Use `@oxyhq/core/server` (`createOxyAuthMiddleware` / `getRequiredOxyUserId`) for all new protected routes.
