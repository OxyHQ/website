<h1 align="center">Oxy website</h1>

<p align="center">
  The source of <a href="https://oxy.so">oxy.so</a>, and of <a href="https://fairco.in">fairco.in</a>, which is the same app answering to a different host.
</p>

<p align="center">
  <a href="LICENSE"><img alt="Breathe License 1.0" src="https://img.shields.io/badge/license-Breathe%201.0-440151?style=flat-square"></a>
  <img alt="Bun" src="https://img.shields.io/badge/bun-1.3-440151?style=flat-square&logo=bun&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-440151?style=flat-square&logo=vite&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-440151?style=flat-square&logo=react&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4-440151?style=flat-square&logo=tailwindcss&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-440151?style=flat-square&logo=typescript&logoColor=white">
</p>

<p align="center">
  <b>One React app, two brands.</b><br>
  <code>src/lib/host.ts</code> decides which one you are looking at,<br>
  and <code>src/lib/faircoin-chrome.tsx</code> swaps the chrome around it.
</p>

---

<table>
<tr>
<td valign="top" width="50%">

### 🎨 Colour has exactly one source

Every token comes from [`@oxyhq/bloom`](https://www.npmjs.com/package/@oxyhq/bloom). `src/index.css` imports the design token stylesheet and declares no palette of its own, and `src/styles/theme.generated.css` is written by `scripts/generate-theme-css.ts` from Bloom's own engine.

A brand surface is one seed in `src/theme/brands.ts`. Product stylesheets may hold type scale, rhythm and shape, never a colour.

</td>
<td valign="top" width="50%">

### 📄 Prerendered, then hydrated

`bun run build` does not stop at a bundle. It builds a search index, prerenders every route through `entry-server.tsx`, runs Pagefind over the output, and generates the CSP headers.

That means the first paint a visitor sees comes from static HTML, before any JavaScript runs. It is worth remembering when you change anything that renders differently on the server.

</td>
</tr>
</table>

## Stack

| Layer | What is used |
|---|---|
| App | React 19, Vite 8, TypeScript 6, React Router 7, the React Compiler |
| Styling | Tailwind 4, NativeWind, Bloom design tokens |
| Cross platform UI | React Native Web through `vite-plugin-react-native-web`, with [`@oxyhq/services`](https://www.npmjs.com/package/@oxyhq/services), [`@oxyhq/core`](https://www.npmjs.com/package/@oxyhq/core) and [`@oxyhq/bloom`](https://www.npmjs.com/package/@oxyhq/bloom) |
| Data | TanStack Query with persisted cache, hooks in `src/api/` |
| Content | MDX, with docs and changelog synced in at build time, and Pagefind for site search |
| Wallet | wagmi and viem, on the FairCoin surfaces |
| Motion and 3D | Framer Motion, Three.js with React Three Fiber |
| Server | Express 5 with drizzle over PostgreSQL under `server/`, plus an MCP server at `server/mcp.ts` |

Identity is the platform's job, not this repo's. See [github.com/OxyHQ/oxy](https://github.com/OxyHQ/oxy).

## Getting started

```bash
bun install
bun run dev
```

`predev` generates the theme CSS and syncs docs and changelog content, then `dev` starts the Express server and Vite together. The Vite dev server proxies `/api` to the Express server on port 4000.

```bash
bun run build      # type check, bundle, index, prerender, pagefind, CSP headers
bun run lint
bun run preview    # serve the built output
bun run server     # Express only
```

<details>
<summary><b>Layout</b></summary>

<br>

```
src/
  api/          REST client and TanStack Query hooks
  components/   UI grouped by surface (homepage, faircoin, mention, pay, docs, ...)
  content/      MDX and synced content
  contexts/     React contexts
  data/         Static fallbacks used when the CMS has nothing
  hooks/        Domain hooks
  lib/          Pure helpers: host detection, FairCoin links, wagmi config, SEO
  pages/        One component per route in App.tsx
  stores/       Zustand stores for cross tree UI state
  styles/       Product themes plus the generated palette
  theme/        Brand seeds
  constants.ts  Positioning, founder, HQ, feature flags
server/         Express API, models, routes, services, MCP server
scripts/        Build time scripts: theme, docs and changelog sync, prerender, OG images, search index
```

</details>

<details>
<summary><b>Other scripts</b></summary>

<br>

```bash
bun run generate:theme            # regenerate src/styles/theme.generated.css from Bloom
bun run sync-docs                 # pull docs content into src/
bun run sync-changelog            # pull changelog content into src/
bun run prerender                 # prerender routes without a full rebuild
bun run build:help-og             # OG images for help articles
bun run build:faircoin-og         # OG images for FairCoin pages
bun run render:bloom-thumbnails   # component thumbnails
bun run optimize-media            # compress media in place
bun run analyze                   # bundle stats
bun run typecheck:server
bun run mcp                       # run the MCP server
bun run seed                      # seed the database
```

</details>

<details>
<summary><b>Feature flags</b></summary>

<br>

`src/constants.ts` exports a `FEATURES` object that hides sections still waiting on real content. Flip a flag to `true` once the section it gates has something true to show. The comments in that file say what each one covers.

</details>

## Conventions

- Oxy is not a CRM. Oxy CRM is one product in the ecosystem, and the parent brand is an open source ecosystem of AI agents and apps.
- Team, blog, changelog, job and testimonial content comes from the CMS through hooks such as `useTeamMembers`, `useNewsroomPosts` and `useJobs`. The static fallbacks under `src/data/` stay empty or generic.
- No hardcoded customer logos or testimonials. They stay behind `FEATURES.SHOW_TRUSTED_LOGOS` and `FEATURES.SHOW_TESTIMONIALS` until real, verified ones exist.
- Never hand write a palette. Change the seed, regenerate, and check the result in a browser with JavaScript blocked as well as with it on. Every page here is prerendered, so a token that only resolves after hydration is a token the visitor saw wrong first.
- The MCP auth token is passed as a request header, never as a query string parameter.
- New protected routes on the server use `createOxyAuthMiddleware` and `getRequiredOxyUserId` from `@oxyhq/core/server`. Do not add local auth middleware.

<br>

<div align="center">
<sub>Breathe License 1.0 · The Oxy Collective, Inc. · <a href="LICENSE">LICENSE</a> · <a href="https://oxy.so">oxy.so</a></sub>
</div>
