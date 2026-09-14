#!/usr/bin/env bun
/**
 * Refresh `src/data/ai/catalog-snapshot.json` from the Oxy control plane.
 *
 * Runs in `prebuild`. The snapshot it writes is bundled into the app and is what
 * every catalogue surface renders on its first pass, before the live refresh
 * answers — so the models and prices a visitor sees first are a known-good set
 * from build time rather than a loading state.
 *
 * The rules this script exists to enforce, in the order they bite:
 *
 *  1. **No endpoint means no change.** `OXY_PUBLIC_CATALOG_URL` is unset until
 *     the control plane publishes one (OxyHQ/oxy#972). The committed snapshot
 *     stands, and the build carries on — a public static build must never
 *     require a production secret or a reachable private service.
 *  2. **A failure means no change.** A timeout, a 500, a malformed payload or an
 *     unknown `schemaVersion` all leave the last-known-good snapshot in place.
 *     Replacing it with an empty one publishes "Oxy has no models" as a product
 *     fact, signed by an HTTP error.
 *  3. **Internal-only never lands.** `toCustomerSafeCatalog` strips it at the
 *     schema boundary and `assertNoInternalLeakage` refuses to write a file that
 *     still carries a secret, an internal cost or an internal-only object.
 *
 * Exit code is 0 in every one of those cases EXCEPT a leak, which fails the
 * build: shipping a snapshot with a wholesale cost in it is not something to
 * warn about and continue past.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  CATALOG_SCHEMA_VERSION,
  assertNoInternalLeakage,
  parsePublicCatalog,
  toCustomerSafeCatalog,
  type PublicCatalog,
} from '../src/lib/ai/catalog'

const ROOT = path.resolve(import.meta.dir, '..')
const SNAPSHOT_PATH = path.join(ROOT, 'src', 'data', 'ai', 'catalog-snapshot.json')

/** How long to wait before deciding the control plane is not answering. */
const FETCH_TIMEOUT_MS = 15_000

async function readCommittedSnapshot(): Promise<PublicCatalog> {
  const raw = await readFile(SNAPSHOT_PATH, 'utf8')
  return parsePublicCatalog(JSON.parse(raw))
}

async function fetchUpstream(url: string): Promise<PublicCatalog> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new Error('timed out')), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return parsePublicCatalog(await response.json())
  } finally {
    clearTimeout(timeout)
  }
}

async function main(): Promise<void> {
  // Parse the committed file first, whatever else happens. A snapshot that has
  // been hand-edited into an invalid shape is a build-breaking mistake, and the
  // build should say so here rather than at module-import time in the prerender.
  const committed = await readCommittedSnapshot()
  assertNoInternalLeakage(committed)

  const url = process.env.OXY_PUBLIC_CATALOG_URL
  if (!url) {
    console.log(
      `[ai-catalog] OXY_PUBLIC_CATALOG_URL unset — keeping the committed snapshot ` +
        `(${committed.entries.length} entries, source "${committed.source}")`,
    )
    return
  }

  let upstream: PublicCatalog
  try {
    upstream = await fetchUpstream(url)
  } catch (error) {
    console.warn(
      `[ai-catalog] upstream unavailable (${error instanceof Error ? error.message : 'unknown'}) ` +
        `— keeping the committed snapshot (${committed.entries.length} entries)`,
    )
    return
  }

  const safe = toCustomerSafeCatalog(upstream)

  // A 200 with nothing in it is indistinguishable from a half-deployed upstream.
  // Emptying a catalogue that has models in it is a deliberate act, and it takes
  // a committed snapshot rather than a build-time fetch.
  if (safe.entries.length === 0 && committed.entries.length > 0) {
    console.warn('[ai-catalog] upstream returned an empty catalogue — keeping the committed snapshot')
    return
  }

  // The belt to the schema's braces. If this throws, the build fails.
  assertNoInternalLeakage(safe)

  await writeFile(SNAPSHOT_PATH, `${JSON.stringify(safe, null, 2)}\n`, 'utf8')
  console.log(
    `[ai-catalog] wrote ${safe.entries.length} entries, ` +
      `${safe.deployments.length} deployments, price version "${safe.priceVersion}" ` +
      `(schema ${CATALOG_SCHEMA_VERSION})`,
  )
}

await main()
