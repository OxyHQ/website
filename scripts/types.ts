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
   */
  versions: string[];
  /** The version that responds at `/docs/<shortName>` (no version segment). */
  defaultVersion: string;
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
  /** Absolute path to the repo root on the dev machine. */
  localPath: string;
  /**
   * Optional: when the repo is a monorepo, the path *within* the repo where
   * `docs.config.json` files live. If unset, defaults to the repo root.
   * Multiple paths allow one repo to host many configs (e.g. OxyHQServices
   * hosts a config per `packages/<name>`).
   */
  configPaths?: string[];
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
  defaultVersion: string;
  versions: SyncedVersion[];
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
}
