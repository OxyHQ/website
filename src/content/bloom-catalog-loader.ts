import type { BloomSurfaceProps } from './bloom-catalog'

/**
 * Browser-side access to the generated per-surface prop modules.
 *
 * This is a separate module from `bloom-catalog.generated.ts` for one measured
 * reason: `import.meta.glob` is a Vite transform and does not exist under Bun,
 * so a module that calls it cannot be imported by a build script at all —
 * `TypeError: import.meta.glob is not a function`, thrown while the module
 * evaluates, before any export is reachable. The index has to be readable from
 * `scripts/`, because that is where the prerender derives a route per surface,
 * so the glob lives here and the index stays pure data.
 *
 * Hand-written rather than generated: nothing in it varies with the catalog.
 */
const propModules = import.meta.glob<{ props: BloomSurfaceProps }>(
  './bloom-catalog-props/**/*.ts',
)

/**
 * One surface's props, fetched on demand. Vite code-splits every module the
 * glob above matches, so a component page downloads its own and nothing else.
 *
 * Throws rather than resolving empty when the module is missing: the glob reads
 * the filesystem at build time, so a catalog generated without its prop modules
 * would otherwise render every component as having no props at all, with no
 * error anywhere — which is the exact silence this catalog exists to end.
 */
export async function loadBloomSurfaceProps(subpath: string): Promise<BloomSurfaceProps> {
  const load = propModules[`./bloom-catalog-props/${subpath}.ts`]
  if (!load) {
    throw new Error(
      `No generated prop module for @oxyhq/bloom/${subpath}. Run \`bun run generate:bloom-catalog\`.`,
    )
  }
  return (await load()).props
}
