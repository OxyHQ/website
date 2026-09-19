#!/usr/bin/env bun
/**
 * Nothing internal-only, and no secret, may reach `dist/`.
 *
 * `toCustomerSafeCatalog` filters at the schema boundary and
 * `assertNoInternalLeakage` guards the snapshot file. This is the third check,
 * and the only one that looks at the artifact that actually gets uploaded:
 * prerendered HTML, the sitemap, the Pagefind index and the JS chunks that carry
 * the snapshot inlined by Vite.
 *
 * It exists because the first two checks guard the path the data is SUPPOSED to
 * take. A developer who imports the raw JSON somewhere, or a future field that
 * carries something it should not, does not go through either of them — but
 * everything ends up here.
 *
 * Runs in `postbuild`, against the directory about to be deployed.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { RETIRED_MODEL_ALIASES } from '../src/data/ai/taxonomy'

const ROOT = path.resolve(import.meta.dir, '..')
const DIST = path.join(ROOT, 'dist')

/**
 * Strings that must not appear anywhere in the built site.
 *
 * The availability and commercial markers are the load-bearing ones: an
 * `internal_only` object in a prerendered page means the filter was bypassed.
 * The cost fields are there because a leak of one would be a commercial
 * incident rather than a bug report.
 */
const FORBIDDEN_SUBSTRINGS: ReadonlyArray<{ needle: string; why: string }> = [
  { needle: '"availability":"internal_only"', why: 'internal-only catalogue object' },
  { needle: '"availability": "internal_only"', why: 'internal-only catalogue object' },
  { needle: '"commercial":"internal_only"', why: 'internal-only commercial state' },
  { needle: '"commercial": "internal_only"', why: 'internal-only commercial state' },
  { needle: '"wholesaleCost"', why: 'wholesale cost' },
  { needle: '"wholesale_cost"', why: 'wholesale cost' },
  { needle: '"internalRouteId"', why: 'internal route id' },
  { needle: '"upstreamKey"', why: 'upstream credential' },
]

/** Text-ish files. A PNG cannot carry a catalogue object in a form that matters. */
const TEXT_EXTENSIONS = ['.html', '.js', '.mjs', '.json', '.xml', '.txt', '.css']

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(abs)
    } else if (TEXT_EXTENSIONS.some((extension) => entry.name.endsWith(extension))) {
      yield abs
    }
  }
}

function main(): void {
  if (!existsSync(DIST)) {
    throw new Error('[ai-dist-guard] dist missing — run the build first')
  }

  const findings: string[] = []
  let scanned = 0

  for (const file of walk(DIST)) {
    // Skip anything implausibly large to hold catalogue JSON; the source maps
    // are the only files in that class and they are not deployed content.
    if (statSync(file).size > 20_000_000) continue
    const contents = readFileSync(file, 'utf8')
    scanned += 1
    const relative = path.relative(ROOT, file)

    for (const { needle, why } of FORBIDDEN_SUBSTRINGS) {
      if (contents.includes(needle)) findings.push(`${relative}: ${why} (${needle})`)
    }

    /**
     * The retired Alia aliases. These were routing aliases, never models, and
     * the epic's whole first invariant is that they are not advertised as Alia's
     * own. A prerendered page that names one is the regression.
     *
     * Only `.html` is checked: the aliases are also listed in
     * `src/data/ai/taxonomy.ts` precisely so this check knows what they are, and
     * that constant is legitimately bundled into the JS.
     */
    if (file.endsWith('.html')) {
      for (const alias of RETIRED_MODEL_ALIASES) {
        if (contents.includes(alias)) {
          findings.push(`${relative}: retired model alias "${alias}" in prerendered HTML`)
        }
      }
    }
  }

  if (findings.length > 0) {
    throw new Error(
      `[ai-dist-guard] ${findings.length} finding(s) in the build artifact:\n` +
        findings.map((finding) => `  ${finding}`).join('\n'),
    )
  }

  console.log(`[ai-dist-guard] ok — ${scanned} files scanned, nothing internal-only in dist`)
}

main()
