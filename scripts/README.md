# Docs site scripts

Source-of-truth for how the Oxy docs site is assembled.

## docs.config.json schema

Every documented repo carries a `docs.config.json` at its package root.
The website's `sync-docs.ts` reads each file, pulls the relevant MDX
content, and writes a unified `_synced/index.json` consumed by the SPA.

```jsonc
{
  // Required
  "package": "@oxyhq/services",           // npm name (used for tag resolution)
  "displayName": "@oxyhq/services",       // human-readable label
  "shortName": "services",                // URL slug — must be unique across the site
  "repo": "https://github.com/OxyHQ/OxyHQServices",
  "category": "sdk",                      // "sdk" | "app" | "service" | "ui-library"
  "versions": ["6.10.0", "6.9.45", "main"],
  "defaultVersion": "main",               // legacy default for non-versioned packages
  "docsPath": "docs/",

  // Optional
  "docsIgnore": ["internal-spec.mdx"],    // glob-style relative paths to skip
  "typedoc": { "entry": "src/index.ts" }, // TypeScript entry for TypeDoc API ref
  "storybook": { "entry": "..." },        // Storybook entry (stubbed)
  "description": "Expo / React Native SDK: components, screens, bottom-sheet navigation.",

  // Versioning (NEW)
  "versioned": true,                      // SDKs, libraries, REST APIs → true; end-user apps → false (or omit)
  "latestVersion": "6.10.0",              // override for `versions[0]` as the canonical/default
  "deprecatedVersions": ["6.8.0"]         // versions that show a "deprecated" banner
}
```

### Versioned vs non-versioned

| Field         | Versioned package                  | Non-versioned package           |
| ------------- | ---------------------------------- | ------------------------------- |
| `versioned`   | `true`                             | `false` (or omitted)            |
| When to use   | SDKs, libraries, REST APIs         | End-user apps (no API surface)  |
| Example       | `@oxyhq/services`, `@oxyhq/bloom`  | `@oxyhq/accounts`, `mention`    |
| URL shape     | `/developers/docs/<pkg>/<v>/<slug>`| `/developers/docs/<pkg>/<slug>` |
| Version selector shown? | Yes (when `>1` version)  | No                              |
| Version banner shown?   | Old & deprecated versions| No                              |
| Default redirect | `/developers/docs/<pkg>` → `<latest>` | No redirect — renders directly |

End-user apps version their *features* with the rest of the platform, but
their docs reflect "what the app does today". There's no `accounts@2.1`
vs `accounts@1.4` for a user to choose between — only one app is shipped.

### Examples

#### Versioned SDK (canonical pattern)

```jsonc
{
  "package": "@oxyhq/services",
  "displayName": "@oxyhq/services",
  "shortName": "services",
  "repo": "https://github.com/OxyHQ/OxyHQServices",
  "category": "sdk",
  "versions": ["6.10.0", "6.9.45", "main"],
  "defaultVersion": "main",
  "latestVersion": "6.10.0",
  "docsPath": "docs/",
  "typedoc": { "entry": "src/index.ts" },
  "versioned": true,
  "description": "Expo / React Native SDK: components, screens, bottom-sheet navigation."
}
```

#### Non-versioned end-user app

```jsonc
{
  "package": "@oxyhq/accounts",
  "displayName": "Accounts",
  "shortName": "accounts",
  "repo": "https://github.com/OxyHQ/OxyHQServices",
  "category": "app",
  "versions": ["main"],
  "defaultVersion": "main",
  "docsPath": "docs/",
  "description": "MyAccount app — identity, security, recovery, payment methods."
  // `versioned` omitted (defaults to false)
}
```

## Tag format

The convention for releasing versioned docs is:

```
@oxyhq/<package>@<version>     # for npm-scoped packages
<package>@<version>            # for non-scoped repos (e.g. mention, allo)
v<version>                     # fallback for older / non-conforming tags
```

`sync-docs.ts` resolves a version string to a real git tag by trying these
candidates in order. The first one that exists (`git rev-parse --verify
refs/tags/<candidate>`) wins. This matches the format already produced by
`npm version` in scoped packages and by Lerna's default conventional
release tagger, so most projects need no changes.

Examples:
- `@oxyhq/services` version `6.10.0` resolves to tag `@oxyhq/services@6.10.0`
- `mention` version `0.4.2` resolves to tag `mention@0.4.2` or `v0.4.2`
- `tnp` version `1.0.0` resolves to tag `tnp@1.0.0` or `v1.0.0`

If no candidate matches, the script logs a warning and falls back to the
working tree so the build still produces *something* for that version.

## How sync-docs resolves versions

`sync-docs.ts` walks every entry in `docs-registry.json`. For each
package:

1. **Working-tree versions (`'main'`, `'master'`, `'local'`)** — read MDX
   directly off the local checkout. Fastest path for dev iteration.
2. **Tag versions on a versioned package** — `resolveVersionTag()` finds
   the matching tag, then `git show <tag>:<path>` extracts each MDX file
   at that revision. The repo's working tree is never touched.
3. **Non-versioned package** — always read from the working tree. The
   first entry in `versions[]` (typically `'main'`) is the canonical
   content; additional entries are ignored as a configuration error.
4. **TypeDoc API reference** — if `typedoc.entry` is set, run TypeDoc
   against the resolved version's tree and emit markdown under `api/`.
5. **OpenAPI spec** — for `category: "service"` packages, copy
   `openapi.json` next to the synced MDX so the Scalar viewer can `import`
   it.

Each synced package is emitted to `src/content/_synced/<shortName>/<version>/`
(or `.../main/` for non-versioned packages — the version dir is still
created but the SPA never includes it in URLs).

## Output index

The script writes `src/content/_synced/index.json` with this shape:

```ts
interface SyncedIndex {
  generatedAt: string;
  packages: SyncedPackage[];
}

interface SyncedPackage {
  package: string;            // npm name
  displayName: string;
  shortName: string;          // URL slug
  repo: string;
  category: 'sdk' | 'app' | 'service' | 'ui-library';
  description?: string;
  defaultVersion: string;     // legacy
  versions: SyncedVersion[];
  versioned: boolean;         // NEW: drives routing + selector visibility
  latestVersion: string;      // NEW: canonical version
  deprecatedVersions: string[]; // NEW: shows red banner
}
```

The SPA reads `index.json` at module init and uses it to drive routing,
sidebar navigation, version selectors, and SEO canonicals.

## Scripts

- `sync-docs.ts` — main sync. Run via `bun run prebuild` or `bun run sync-docs`.
- `build-docs-search-index.ts` — emits per-page HTML stubs under
  `dist/docs-content/` for Pagefind to crawl. Run via `bun run postbuild`.
- `run-pagefind.ts` — invokes `pagefind --site dist` only when there's
  something to index. Run via `bun run postbuild`.
- `types.ts` — TypeScript types for `docs.config.json`, the synced index,
  and the registry. Shared between scripts and SPA components.
