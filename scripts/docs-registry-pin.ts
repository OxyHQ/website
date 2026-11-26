import type { DocsConfig, DocsRegistryEntry } from './types.ts';

/**
 * The config a registry entry publishes, with what the entry pins applied.
 *
 * - A versioned package whose entry pins one of the package's own release
 *   tags (`@oxy.so/bloom@23.9.1`) documents that release, the one the site
 *   runs. The config is read at that tag, and a config written before the
 *   release names an older version as its latest (Bloom's said 9.0.0 through
 *   Bloom 23), so the pinned version is listed first and made the latest.
 * - The entry's `docsIgnore` adds to the config's, for pages a later config
 *   leaves out (Bloom 23.9.1's tree carries the language guides, which the
 *   language's own docs package publishes).
 */
export function applyRegistryPin(entry: DocsRegistryEntry, config: DocsConfig): DocsConfig {
  const docsIgnore = [...(config.docsIgnore ?? []), ...(entry.docsIgnore ?? [])];
  const withIgnore = entry.docsIgnore?.length ? { ...config, docsIgnore } : config;
  const prefix = `${config.package}@`;
  if (!config.versioned || !entry.ref?.startsWith(prefix)) return withIgnore;
  const version = entry.ref.slice(prefix.length);
  if (!/^\d+\.\d+\.\d+$/.test(version)) return withIgnore;
  const versions = config.versions ?? [];
  return {
    ...withIgnore,
    versions: versions.includes(version) ? versions : [version, ...versions],
    latestVersion: version,
    defaultVersion: version,
  };
}
