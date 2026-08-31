#!/usr/bin/env bun

/**
 * Mutation-tests `validate-bloom-live-scope.ts`.
 *
 * This gate exists because its failure is silent. A demo that imports a Bloom
 * surface the scope lacks builds green, renders the whole site unchanged, and
 * breaks one thing: that demo's snippet, in the browser, the first time a
 * reader picks it from the playground's dropdown. Nothing in CI opens that
 * page. So a check that has only ever been seen to pass is indistinguishable
 * from one that cannot fail, and each case below breaks exactly one thing and
 * requires the gate to fail with the words that name the right rule.
 *
 * The cases that must PASS carry as much weight. A gate that fired on a
 * type-only import would put surfaces into the entry-preloaded `vendor-oxy`
 * chunk for types Sucrase erases — the exact cost the derived scope exists to
 * avoid — and a gate that fired on a side-effect import would refuse a
 * legitimate one. Each is the only input that tells the real rule from a
 * plausible wrong one.
 *
 * Fixtures are real directories of real `.tsx` files, so the generator's actual
 * TypeScript parse runs rather than a stand-in for it.
 */

import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { buildBloomLiveScope, writeBloomLiveScope } from './generate-bloom-live-scope'
import { validateBloomLiveScope } from './validate-bloom-live-scope'

/** Relaxed so a two-demo fixture does not fail for a reason unrelated to its case. */
const FIXTURE_FLOORS = { demos: 1, specifiers: 1 }

type Files = Record<string, string>

const BUTTON_DEMO = `import { Button } from '@oxyhq/bloom/button'
import type { ButtonSize } from '@oxyhq/bloom/button'
import { useState } from 'react'

export default function ButtonDemo() {
  const [n] = useState(0)
  const size = 'medium' as ButtonSize
  return <Button size={size}>{n}</Button>
}
`

const CARD_DEMO = `import { Card } from '@oxyhq/bloom/card'

export default function CardDemo() {
  return <Card />
}
`

const BASE: Files = { 'Button.tsx': BUTTON_DEMO, 'Card.tsx': CARD_DEMO }

async function writeFiles(root: string, files: Files): Promise<void> {
  for (const [path, contents] of Object.entries(files)) {
    const full = join(root, path)
    await mkdir(dirname(full), { recursive: true })
    await writeFile(full, contents)
  }
}

function report(name: string, detail: string | null): number {
  if (detail === null) {
    console.log(`ok   ${name}`)
    return 0
  }
  console.error(`FAIL ${name}: ${detail}`)
  return 1
}

/**
 * Builds a fixture, generates its scope, applies a mutation, and hands back the
 * gate's verdict. The generate step is what makes each case a MUTATION: the
 * committed file starts correct, so a failure afterwards can only come from the
 * one thing the case changed.
 */
async function verdict(
  files: Files,
  mutate?: (dir: string, scopePath: string) => Promise<void> | void,
): Promise<{ failures: string[]; specifiers: string[] }> {
  const dir = await mkdtemp(join(tmpdir(), 'bloom-live-scope-'))
  try {
    await writeFiles(dir, files)
    const scopePath = join(dir, 'BloomLiveScope.generated.ts')
    const options = { demosDir: dir, floors: FIXTURE_FLOORS, scopePath }
    try {
      writeBloomLiveScope(buildBloomLiveScope(options), scopePath)
    } catch {
      // Swallowed on purpose. A fixture whose generate throws is a case about a
      // rule the gate carries through its own rebuild, so the verdict below has
      // to come from the GATE — reporting the setup's error here would make the
      // case pass while measuring something CI never runs.
    }
    await mutate?.(dir, scopePath)
    const result = validateBloomLiveScope(options)
    return { failures: result.failures, specifiers: result.built?.specifiers ?? [] }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

const mentions = (failures: string[], text: string): boolean =>
  failures.some((failure) => failure.includes(text))

let failed = 0

// ---------------------------------------------------------- must PASS -----

{
  const { failures, specifiers } = await verdict(BASE)
  failed += report(
    'a freshly generated scope is current',
    failures.length === 0 ? null : failures.join('\n'),
  )
  // The positive control for every "must fail" case below: without this, a
  // gate that failed on everything would look like a working gate.
  failed += report(
    'the derivation finds the value imports it should',
    specifiers.includes('@oxyhq/bloom/button') &&
      specifiers.includes('@oxyhq/bloom/card') &&
      specifiers.includes('react')
      ? null
      : `expected button, card and react; got ${specifiers.join(', ')}`,
  )
  failed += report(
    "the JSX runtime is in the scope though no demo names it",
    specifiers.includes('react/jsx-runtime')
      ? null
      : 'react/jsx-runtime is missing — every snippet would fail to compile at once',
  )
}

{
  // `import type` and a per-specifier `type` modifier are both erased by
  // Sucrase. A scope that carried them would pull surfaces into the
  // entry-preloaded chunk for types that never reach the browser.
  const { failures, specifiers } = await verdict({
    ...BASE,
    'Typed.tsx': `import type { ComboboxProps } from '@oxyhq/bloom/combobox'
import { type ChipSize, Chip } from '@oxyhq/bloom/chip'

export default function TypedDemo(props: ComboboxProps) {
  const size: ChipSize = 'small'
  return <Chip size={size} {...props} />
}
`,
  })
  failed += report(
    'a type-only import stays out of the scope',
    !specifiers.includes('@oxyhq/bloom/combobox')
      ? null
      : 'combobox entered the scope from an `import type`',
  )
  failed += report(
    'a value binding beside a `type` one still enters the scope',
    specifiers.includes('@oxyhq/bloom/chip')
      ? null
      : 'chip was dropped because the declaration also had a `type` specifier',
  )
  failed += report(
    'a scope with type-only imports in the demos is still current',
    failures.length === 0 ? null : failures.join('\n'),
  )
}

{
  // No clause, so it binds nothing — but the module still runs, so a snippet
  // containing it needs it resolvable.
  const { specifiers } = await verdict({
    ...BASE,
    'SideEffect.tsx': `import '@oxyhq/bloom/fonts'

export default function SideEffectDemo() {
  return null
}
`,
  })
  failed += report(
    'a side-effect import enters the scope',
    specifiers.includes('@oxyhq/bloom/fonts')
      ? null
      : 'a bare `import "..."` was dropped, so the snippet could not run it',
  )
}

// ---------------------------------------------------------- must FAIL -----

{
  // THE case. A demo grows an import; nobody re-runs the generator. Modifying
  // an existing demo rather than adding one keeps the demo COUNT identical, so
  // the first difference the gate reports is the import itself — proving it
  // caught the surface and not merely a changed number in the header.
  const { failures } = await verdict(BASE, async (dir) => {
    await writeFile(
      join(dir, 'Card.tsx'),
      `import { Card } from '@oxyhq/bloom/card'
import { Combobox } from '@oxyhq/bloom/combobox'

export default function CardDemo() {
  return <Card><Combobox /></Card>
}
`,
    )
  })
  failed += report(
    'a demo importing a surface the scope lacks fails the gate',
    failures.length > 0 ? null : 'the gate passed while a demo imported a surface the scope lacked',
  )
  failed += report(
    'and the failure names the surface',
    mentions(failures, 'combobox')
      ? null
      : `the failure did not name combobox: ${failures.join('\n')}`,
  )
  failed += report(
    'and it says how to fix it',
    mentions(failures, 'generate:bloom-live-scope')
      ? null
      : 'the failure did not name the generator to run',
  )
}

{
  // The other direction: a surface left in the map after the demo that needed
  // it stopped importing it. Free weight in a chunk every page preloads.
  const { failures } = await verdict(BASE, (_dir, scopePath) => {
    const committed = readFileSync(scopePath, 'utf8')
      .replace(
        "import * as bloomCard from '@oxyhq/bloom/card'",
        "import * as bloomCard from '@oxyhq/bloom/card'\nimport * as bloomMenubar from '@oxyhq/bloom/menubar'",
      )
      .replace(
        "  '@oxyhq/bloom/card': bloomCard,",
        "  '@oxyhq/bloom/card': bloomCard,\n  '@oxyhq/bloom/menubar': bloomMenubar,",
      )
    writeFileSync(scopePath, committed)
  })
  failed += report(
    'a scope entry no demo imports fails the gate',
    failures.length > 0 ? null : 'the gate passed while the scope carried a module no demo imports',
  )
}

{
  const { failures } = await verdict({
    ...BASE,
    'Relative.tsx': `import { helper } from './_helper'

export default function RelativeDemo() {
  return <div>{helper()}</div>
}
`,
  })
  failed += report(
    'a relative value import fails the gate',
    failures.length > 0 ? null : 'the gate accepted an import no reader could write',
  )
  failed += report(
    'and the failure names the file that has it',
    mentions(failures, 'Relative.tsx')
      ? null
      : `the failure did not name the demo: ${failures.join('\n')}`,
  )
}

{
  // `x-y` and `x/y` both camel-case to `bloomXY`. Emitting one and dropping the
  // other would type-check and ship a scope missing a module.
  const { failures } = await verdict({
    ...BASE,
    'Collide.tsx': `import { A } from '@oxyhq/bloom/x-y'
import { B } from '@oxyhq/bloom/x/y'

export default function CollideDemo() {
  return <A><B /></A>
}
`,
  })
  failed += report(
    'two specifiers deriving one local name fail the gate',
    mentions(failures, 'bloomXY')
      ? null
      : `expected a collision on bloomXY, got: ${failures.join('\n') || '(the gate passed)'}`,
  )
}

{
  // The vacuity floor, which is the only thing standing between "the walk
  // broke" and "there is less". Same two-demo fixture, real floors.
  const dir = await mkdtemp(join(tmpdir(), 'bloom-live-scope-floor-'))
  try {
    await writeFiles(dir, BASE)
    const scopePath = join(dir, 'BloomLiveScope.generated.ts')
    // Generated with the relaxed floors first, so the committed file is CURRENT
    // and the floor is the only thing left that can fail. Without this the case
    // would pass on "the file does not exist" and would still pass with the
    // floors deleted.
    writeBloomLiveScope(buildBloomLiveScope({ demosDir: dir, floors: FIXTURE_FLOORS }), scopePath)
    const { failures } = validateBloomLiveScope({ demosDir: dir, scopePath })
    failed += report(
      'a demo directory that lost most of its files fails the floor',
      mentions(failures, 'expected at least')
        ? null
        : `expected a floor failure, got: ${failures.join('\n') || '(the gate passed)'}`,
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// ------------------------------------------------- the real repository -----

{
  const { failures, built } = validateBloomLiveScope()
  failed += report(
    "the repository's own committed scope is current",
    failures.length === 0 ? null : failures.join('\n'),
  )
  failed += report(
    'the real scope carries the JSX runtime and more than one Bloom surface',
    (built?.specifiers ?? []).includes('react/jsx-runtime') &&
      (built?.specifiers ?? []).filter((s) => s.startsWith('@oxyhq/bloom/')).length > 1
      ? null
      : `the real scope looks empty: ${built?.specifiers.join(', ')}`,
  )
}

if (failed > 0) {
  console.error(`\n${failed} Bloom playground scope gate case(s) failed.`)
  process.exit(1)
}
console.log('\nAll Bloom playground scope gate cases passed.')
