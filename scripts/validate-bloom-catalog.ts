#!/usr/bin/env bun

/**
 * Fails the build when the generated Bloom catalog no longer describes the
 * installed `@oxy.so/bloom`.
 *
 * ## What it measures
 *
 * It rebuilds the catalog into memory and compares it to what is committed —
 * the index AND every per-surface prop module, plus the file set itself. That
 * one comparison carries every guarantee the generator enforces, because a
 * rebuild runs them all: a subpath Bloom's README no longer categorises, a
 * `types` path that stopped resolving, a component table that stopped parsing,
 * a prop left out with nothing to attribute it to, and either vacuity floor all
 * throw out of the rebuild and are reported here with the sentence that names
 * the cause. Nothing is re-implemented — a check that re-implements the code
 * under test measures the re-implementation.
 *
 * The file SET matters as much as the contents. A prop module for a surface
 * Bloom has dropped still type-checks and still ships; one that was never
 * written makes `loadBloomSurfaceProps` throw at runtime, on a page nobody
 * opened before the deploy. Neither shows up in a content comparison of the
 * files that do exist.
 *
 * ## Why a gate rather than a convention
 *
 * The generated files are committed so a plain `vite build` is never left
 * without a catalog, which means they can go stale in exactly one silent way:
 * somebody bumps Bloom and does not re-run the generator. Nothing breaks. The
 * docs keep rendering, from the previous version's component list — which is
 * the failure the catalog was built to end, wearing a different hat.
 *
 * Mutation-tested by `test-validate-bloom-catalog.ts`; `bun run
 * validate:bloom-catalog` runs both.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  buildBloomCatalog,
  listPropModules,
  CATALOG_PATH,
  PROPS_DIR,
  type BuildOptions,
  type BuildResult,
} from './generate-bloom-catalog'
import {
  bloomComponentRoutes,
  bloomComponentUrl,
  BLOOM_COMPONENTS_BASE,
  type BloomComponentRoute,
} from './bloom-component-routes'
import { bloomIndex } from '../src/content/bloom-catalog.generated'
import type { BloomSurfaceEntry } from '../src/content/bloom-catalog'

const PRERENDER_PATH = join(import.meta.dir, 'prerender.ts')

/**
 * The statement in `prerender.ts` that walks the catalog, anchored on the call
 * rather than the name. The name appears in that file's comments too, and a
 * census over source that counts comments measures the prose, not the code.
 */
const PRERENDER_CALL = /^\s*for \(const \{ url, seo \} of bloomComponentRoutes\(\)\)/m

/**
 * Every surface must reach a prerendered route.
 *
 * Before this, all 87 component pages and their hub shipped with no `<head>`
 * and no sitemap row — Cloudflare's SPA fallback serves them to a human, so
 * nothing looked broken, and they simply did not exist for a crawler.
 *
 * Both halves are needed and neither subsumes the other. The coverage check
 * would be vacuous on its own if the routes were trivially the index, but the
 * derivation is a loop that can grow a filter — the obvious one being to skip
 * the utility groups the way the hub does, which would silently drop twelve
 * pages. The wiring check catches the case coverage cannot see at all: routes
 * derived correctly and then never handed to the prerender.
 */
export function checkPrerender(
  index: readonly BloomSurfaceEntry[],
  routes: readonly BloomComponentRoute[],
  prerenderSource: string,
): string[] {
  const failures: string[] = []
  const urls = new Set(routes.map((route) => route.url))

  if (!urls.has(BLOOM_COMPONENTS_BASE)) {
    failures.push(
      `The Bloom component hub ${BLOOM_COMPONENTS_BASE} has no prerender route.\n`
      + '    It ships with no title, no description and no sitemap row.',
    )
  }

  const missing = index.filter((entry) => !urls.has(bloomComponentUrl(entry.subpath)))
  if (missing.length > 0) {
    failures.push(
      `${missing.length} Bloom surface(s) have no prerender route:\n`
      + missing.map((entry) => `    - ${entry.subpath}`).join('\n')
      + '\n    A page with no prerendered head renders for a human and does not exist for a'
      + '\n    crawler. Routes come from bloomIndex so this cannot happen by omission —'
      + '\n    check what filtered them out.',
    )
  }

  const known = new Set<string>([
    BLOOM_COMPONENTS_BASE,
    ...index.map((entry) => bloomComponentUrl(entry.subpath)),
  ])
  const stale = routes.filter((route) => !known.has(route.url))
  if (stale.length > 0) {
    failures.push(
      `${stale.length} prerender route(s) point at a surface Bloom no longer publishes:\n`
      + stale.map((route) => `    - ${route.url}`).join('\n'),
    )
  }

  if (!PRERENDER_CALL.test(prerenderSource)) {
    failures.push(
      'prerender.ts no longer walks the Bloom catalog.\n'
      + '    Every route above is derived correctly and handed to nobody, which is'
      + '\n    indistinguishable from the six-source version this fixed.',
    )
  }

  return failures
}

export interface ValidateOptions extends BuildOptions {
  /** The committed index to check. Defaults to the repository's. */
  index?: string
  /** The committed prop-module directory to check. Defaults to the repository's. */
  propsDir?: string
}

export interface ValidateResult {
  failures: string[]
  /** The rebuilt catalog, or `null` when the rebuild itself failed. */
  built: BuildResult | null
}

/** The first line at which two files disagree, or `null` if they do not. */
function firstDifference(
  committed: string,
  rebuilt: string,
): { line: number; committed: string; rebuilt: string } | null {
  const left = committed.split('\n')
  const right = rebuilt.split('\n')
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    if (left[index] !== right[index]) {
      return {
        line: index + 1,
        committed: left[index] ?? '(end of file)',
        rebuilt: right[index] ?? '(end of file)',
      }
    }
  }
  return null
}

const REGENERATE = 'Run `bun run generate:bloom-catalog` and commit the result.'

function compare(path: string, rebuilt: string): string | null {
  if (!existsSync(path)) return `${path} does not exist.\n    ${REGENERATE}`
  const difference = firstDifference(readFileSync(path, 'utf8'), rebuilt)
  if (!difference) return null
  return `${path} is stale — it does not match a rebuild from the installed @oxy.so/bloom.\n`
    + `    First difference at line ${difference.line}:\n`
    + `      committed: ${difference.committed.slice(0, 160)}\n`
    + `      rebuilt:   ${difference.rebuilt.slice(0, 160)}\n`
    + `    ${REGENERATE}`
}

export function validateBloomCatalog(options: ValidateOptions = {}): ValidateResult {
  const index = options.index ?? CATALOG_PATH
  const propsDir = options.propsDir ?? PROPS_DIR

  let built: BuildResult
  try {
    built = buildBloomCatalog(options)
  } catch (error) {
    return { failures: [error instanceof Error ? error.message : String(error)], built: null }
  }

  const failures: string[] = []

  // Read back as its own assertion rather than left to the content comparison.
  // A version drift does show up as a stale index, but it shows up as a diff on
  // a header comment line, which reads like nothing. This says what happened.
  if (existsSync(index)) {
    const committedVersion = readFileSync(index, 'utf8').match(/^export const bloomVersion = '([^']*)'$/m)?.[1]
    if (committedVersion !== built.version) {
      failures.push(
        `${index} documents @oxy.so/bloom ${committedVersion ?? '(no bloomVersion export)'}, `
        + `but the installed package is ${built.version}.\n    ${REGENERATE}`,
      )
    }
  }

  const indexFailure = compare(index, built.index)
  if (indexFailure) failures.push(indexFailure)

  // The file set, before any content. An extra module is a surface Bloom
  // dropped; a missing one is a page that throws the first time it is opened.
  const onDisk = listPropModules(propsDir)
  const expected = [...built.modules.keys()].sort()
  const extra = onDisk.filter((relative) => !built.modules.has(relative))
  const missing = expected.filter((relative) => !onDisk.includes(relative))
  if (extra.length > 0 || missing.length > 0) {
    failures.push(
      `${propsDir} does not hold one module per surface.\n`
      + (missing.length > 0 ? `    missing: ${missing.join(', ')}\n` : '')
      + (extra.length > 0 ? `    left over from a surface Bloom no longer publishes: ${extra.join(', ')}\n` : '')
      + `    ${REGENERATE}`,
    )
  }

  // Repo-level, so it runs for the repository's own files and not for a fixture
  // pointed at a temp directory. `test-validate-bloom-catalog.ts` drives
  // `checkPrerender` directly, with inputs a fixture cannot express.
  if (options.index === undefined && existsSync(PRERENDER_PATH)) {
    failures.push(...checkPrerender(
      bloomIndex,
      bloomComponentRoutes(),
      readFileSync(PRERENDER_PATH, 'utf8'),
    ))
  }

  for (const relative of expected) {
    if (missing.includes(relative)) continue
    const failure = compare(join(propsDir, relative), built.modules.get(relative) as string)
    if (failure) {
      failures.push(failure)
      break // one stale module is the whole verdict; the rest would repeat it
    }
  }

  return { failures, built }
}

if (import.meta.main) {
  const { failures, built } = validateBloomCatalog()

  if (failures.length > 0) {
    console.error('Bloom catalog check FAILED:\n')
    for (const failure of failures) console.error(`  - ${failure}\n`)
    process.exit(1)
  }

  const { stats, drift } = built as BuildResult
  console.log(
    `Bloom catalog check passed (${stats.surfaces} surfaces, ${stats.components} components, `
    + `${stats.propTypes} distinct props types carrying ${stats.props} props, `
    + `${stats.inheritedProps} inherited and named rather than listed).`,
  )
  for (const line of drift) console.warn(`  upstream drift: ${line}`)
}
