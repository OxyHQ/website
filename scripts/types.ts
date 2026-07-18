/**
 * Schema for a repo-level `docs.config.json`. Each open-source Oxy repo
 * carries one of these at its root. The website's sync-docs script reads
 * the global registry, pulls each config, and assembles the docs site.
 */

export type DocsCategory = 'sdk' | 'app' | 'service' | 'ui-library';

export interface DocsConfig {
  /** npm name, e.g. "@oxyhq/bloom". */
  package: string;
  /** Human-friendly name, e.g. "Bloom". */
  displayName: string;
  /** URL slug, e.g. "bloom". Must be unique across the docs site. */
  shortName: string;
  /** GitHub URL of the source repo. */
  repo: string;
  /** Category bucket on the docs hub page. */
  category: DocsCategory;
  /**
   * Available versions, newest first. Use `'main'` for the working tree.
   * Tag-based versions are pulled via `git show`; `'main'` reads files
   * straight from disk (used for fast dev iteration).
   *
   * Required when `versioned: true`. Non-versioned packages may omit this
   * (the sync script falls back to `[defaultVersion ?? 'main']`).
   */
  versions?: string[];
  /**
   * The version that responds at `/docs/<shortName>` (no version segment)
   * for non-versioned packages. Versioned packages use `latestVersion`
   * instead. Defaults to `'main'` when both are missing.
   */
  defaultVersion?: string;
  /** Path within the repo where MDX/MD content lives, e.g. "docs/". */
  docsPath: string;
  /**
   * Optional: glob-style relative paths (under `docsPath`) to skip during
   * sync. Used to keep dev-only material (e.g. internal specs) out of the
   * public docs site.
   */
  docsIgnore?: string[];
  /** Optional: TypeScript entry to feed to TypeDoc for API ref extraction. */
  typedoc?: { entry: string };
  /** Optional: Storybook entry for live component examples. */
  storybook?: { entry: string };
  /** Optional short blurb shown on the docs hub card. */
  description?: string;
  /**
   * Whether this package ships versioned docs. SDKs, libraries, and REST
   * APIs should set `true` so consumers can browse historical releases.
   * End-user apps (Mention, Inbox, Console, Allo, etc.) leave this `false`
   * — there is only one "current" app, so a version segment in the URL
   * would just add noise.
   *
   * When `true`, the route resolves at
   * `/developers/docs/<shortName>/<version>/<slug>` and a version selector
   * is shown. When `false` (or omitted) the route is flat:
   * `/developers/docs/<shortName>/<slug>`.
   */
  versioned?: boolean;
  /**
   * Optional: override for the version that responds at
   * `/developers/docs/<shortName>` (no version segment) on versioned
   * packages. Defaults to `versions[0]` — i.e. the first entry in the
   * ordered list. Only meaningful when `versioned: true`.
   */
  latestVersion?: string;
  /**
   * Optional: versions that should render the "deprecated" banner pointing
   * readers at the latest version. Use for major releases the team no
   * longer supports. Only meaningful when `versioned: true`.
   */
  deprecatedVersions?: string[];
  /**
   * Optional free-form note about the version history — e.g. "Versions
   * 1.6.2-1.6.5 were published from local commits not preserved in git
   * history. See npm for changelogs." Surfaced verbatim in the version
   * selector tooltip.
   */
  versionsNote?: string;
}

/**
 * Website-local registry of repos to sync. Lives at
 * `website/docs-registry.json`. Maps each repo to its absolute path on this
 * machine. Production builds may later swap this for a tag-based fetcher.
 */
export interface DocsRegistry {
  repos: DocsRegistryEntry[];
}

export interface DocsRegistryEntry {
  /** Display label used in logs. Should match `displayName` from the config. */
  name: string;
  /**
   * Optional: absolute or website-relative path to the repo root on the dev
   * machine. Used when present and existent for fast local iteration.
   * If absent (or the path does not resolve), the entry falls back to `git`.
   */
  localPath?: string;
  /**
   * Optional: HTTPS git URL used as a fallback (or sole source in CI) when
   * `localPath` is missing. Shallow-cloned into
   * `node_modules/.docs-cache/<name>/`.
   */
  git?: string;
  /**
   * Optional: branch or tag to check out when cloning via `git`. Defaults to
   * `'main'`.
   */
  ref?: string;
  /**
   * Optional: when the repo is a monorepo, the path *within* the repo where
   * `docs.config.json` files live. If unset, defaults to the repo root.
   * Multiple paths allow one repo to host many configs (e.g. OxyHQServices
   * hosts a config per `packages/<name>`).
   */
  configPaths?: string[];
  /**
   * Optional: when true and `localPath` is missing on this machine (and no
   * `git` fallback is set), the sync-docs script logs a notice and skips the
   * entry instead of failing. Used for repos that are not yet on GitHub
   * (e.g. private design assets like OxyFont) so CI builds stay green.
   */
  skipIfNoLocal?: boolean;
}

/** Output of `sync-docs.ts`. Written to `_synced/index.json`. */
export interface SyncedIndex {
  generatedAt: string;
  packages: SyncedPackage[];
}

export interface SyncedPackage {
  package: string;
  displayName: string;
  shortName: string;
  repo: string;
  category: DocsCategory;
  description?: string;
  /**
   * Verbatim copy of `DocsConfig.defaultVersion`, so it is absent whenever the
   * package's `docs.config.json` omits it. Prefer `latestVersion` — that is the
   * already-resolved field, with the `defaultVersion` → `'main'` fallback
   * applied.
   */
  defaultVersion?: string;
  versions: SyncedVersion[];
  /**
   * `true` if the package ships versioned docs. Mirrors `DocsConfig.versioned`.
   * Used by the SPA to pick between versioned and flat routes, and by the
   * `VersionSelector` to decide whether to render the dropdown at all.
   */
  versioned: boolean;
  /**
   * Resolved "latest" version slug — either `DocsConfig.latestVersion` when
   * set, or `versions[0].version` otherwise. Used as the canonical version
   * and as the default redirect target for `/developers/docs/<shortName>`.
   * For non-versioned packages this is the lone version (typically `'main'`).
   */
  latestVersion: string;
  /**
   * Versions that should render the "deprecated" banner. Mirrors
   * `DocsConfig.deprecatedVersions`; empty array when none configured.
   */
  deprecatedVersions: string[];
}

export interface SyncedVersion {
  version: string;
  /** Tree of MDX files relative to the synced output directory. */
  pages: SyncedPage[];
}

export interface SyncedPage {
  /** Slug relative to the package root, e.g. `''` (index), `'dialog'`, `'theme/colors'`. */
  slug: string;
  /** Display title, parsed from front-matter or `# H1`. */
  title: string;
  /** Optional summary parsed from front-matter `description`. */
  description?: string;
  /** Relative path from `src/content/_synced/` to the MDX file. */
  file: string;
  /** Order hint parsed from front-matter `order`, falls back to filename sort. */
  order: number;
  /**
   * Optional sidebar section the page belongs to. Hand-written pages get
   * `'guides'` (the default); auto-generated TypeDoc pages get `'api'`.
   * The sidebar renders each section under a heading.
   */
  section?: 'guides' | 'api';
}
