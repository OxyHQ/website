#!/usr/bin/env bun

/**
 * Mutation-tests `validate-bloom-catalog.ts`.
 *
 * Every part of this gate fails QUIET. A README table that stops matching
 * parses to zero groups. An `exports` walk that stops early emits a short
 * catalog. A TypeScript program that resolved nothing reports every prop as
 * `any` and every surface as empty. A prop module that was never written makes
 * a component page throw on a route nobody opened before the deploy. All of
 * them read exactly like a package that simply has less in it — "I found less"
 * and "there is less" are the same output. So each case below breaks exactly
 * one thing and requires the gate to fail with the words that name the right
 * rule.
 *
 * The cases that must PASS carry as much: the fixture package deliberately
 * contains a barrel export whose `types` file does not exist, two asset
 * exports, an `/expo-router` variant the table never names, and a component
 * that extends a type declared outside the package. A gate that fired on any
 * of those would be deleted by whoever hit it first, and each is the only
 * input that can tell the real rule from a plausible wrong one.
 *
 * The fixture is a real package directory — a real `package.json`, a real
 * README and real `.d.ts` files — so the generator's actual resolution and its
 * actual TypeScript program run, rather than stand-ins for them.
 */

import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { buildBloomCatalog, writeBloomCatalog, type BuildResult } from './generate-bloom-catalog'
import { checkPrerender, validateBloomCatalog } from './validate-bloom-catalog'
import {
  bloomComponentRoutes,
  bloomComponentUrl,
  BLOOM_COMPONENTS_BASE,
} from './bloom-component-routes'
import { bloomIndex } from '../src/content/bloom-catalog.generated'

import { knobFor, type BloomProp } from '../src/content/bloom-catalog'

/** Relaxed so an eight-prop fixture does not fail for a reason unrelated to its case. */
const FIXTURE_FLOORS = { surfaces: 1, props: 1 }

type Files = Record<string, string>

const MANIFEST = {
  name: '@oxyhq/bloom',
  version: '0.0.0-fixture',
  exports: {
    // The barrel. Its `types` file is deliberately NOT created: `.` must be
    // excluded because it is not a subpath, and if it were ever treated as one
    // the unresolved-types check would fail every case in this file at once.
    '.': { import: { types: './lib/index.d.ts', default: './lib/index.js' } },
    './button': {
      browser: { types: './lib/button.web.d.ts', import: './lib/button.web.js' },
      import: { types: './lib/button.d.ts', default: './lib/button.js' },
    },
    './theme': { import: { types: './lib/theme.d.ts', default: './lib/theme.js' } },
    // Asset exports and the manifest itself map to a bare string and declare no
    // `types`. They must fall out structurally, without anything naming them.
    './design-tokens/theme.css': './lib/theme.css',
    './package.json': './package.json',
  },
}

const README = [
  '# Bloom fixture',
  '',
  '## Components',
  '',
  'Bloom publishes 3 subpath exports.',
  '',
  '| Group | Exports |',
  '|---|---|',
  '| Providers and theme | `theme` |',
  '| Actions | `button` |',
  '| Assets | `icons` |',
  '',
  '## Documentation',
  '',
  'Not part of the table.',
  '',
].join('\n')

/**
 * `Size` is declared and used FIRST so its members are interned before
 * `ButtonVariant`'s. The checker then hands `ButtonVariant` back as
 * `ghost | primary | secondary`, and only code that reads the authored order
 * emits `primary` first — which is what a select control must offer.
 *
 * `Fancy` extends a type declared OUTSIDE the package, which is the only shape
 * that exercises leaving props out and naming what they came from.
 */
const BUTTON_DTS = [
  "import type { ViewProps, WithExtras } from '../../external/view-props';",
  "import type { Props as PropsA } from './props-a';",
  "import type { Props as PropsB } from './props-b';",
  "export type Size = 'ghost' | 'small';",
  "export type ButtonVariant = 'primary' | 'secondary' | 'ghost';",
  'export interface ButtonProps {',
  '    size?: Size;',
  '    /**',
  '     * What the button looks like.',
  '     *',
  '     * A second paragraph, which is not the description.',
  '     */',
  '    variant?: ButtonVariant;',
  '    disabled?: boolean | undefined;',
  '    label: string;',
  '    count?: number;',
  '    /**',
  '     * Bare {@link ButtonVariant}, coded {@linkcode Size}, plain {@linkplain Size},',
  '     * labelled {@link Size|the size} and spaced {@link Size the other size}.',
  '     * A literal brace { survives, and so does }.',
  '     */',
  '    linky?: string;',
  '    style?: Record<string, unknown>;',
  '}',
  'export declare const Button: (props: ButtonProps) => unknown;',
  'export declare const PrimaryButton: (props: ButtonProps) => unknown;',
  'export interface FancyProps extends ViewProps {',
  '    tone?: string;',
  '}',
  'export declare const Fancy: (props: FancyProps) => unknown;',
  "export type WrappedProps = WithExtras<{ tone?: string }>;",
  'export declare const Wrapped: (props: WrappedProps) => unknown;',
  'export type LongProps = WithExtras<{',
  '    /** A comment that must never end up inside a type NAME. */',
  '    veryLongPropertyNameOne?: string;',
  '    veryLongPropertyNameTwo?: string;',
  '    veryLongPropertyNameThree?: string;',
  '}>;',
  'export declare const Long: (props: LongProps) => unknown;',
  "export type CommentedProps = WithExtras<{ /** A doc. */ note?: string }>;",
  'export declare const Commented: (props: CommentedProps) => unknown;',
  'export interface MergedProps { own?: string }',
  'export interface MergedProps extends ViewProps {}',
  'export declare const Merged: (props: MergedProps) => unknown;',
  'export declare const Inline: (props: { onlyHere?: string }) => unknown;',
  'export declare const First: (props: PropsA) => unknown;',
  'export declare const Second: (props: PropsB) => unknown;',
  // Two UNNAMED props types with identical props, the shape Bloom writes for
  // every icon. Nothing is named, so nothing can be mislabelled by merging.
  'export declare const IconA: (props: { glyph?: string }) => unknown;',
  'export declare const IconB: (props: { glyph?: string }) => unknown;',
  // Two NAMED types with identical props. These must NOT merge: they are two
  // types, and one name printed over the other is a lie a reader cannot check.
  'export interface AlphaProps { same?: string }',
  'export interface BetaProps { same?: string }',
  'export declare const Alpha: (props: AlphaProps) => unknown;',
  'export declare const Beta: (props: BetaProps) => unknown;',
  '',
].join('\n')

/** The web fork carries one prop the native one does not, so the two are distinguishable. */
const BUTTON_WEB_DTS = BUTTON_DTS.replace(
  '    style?: Record<string, unknown>;',
  '    style?: Record<string, unknown>;\n    asChild?: boolean;',
)

/** Outside `bloom/`, so the generator must treat what it declares as inherited. */
const EXTERNAL_DTS = [
  'export interface ViewProps {',
  '    onLayout?: () => void;',
  '    collapsable?: boolean;',
  '}',
  'export type WithExtras<P> = P & { onLayout?: () => void };',
  '',
].join('\n')

function baseFiles(extra: Files = {}): Files {
  return {
    'external/view-props.d.ts': EXTERNAL_DTS,
    'bloom/package.json': `${JSON.stringify(MANIFEST, null, 2)}\n`,
    'bloom/README.md': README,
    'bloom/lib/button.d.ts': BUTTON_DTS,
    'bloom/lib/button.web.d.ts': BUTTON_WEB_DTS,
    'bloom/lib/theme.d.ts': 'export declare const useTheme: () => { isDark: boolean };\n',
    // Two DIFFERENT interfaces that both print as `Props`, which is what a
    // per-module `Props` convention produces the moment two of them land on one
    // surface. Keyed naively they collide and one prop table silently replaces
    // the other.
    'bloom/lib/props-a.d.ts': 'export interface Props { alpha?: string }\n',
    'bloom/lib/props-b.d.ts': 'export interface Props { beta?: string }\n',
    ...extra,
  }
}

/** A manifest with extra export entries, serialised the way the base one is. */
function manifestWith(extraExports: Record<string, unknown>): string {
  return `${JSON.stringify(
    { ...MANIFEST, exports: { ...MANIFEST.exports, ...extraExports } },
    null,
    2,
  )}\n`
}

interface TestCase {
  name: string
  files: Files
  /** How the committed catalog is set up before validating. */
  commit?:
    | 'fresh' | 'stale-index' | 'stale-version' | 'stale-module'
    | 'extra-module' | 'missing-module' | 'none'
  /** Run with the production floors instead of the fixture ones. */
  realFloors?: boolean
  expectFailure: boolean
  expectOutput?: string
  assert?: (built: BuildResult) => string | null
}

const cases: TestCase[] = [
  {
    name: 'a clean fixture package passes, and its catalog is not empty',
    files: baseFiles(),
    expectFailure: false,
    assert: (built) => {
      const { index, modules, stats, drift } = built
      // The vacuity floor for this whole file. Every failure case below is
      // satisfied by a generator that produces nothing at all, so one case has
      // to pin what a working generator actually emits.
      if (stats.surfaces !== 2) return `expected 2 surfaces, got ${stats.surfaces}`
      if (stats.components !== 14) return `expected 14 components, got ${stats.components}`
      if (stats.props !== 21) return `expected 21 prop entries, got ${stats.props}`
      if (stats.inheritedProps !== 7) return `expected 7 inherited props, got ${stats.inheritedProps}`
      if (modules.size !== 2) return `expected 2 prop modules, got ${modules.size}`

      // The index carries names and categories, and NO props: that split is the
      // whole reason the grid does not download 200 KB to draw cards.
      if (!index.includes("subpath: 'button'")) return 'the button surface is missing from the index'
      if (!index.includes("category: 'Actions'")) return 'button did not take its README category'
      if (!index.includes("{ name: 'Providers and theme', utility: true }")) {
        return 'Providers and theme was not marked a utility group'
      }
      if (!index.includes("{ name: 'Actions', utility: false }")) {
        return 'Actions was marked a utility group'
      }
      if (!index.includes("export const bloomVersion = '0.0.0-fixture'")) {
        return 'the index does not record the Bloom version it was built from'
      }
      if (index.includes("type: 'ButtonVariant'") || index.includes('optional:')) {
        return 'the index carries prop data, which is what the split exists to avoid'
      }
      if (index.includes('design-tokens/theme.css') || index.includes("subpath: '.'")) {
        return 'an asset export or the barrel was published as a surface'
      }

      const button = modules.get('button.ts') ?? ''
      // Only the `browser` condition's file declares `asChild`. This is the one
      // input that tells web-first resolution from native-first.
      if (!button.includes("name: 'asChild'")) return "the browser condition's .d.ts was not read"
      // The checker orders this union `ghost | primary | secondary`.
      if (!button.includes("options: ['primary', 'secondary', 'ghost']")) {
        return 'the union was not emitted in the order Bloom wrote it'
      }
      // Without the `| undefined` strip this reads `boolean | undefined`, and
      // `knobFor` hands back `null` for it instead of a boolean control.
      if (!button.includes("{ name: 'disabled', type: 'boolean', optional: true }")) {
        return 'an optional prop kept its redundant `| undefined`'
      }
      if (!button.includes("description: 'What the button looks like.'")) {
        return 'the first paragraph of a prop JSDoc was not captured'
      }
      // TypeScript reassembles `{@link}` verbatim, so a description arrives with
      // markup mid-sentence. All three spellings unwrap, a labelled tag renders
      // its label, and a literal brace — which no regex over the joined string
      // could safely keep — survives.
      if (!button.includes(
        "description: 'Bare ButtonVariant, coded Size, plain Size, labelled the size"
        + " and spaced the other size. A literal brace { survives, and so does }.'",
      )) {
        return 'a {@link} tag was not unwrapped, or a literal brace did not survive'
      }
      // `Button` and `PrimaryButton` take the SAME `ButtonProps`, and a copy per
      // component was a fifth of the real catalog — `button.ts` alone was 40 KB.
      // Counting the occurrences is the direct test: two means the list was
      // duplicated, whatever else the module looks like.
      if ((button.match(/name: 'variant'/g) ?? []).length !== 1) {
        return 'a shared prop list was emitted more than once'
      }
      if (!button.includes("{ name: 'Button', propsType: 'ButtonProps' },")
        || !button.includes("{ name: 'PrimaryButton', propsType: 'ButtonProps' },")) {
        return 'two components sharing a props type did not point at the same key'
      }
      // Bloom names this one nothing — the props are written inline — so the key
      // falls back to a component's name rather than to an invented id.
      // Bloom names this one nothing — the props are written inline — so the key
      // falls back to a component's name rather than to an invented id.
      if (!button.includes("'Inline': {")
        || !button.includes("{ name: 'Inline', propsType: 'Inline' },")) {
        return 'a props type written inline did not key off its component name'
      }
      // Two different interfaces both print as `Props`. Only the first may keep
      // the name; without the fallback the second overwrites it in the emitted
      // record and `First` renders `Second`'s props with nothing to show for it.
      if (!button.includes("{ name: 'First', propsType: 'Props' },")
        || !button.includes("{ name: 'Second', propsType: 'Second' },")) {
        return 'two distinct types printing the same name were not disambiguated'
      }
      if (!button.includes("name: 'alpha'") || !button.includes("name: 'beta'")) {
        return 'a colliding props type lost its own prop list'
      }
      // Bloom writes its icon props inline, so thirteen icons carry thirteen
      // distinct type objects holding the same three props. Identical unnamed
      // lists merge; the emitted list must appear exactly once.
      if ((button.match(/name: 'glyph'/g) ?? []).length !== 1) {
        return 'two identical unnamed prop lists were emitted twice'
      }
      if (!button.includes("{ name: 'IconB', propsType: 'IconA' },")) {
        return 'two identical unnamed props types did not merge'
      }
      // The other half of that rule. `AlphaProps` and `BetaProps` have the same
      // props and are still two types; merging them would print `Beta` as
      // taking `AlphaProps`.
      if (!button.includes("'AlphaProps': {") || !button.includes("'BetaProps': {")
        || !button.includes("{ name: 'Beta', propsType: 'BetaProps' },")) {
        return 'two identically shaped but separately NAMED types were merged'
      }
      // Fancy extends a type from outside the package: its own prop is listed,
      // the two it inherits are not, and the type they came from is named.
      if (!button.includes("inheritsFrom: ['ViewProps']")) {
        return 'the external base type was not named'
      }
      if (!button.includes("name: 'tone'")) return "Fancy's own prop was dropped"
      if (button.includes("name: 'onLayout'") || button.includes("name: 'collapsable'")) {
        return 'an inherited prop was listed instead of being named through inheritsFrom'
      }
      // A Bloom alias to a single external generic is TRANSPARENT: the
      // right-hand side resolves to the very type the alias names, so a walk
      // that recurses into it hits its own cycle guard and attributes nothing.
      // Bloom really writes this — `type DialogProps =
      // React.PropsWithChildren<{…}>` — and it is the input that tells the two
      // versions apart. Without it the alias reports as `WrappedProps`, a Bloom
      // type the component IS rather than one it inherits from.
      if (!button.includes("inheritsFrom: ['WithExtras<{ tone?: string }>']")) {
        return 'a transparent alias to an external generic was not attributed to it'
      }
      // `getText()` is verbatim source, so an inlined object literal drags its
      // JSDoc into the NAME. Bloom's real `DialogProps` is a fifteen-property
      // documented literal inside `React.PropsWithChildren<…>`, and pasting
      // that into a props table as the name of a type is worse than useless.
      if (!button.includes("inheritsFrom: ['WithExtras<\u2026>']")) {
        return 'a long base name was not shortened to its generic head'
      }
      // Short enough that the length rule above never fires, so this is the
      // only input that tells comment-stripping from truncation.
      if (!button.includes("inheritsFrom: ['WithExtras<{ note?: string }>']")) {
        return 'a JSDoc comment leaked into a short type name'
      }
      // A merged interface declares itself twice and only the SECOND
      // declaration carries the base. Reading `declarations[0]` alone drops it,
      // and the two props it brings become unattributable — which is what the
      // generator's attribution guard then reports.
      if (!button.includes("inheritsFrom: ['ViewProps']")) {
        return 'a merged interface lost the base its second declaration extends'
      }

      // Reported, never enforced: the fixture README claims 3 subpaths and the
      // manifest has 4. A version of this gate that failed on prose would break
      // the site on an upstream typo.
      if (drift.length !== 1 || !drift[0]?.includes('3 subpath exports')) {
        return `expected the prose-count drift to be reported, got ${JSON.stringify(drift)}`
      }
      return null
    },
  },

  // ---------------------------------------------------- the completeness ---
  {
    // The regression the whole catalog exists for: a component added upstream
    // that nothing in the README knows about. It must still reach the docs.
    name: 'a subpath absent from the README table remains visible and reports drift',
    files: baseFiles({
      'bloom/package.json': manifestWith({
        './chip': { import: { types: './lib/chip.d.ts', default: './lib/chip.js' } },
      }),
      'bloom/lib/chip.d.ts': 'export declare const Chip: (props: { label: string }) => unknown;\n',
    }),
    expectFailure: false,
    assert: (built) => {
      if (!built.index.split("subpath: 'chip'")[1]?.includes("category: 'Uncategorized'")) {
        return 'the uncategorized surface is missing from the visible fallback group'
      }
      if (!built.drift.some((line) => line.includes('chip'))) {
        return 'the uncategorized surface was not reported as upstream drift'
      }
      return null
    },
  },
  {
    name: 'a removed group row keeps its surfaces visible as uncategorized',
    files: baseFiles({ 'bloom/README.md': README.replace('| Actions | `button` |\n', '') }),
    expectFailure: false,
    assert: (built) => built.index.split("subpath: 'button'")[1]?.includes("category: 'Uncategorized'")
      ? null
      : 'button disappeared when its README group was removed',
  },
  {
    // The discriminating case for the inheritance rule. Delete it and every
    // other case here stays green while the three `/expo-router` variants Bloom
    // really ships become a permanent build failure.
    name: 'an /expo-router variant the table never names inherits its parent subpath',
    files: baseFiles({
      'bloom/package.json': manifestWith({
        './button/expo-router': {
          import: { types: './lib/button-expo-router.d.ts', default: './lib/x.js' },
        },
      }),
      'bloom/lib/button-expo-router.d.ts':
        'export declare const RouterButton: (props: { href: string }) => unknown;\n',
    }),
    expectFailure: false,
    assert: (built) => {
      if (!built.index.includes("subpath: 'button/expo-router'")) {
        return 'the nested subpath is missing from the index'
      }
      if (!built.index.split("subpath: 'button/expo-router'")[1]?.includes("category: 'Actions'")) {
        return 'button/expo-router did not inherit its parent subpath category'
      }
      // A nested subpath means a nested module, which means a deeper relative
      // import back to the contract. `../bloom-catalog` would not resolve.
      const nested = built.modules.get('button/expo-router.ts') ?? ''
      if (!nested.includes("from '../../bloom-catalog'")) {
        return 'a nested prop module did not adjust its relative import depth'
      }
      return null
    },
  },
  {
    // A rename upstream must fail loudly. Silently, it publishes providers,
    // tokens and fonts as component cards.
    name: 'a renamed utility group fails rather than promoting its exports to cards',
    files: baseFiles({ 'bloom/README.md': README.replace('| Assets |', '| Asset files |') }),
    expectFailure: true,
    expectOutput: 'utility group(s): Assets',
  },

  // --------------------------------------------------------- the sources ---
  {
    name: 'a types path that does not resolve fails, naming it',
    files: baseFiles({
      'bloom/package.json': manifestWith({
        './theme': { import: { types: './lib/theme.moved.d.ts', default: './lib/theme.js' } },
      }),
    }),
    expectFailure: true,
    expectOutput: './lib/theme.moved.d.ts',
  },
  {
    name: 'a README with no Components heading fails as a missing table',
    files: baseFiles({ 'bloom/README.md': README.replace('## Components', '## Surfaces') }),
    expectFailure: true,
    expectOutput: 'no `## Components` heading',
  },
  {
    // Distinguished from the case above on purpose. A table that stops parsing
    // reports itself as a parse failure, not as every subpath being
    // uncategorised — which is the same symptom with a useless cause.
    name: 'a table that stops parsing fails as a parse, not as uncategorised subpaths',
    files: baseFiles({
      'bloom/README.md': README.replace(/\| .*\|\n/g, 'The groups are listed elsewhere.\n'),
    }),
    expectFailure: true,
    expectOutput: 'parsed to zero groups',
  },

  // ---------------------------------------------------- self-protection ----
  {
    // The only way to see the floors fire. Every other case relaxes them,
    // because a two-surface fixture would otherwise fail for a reason that has
    // nothing to do with the mutation under test.
    name: 'the production floors reject a package this small',
    files: baseFiles(),
    realFloors: true,
    expectFailure: true,
    expectOutput: 'below the 70 floor',
  },

  // -------------------------------------------------------- staleness ------
  {
    name: 'a committed index that no longer matches a rebuild fails as stale',
    files: baseFiles(),
    commit: 'stale-index',
    expectFailure: true,
    expectOutput: 'is stale',
  },
  {
    // The index is small and gets read; a prop module is 40 KB of generated
    // data nobody opens. Comparing only the index would leave every prop in the
    // catalog unguarded, which is most of it.
    name: 'a committed prop MODULE that no longer matches a rebuild fails as stale',
    files: baseFiles(),
    commit: 'stale-module',
    expectFailure: true,
    expectOutput: 'is stale',
  },
  {
    // `loadBloomSurfaceProps` reads a build-time glob of the directory, so a
    // module that is never written makes a page throw the first time anyone
    // opens it. No comparison of the files that DO exist can see that.
    name: 'a prop module missing from the committed set fails, naming it',
    files: baseFiles(),
    commit: 'missing-module',
    expectFailure: true,
    expectOutput: 'missing: button.ts',
  },
  {
    // The other direction: a surface Bloom dropped leaves a module that still
    // type-checks and still ships.
    name: 'a prop module for a surface that no longer exists fails, naming it',
    files: baseFiles(),
    commit: 'extra-module',
    expectFailure: true,
    expectOutput: 'left over from a surface Bloom no longer publishes: gone.ts',
  },
  {
    // The drift this exists for: somebody bumps Bloom and does not regenerate.
    // It is caught by content too, but as a diff on a header comment, which
    // reads like nothing. Named, it says what happened.
    name: 'a catalog left behind by an older Bloom fails, naming both versions',
    files: baseFiles(),
    commit: 'stale-version',
    expectFailure: true,
    expectOutput: 'documents @oxyhq/bloom 0.0.0-older, but the installed package is 0.0.0-fixture',
  },
  {
    name: 'a catalog that was never generated fails',
    files: baseFiles(),
    commit: 'none',
    expectFailure: true,
    expectOutput: 'does not exist',
  },
]

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

let failed = 0

for (const testCase of cases) {
  const root = await mkdtemp(join(tmpdir(), 'bloom-catalog-fixture-'))
  try {
    await writeFiles(root, testCase.files)
    const index = join(root, 'bloom-catalog.generated.ts')
    const propsDir = join(root, 'props')
    const options = {
      bloomDir: join(root, 'bloom'),
      index,
      propsDir,
      ...(testCase.realFloors ? {} : { floors: FIXTURE_FLOORS }),
    }
    const commit = testCase.commit ?? 'fresh'

    // Stand up the committed side the way the repository does: generate, then
    // commit. A case whose build is meant to throw simply has nothing to write.
    if (commit !== 'none') {
      try {
        const built = buildBloomCatalog(options)
        await writeFile(
          index,
          commit === 'stale-index'
            ? built.index.replace("subpath: 'button'", "subpath: 'buton'")
            : commit === 'stale-version'
              ? built.index.replace("bloomVersion = '0.0.0-fixture'", "bloomVersion = '0.0.0-older'")
              : built.index,
        )
        for (const [relative, source] of built.modules) {
          if (commit === 'missing-module' && relative === 'button.ts') continue
          const file = join(propsDir, relative)
          await mkdir(dirname(file), { recursive: true })
          await writeFile(
            file,
            commit === 'stale-module' && relative === 'button.ts'
              ? source.replace("name: 'variant'", "name: 'varaint'")
              : source,
          )
        }
        if (commit === 'extra-module') {
          await writeFile(join(propsDir, 'gone.ts'), 'export const props = null\n')
        }
      } catch {
        // Left to the validator to report.
      }
    }

    const { failures, built } = validateBloomCatalog(options)
    const message = failures.join('\n')
    const didFail = failures.length > 0

    if (didFail !== testCase.expectFailure) {
      failed += report(
        testCase.name,
        `expected ${testCase.expectFailure ? 'a failure' : 'a pass'}, got ${didFail ? 'a failure' : 'a pass'}\n${message}`,
      )
      continue
    }
    if (testCase.expectOutput && !message.includes(testCase.expectOutput)) {
      failed += report(
        testCase.name,
        `failed as expected, but the message never said "${testCase.expectOutput}"\n${message}`,
      )
      continue
    }
    if (testCase.assert) {
      failed += report(testCase.name, testCase.assert(built as BuildResult))
      continue
    }
    failed += report(testCase.name, null)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

// ------------------------------------------------ the generator's WRITE ----
//
// Every case above drives the build and the validator, both of which are pure
// reads. The write path is what CLEARS a module for a surface Bloom dropped,
// and if it stops doing that the validator starts failing on an orphan that
// re-running the generator will not clear — a red gate with no reachable fix.
// Measured: a mutation removing the cleanup passed every other case in this
// file.
{
  const root = await mkdtemp(join(tmpdir(), 'bloom-catalog-write-'))
  try {
    await writeFiles(root, baseFiles())
    const targets = {
      index: join(root, 'bloom-catalog.generated.ts'),
      propsDir: join(root, 'props'),
    }
    const options = { bloomDir: join(root, 'bloom'), floors: FIXTURE_FLOORS, ...targets }

    writeBloomCatalog(buildBloomCatalog(options), targets)
    await writeFile(join(targets.propsDir, 'gone.ts'), 'export const props = null\n')
    writeBloomCatalog(buildBloomCatalog(options), targets)

    const { failures } = validateBloomCatalog(options)
    failed += report(
      'writing the catalog clears a module for a surface that no longer exists',
      failures.length === 0 ? null : failures.join('\n'),
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

// -------------------------------------------------------- the real tree ----
//
// Everything above runs against a fixture. This is the end-to-end control: the
// installed Bloom, the committed catalog, the production floors.
{
  const { failures, built } = validateBloomCatalog()
  failed += report(
    "the repository's own committed catalog is current",
    failures.length === 0 ? null : failures.join('\n'),
  )

  const button = built?.modules.get('button.ts') ?? ''
  failed += report(
    'the real catalog carries ButtonVariant in the order Bloom declares it',
    button.includes(
      "options: ['primary', 'secondary', 'inverse', 'icon', 'ghost', 'text', 'outline', 'link', 'destructive']",
    )
      ? null
      : "ButtonVariant came back in the checker's internal order, not Bloom's",
  )
  failed += report(
    'the real catalog attributes every prop it leaves out',
    // The generator throws when it cannot, so reaching here with a real
    // `inheritedProps` count is the proof that it had something to attribute.
    (built?.stats.inheritedProps ?? 0) > 1000
      ? null
      : `expected thousands of inherited props, got ${built?.stats.inheritedProps}`,
  )
}

// --------------------------------------------------- prerender coverage ----
//
// A surface with no prerendered route renders for a human off Cloudflare's SPA
// fallback and does not exist for a crawler — no title, no description, no
// sitemap row. That is invisible from inside the app, which is why it went
// unnoticed for all 87 pages, so it is asserted here instead.
//
// Driven directly rather than through a fixture: the inputs are a doctored
// index and a doctored route list, which no fixture package can express.
{
  const routes = bloomComponentRoutes()
  const wired = 'for (const { url, seo } of bloomComponentRoutes()) result.set(url, { url, seo })'

  const expectations: Array<[string, string[], (detail: string) => boolean]> = [
    ['the real tree covers every surface', checkPrerender(bloomIndex, routes, wired), (d) => d === ''],
    [
      'a surface with no route fails, naming it',
      checkPrerender(bloomIndex, routes.filter((r) => r.url !== bloomComponentUrl('button')), wired),
      (d) => d.includes('- button'),
    ],
    [
      'a missing hub fails',
      checkPrerender(bloomIndex, routes.filter((r) => r.url !== BLOOM_COMPONENTS_BASE), wired),
      (d) => d.includes('component hub'),
    ],
    [
      // The shape this would really take: somebody filters the derivation to
      // match the hub, which cards only the non-utility groups.
      'dropping the utility surfaces fails',
      checkPrerender(
        bloomIndex,
        bloomComponentRoutes(bloomIndex.filter((e) => e.category !== 'Providers and theme')),
        wired,
      ),
      (d) => d.includes('- theme'),
    ],
    [
      'a route for a surface Bloom dropped fails',
      checkPrerender(bloomIndex.filter((e) => e.subpath !== 'button'), routes, wired),
      (d) => d.includes('no longer publishes'),
    ],
    [
      // Routes derived correctly and handed to nobody is indistinguishable
      // from the six-source version this fixed, and coverage cannot see it.
      'prerender.ts that no longer walks the catalog fails',
      checkPrerender(bloomIndex, routes, '// bloomComponentRoutes is mentioned only in a comment'),
      (d) => d.includes('no longer walks'),
    ],
  ]

  for (const [name, failures, ok] of expectations) {
    const detail = failures.join('\n')
    failed += report(
      `prerender: ${name}`,
      ok(detail) ? null : `got ${failures.length} failure(s):\n${detail}`,
    )
  }

  // A title a crawler reads must be the title the page renders. Both call
  // `pascalPath` from the contract, so this pins that they still agree.
  const nested = routes.find((r) => r.url === bloomComponentUrl('tabs/expo-router'))
  failed += report(
    'prerender: a nested subpath keeps its slash in the URL and its name in the title',
    nested?.seo.title === 'Tabs/ExpoRouter, Bloom'
      ? null
      : `expected "Tabs/ExpoRouter, Bloom", got ${JSON.stringify(nested?.seo.title)}`,
  )
}

// ------------------------------------------------------------- knobFor -----
//
// The one derivation three consumers share, and nothing else exercises it: it
// reads only the emitted fields, so a change to how `type` is printed silently
// turns controls off.
{
  const prop = (extra: Partial<BloomProp>): BloomProp => ({
    name: 'x',
    type: 'unknown',
    optional: true,
    ...extra,
  })
  const expectations: Array<[string, BloomProp, string | null]> = [
    ['a string-literal union is a select', prop({ type: 'ButtonVariant', options: ['a', 'b'] }), 'select'],
    ['boolean is a boolean', prop({ type: 'boolean' }), 'boolean'],
    ['string is text', prop({ type: 'string' }), 'text'],
    ['number is a number', prop({ type: 'number' }), 'number'],
    ['a style object has no knob', prop({ type: 'Record<string, unknown>' }), null],
    ['a ReactNode has no knob', prop({ type: 'React.ReactNode' }), null],
  ]
  for (const [name, input, expected] of expectations) {
    const knob = knobFor(input)
    const actual = knob === null ? null : knob.kind
    failed += report(
      `knobFor: ${name}`,
      actual === expected ? null : `expected ${expected}, got ${actual}`,
    )
  }
}

if (failed > 0) {
  console.error(`\n${failed} Bloom catalog gate case(s) failed.`)
  process.exit(1)
}
console.log('\nAll Bloom catalog gate cases passed.')
