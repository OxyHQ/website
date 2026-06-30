# Website (`~/Oxy/website`)

Vite 8 + React 19 + react-router-dom v7 + Tailwind v4 + TypeScript 6 marketing/web presence. Single flat package (no workspaces). Oxy SDK packages used: `@oxyhq/core`, `@oxyhq/bloom`, `@oxyhq/auth`.

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

## Rules

- **MCP auth token**: passed as a request header ONLY — never as a query string parameter.
- **Backend auth middleware**: do not add new local auth middleware. Use `@oxyhq/core/server` (`createOxyAuthMiddleware` / `getRequiredOxyUserId`) for all new protected routes.
