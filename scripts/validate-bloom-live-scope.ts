#!/usr/bin/env bun

/**
 * Fails the build when the committed playground scope no longer matches the
 * demos it is derived from.
 *
 * ## What it measures
 *
 * It rebuilds the scope into memory and compares it to what is committed.
 * Nothing is re-implemented — a check that re-implements the code under test
 * measures the re-implementation — so every rule the generator enforces is
 * carried here by the rebuild: a relative value import, colliding identifiers
 * and either vacuity floor all throw out of it and are reported with the
 * sentence that names the cause.
 *
 * ## Why a gate rather than a convention
 *
 * The generated module is committed so a plain `vite build` is never left
 * without a scope, which leaves exactly one silent way for it to go wrong:
 * somebody adds a demo importing a Bloom surface the scope lacks and does not
 * re-run the generator. Nothing breaks. The build is green, the page loads, the
 * component grid is unchanged — and that one demo's snippet fails to compile
 * the first time a reader picks it, with an error naming a surface Bloom
 * plainly publishes.
 *
 * Mutation-tested by `test-validate-bloom-live-scope.ts`; `bun run
 * validate:bloom-live-scope` runs both.
 */

import { existsSync, readFileSync } from 'node:fs'

import {
  buildBloomLiveScope,
  SCOPE_PATH,
  type BuildOptions,
  type BuildResult,
} from './generate-bloom-live-scope'

export interface ValidateOptions extends BuildOptions {
  /** The committed module to check. Defaults to the repository's. */
  scopePath?: string
}

export interface ValidateResult {
  failures: string[]
  /** The rebuilt scope, or `null` when the rebuild itself failed. */
  built: BuildResult | null
}

const REGENERATE = 'Run `bun run generate:bloom-live-scope` and commit the result.'

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

export function validateBloomLiveScope(options: ValidateOptions = {}): ValidateResult {
  const scopePath = options.scopePath ?? SCOPE_PATH

  let built: BuildResult
  try {
    built = buildBloomLiveScope(options)
  } catch (error) {
    return { failures: [error instanceof Error ? error.message : String(error)], built: null }
  }

  if (!existsSync(scopePath)) {
    return { failures: [`${scopePath} does not exist.\n    ${REGENERATE}`], built }
  }

  const difference = firstDifference(readFileSync(scopePath, 'utf8'), built.scope)
  if (!difference) return { failures: [], built }

  return {
    failures: [
      `${scopePath} is stale — it does not match a rebuild from the demos.\n`
      + `    First difference at line ${difference.line}:\n`
      + `      committed: ${difference.committed.slice(0, 160)}\n`
      + `      rebuilt:   ${difference.rebuilt.slice(0, 160)}\n`
      + `    ${REGENERATE}`,
    ],
    built,
  }
}

if (import.meta.main) {
  const { failures, built } = validateBloomLiveScope()

  if (failures.length > 0) {
    console.error('Bloom playground scope check FAILED:\n')
    for (const failure of failures) console.error(`  - ${failure}\n`)
    process.exit(1)
  }

  const { stats } = built as BuildResult
  console.log(
    `Bloom playground scope check passed (${stats.specifiers} modules from ${stats.demos} demos).`,
  )
}
