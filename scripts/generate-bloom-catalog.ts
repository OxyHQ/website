#!/usr/bin/env bun

/**
 * Writes the generated Bloom catalog: every surface `@oxy.so/bloom` publishes,
 * what it exports and what props those exports take.
 *
 * ## Why generated
 *
 * The docs used to read a hand-written registry of sixteen demos, each with a
 * `<Name>.props.ts` restating prop types that Bloom's own `.d.ts` already
 * declares. Two failures follow from that and neither is visible in a diff: a
 * component added to Bloom appears nowhere and nothing says so, and a restated
 * prop list drifts from the real one the moment Bloom changes a union. Both are
 * fixed by never writing the list down.
 *
 * ## Two outputs, because the grid needs none of the props
 *
 *   - `src/content/bloom-catalog.generated.ts` — the index. Subpaths,
 *     categories, component names. Imported eagerly by the component grid,
 *     which draws cards and never reads a prop.
 *   - `src/content/bloom-catalog-props/<subpath>.ts` — one module per surface.
 *     Reached only through `bloom-catalog-loader.ts`, whose `import.meta.glob`
 *     makes Vite code-split them so a component page downloads its own and
 *     nothing else. The loader is a separate module because `import.meta.glob`
 *     does not exist under Bun, and the index has to stay importable from
 *     `scripts/` — the prerender derives a route per surface from it.
 *
 * ## Three inputs, all from the installed package
 *
 *   - **Surfaces** — the `exports` map. A subpath is a surface when its entry
 *     declares `types`; `./package.json` and the two `design-tokens/*` asset
 *     exports map to a bare string and fall out structurally, so no name is
 *     written down here. The root `.` is excluded because it is the barrel: it
 *     re-exports every surface, and counting it counts all of them twice.
 *   - **Categories** — Bloom's README carries a `## Components` table mapping
 *     nine groups to backticked subpath names. A newly published subpath the
 *     table does not name is kept visible in an `Uncategorized` group and
 *     reported as upstream drift, so stale prose cannot hide or block it. The
 *     `/expo-router` variants inherit from their parent subpath,
 *     which is a structural rule rather than a list — a future `x/expo-router`
 *     is categorised the day it ships.
 *   - **Props** — the TypeScript compiler API over each surface's `.d.ts`.
 *
 * ## Bloom's props, not the platform's
 *
 * Three quarters of the props reachable from a Bloom component are not Bloom's:
 * 3807 arrive through `extends ViewProps` and friends against Bloom's own 1335,
 * and none of them is a control — `style`, `onLayout`, `accessibilityRole`. So
 * a prop is emitted when BLOOM declares it, and the types it reaches outside
 * Bloom are named instead, as `inheritsFrom`. The generator fails if a prop it
 * leaves out is not attributable to one of those names, because a props table
 * that quietly loses a prop is the failure this catalog exists to prevent.
 *
 * ## Which `.d.ts`
 *
 * The `browser` condition's, falling back to the platform-neutral one. This
 * site is a Vite web build over `react-native-web`, so the `.web.d.ts` fork is
 * the one whose props the playground actually renders — and 29 of the 87
 * surfaces declare a different file there than they do for native.
 *
 * ## What fails the build
 *
 * A `types` path that does not resolve, a README whose table cannot be parsed
 * or has lost a utility group, an omitted prop no
 * base accounts for, and either vacuity floor. A generator whose walk quietly
 * stopped finding surfaces would emit a short catalog and look perfectly
 * healthy, so the floors are the check that "I found less" and "there is less"
 * do not read the same.
 *
 * Bloom's own prose count is compared too, but only reported: the website
 * cannot fix a stale sentence upstream, and a build that breaks on one would be
 * disabled by whoever hit it first. The drift is written into the index's
 * header instead, where a reviewer sees it.
 *
 * Run by `predev` / `prebuild` and by `bun run generate:bloom-catalog`; the
 * output is committed so a plain `vite build` is never left without a catalog.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import ts from 'typescript'

import type {
  BloomCategory,
  BloomComponentEntry,
  BloomProp,
  BloomSurfaceEntry,
} from '../src/content/bloom-catalog'

const CONTENT_DIR = join(import.meta.dir, '..', 'src', 'content')

/** The committed index. Read back by `validate-bloom-catalog.ts`. */
export const CATALOG_PATH = join(CONTENT_DIR, 'bloom-catalog.generated.ts')

/** The committed per-surface prop modules, one file per subpath. */
export const PROPS_DIR = join(CONTENT_DIR, 'bloom-catalog-props')

/**
 * The README groups that publish infrastructure rather than surfaces a reader
 * can look at. Group NAMES, deliberately — membership comes from the table, so
 * moving `fonts` out of `Assets` upstream moves it here too. Each name must
 * still appear in the table, or a rename upstream would silently promote a
 * dozen utility exports into component cards.
 */
const UTILITY_GROUPS = ['Providers and theme', 'Assets']
const UNCATEGORIZED_GROUP = 'Uncategorized'

/**
 * Set below today's 87 surfaces and 1023 emitted prop entries — Bloom's own
 * props, counted once per distinct props TYPE rather than once per component —
 * far enough that ordinary churn upstream does not trip them and a broken walk
 * cannot pass.
 */
const FLOORS = { surfaces: 70, props: 800 }

/**
 * Export conditions in the order this site resolves them. Vite's client build
 * keeps `browser` in its default conditions and prefers `.web.*` extensions.
 */
const WEB_CONDITIONS = ['browser', 'import', 'require', 'react-native']

export interface CatalogStats {
  surfaces: number
  components: number
  /** Distinct props types across every surface. */
  propTypes: number
  /** Prop entries emitted — one per prop per distinct props TYPE, not per component. */
  props: number
  /** Props left out because a type outside Bloom declares them. */
  inheritedProps: number
}

export interface BuildOptions {
  /** Root of the `@oxy.so/bloom` package to read. Defaults to the installed one. */
  bloomDir?: string
  /** Vacuity floors. Fixtures relax them; nothing else should. */
  floors?: { surfaces: number; props: number }
}

export interface BuildResult {
  /** The `@oxy.so/bloom` version the catalog was built from. */
  version: string
  /** Source of the eager index module. */
  index: string
  /** Per-surface prop modules, keyed by their path relative to `PROPS_DIR`. */
  modules: Map<string, string>
  stats: CatalogStats
  /** Non-fatal disagreements between Bloom's prose and its `exports` map. */
  drift: string[]
}

export function resolveInstalledBloomDir(): string {
  const require = createRequire(import.meta.url)
  return dirname(require.resolve('@oxy.so/bloom/package.json'))
}

// --------------------------------------------------------------- exports ---

interface BloomPackage {
  version: string
  exports: Record<string, unknown>
}

/**
 * The `types` file this site would resolve for one export entry. `null` when
 * the entry declares none — an asset export, or `./package.json` itself.
 */
function typesTargetOf(entry: unknown): string | null {
  if (typeof entry !== 'object' || entry === null) return null
  const conditions = entry as Record<string, unknown>
  for (const condition of WEB_CONDITIONS) {
    const nested = conditions[condition]
    if (typeof nested === 'object' && nested !== null) {
      const target = (nested as Record<string, unknown>).types
      if (typeof target === 'string') return target
    }
  }
  return typeof conditions.types === 'string' ? conditions.types : null
}

// ---------------------------------------------------------------- README ---

interface ComponentTable {
  categories: BloomCategory[]
  /** Subpath → group name, exactly as the table spells both. */
  categoryOf: Map<string, string>
  /** The count Bloom's own prose claims, when the section states one. */
  claimedSubpathCount: number | null
}

function parseComponentTable(readme: string): ComponentTable {
  const heading = readme.match(/^## Components$/m)
  if (!heading || heading.index === undefined) {
    throw new Error(
      "Bloom's README has no `## Components` heading, so no subpath can be categorised.\n"
      + '    Every category in this catalog comes from the table under it.',
    )
  }
  const rest = readme.slice(heading.index + heading[0].length)
  const nextHeading = rest.search(/^## /m)
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading)

  const categories: BloomCategory[] = []
  const categoryOf = new Map<string, string>()

  for (const line of section.split('\n')) {
    if (!line.trimStart().startsWith('|')) continue
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim())
    if (cells.length !== 2) continue
    const [group, exportsCell] = cells
    if (!group || !exportsCell) continue
    if (group === 'Group') continue
    if (/^:?-+:?$/.test(group)) continue

    const names = [...exportsCell.matchAll(/`([^`]+)`/g)].map((match) => match[1] as string)
    if (names.length === 0) continue

    categories.push({ name: group, utility: UTILITY_GROUPS.includes(group) })
    for (const name of names) categoryOf.set(name, group)
  }

  // A positive control for the parse itself. A table that stopped matching —
  // a column added upstream, a switch to HTML — reads exactly like a package
  // with no components, and would otherwise fail later with a wall of
  // "uncategorised" instead of the one sentence that explains it.
  if (categories.length === 0) {
    throw new Error(
      "Bloom's README `## Components` section parsed to zero groups.\n"
      + '    The table shape changed upstream; fix the parse rather than the data.',
    )
  }

  const missingUtility = UTILITY_GROUPS.filter(
    (group) => !categories.some((category) => category.name === group),
  )
  if (missingUtility.length > 0) {
    throw new Error(
      `Bloom's README component table no longer has the utility group(s): ${missingUtility.join(', ')}.\n`
      + '    They were renamed or removed upstream. Until UTILITY_GROUPS is updated to match,\n'
      + '    every export in them would be published as a component card.',
    )
  }

  const claimed = section.match(/Bloom publishes (\d+) subpath exports/)
  return {
    categories,
    categoryOf,
    claimedSubpathCount: claimed ? Number(claimed[1]) : null,
  }
}

/**
 * A subpath's group, inherited from its parent subpath when it has none of its
 * own. That is what categorises `tabs/expo-router` under `tabs`'s group without
 * naming any of the three variants Bloom ships today.
 */
function categoryFor(subpath: string, categoryOf: Map<string, string>): string | undefined {
  const direct = categoryOf.get(subpath)
  if (direct !== undefined) return direct
  const parent = subpath.lastIndexOf('/')
  return parent > 0 ? categoryFor(subpath.slice(0, parent), categoryOf) : undefined
}

// ------------------------------------------------------------ extraction ---

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * A JSDoc comment as prose, with its `{@link}` tags unwrapped.
 *
 * `displayPartsToString` reassembles the tag verbatim, so a description reads
 * "…for the same reason as {@link ButtonProps['aria-expanded']}" — markup in
 * the middle of a sentence three separate consumers would each have to strip.
 * The parts carry the structure, so this drops the wrappers rather than
 * pattern-matching the text: a literal brace in a description is a plain text
 * part and survives untouched, which no regex over the joined string can
 * promise. `{@linkcode}` and `{@linkplain}` arrive as the same three parts.
 */
function documentationText(parts: readonly ts.SymbolDisplayPart[]): string {
  let text = ''
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index] as ts.SymbolDisplayPart
    // `{@link ` and the closing `}`.
    if (part.kind === 'link') continue
    if (part.kind === 'linkName') {
      // A tag carrying a label renders the label; a bare one renders its target.
      const next = parts[index + 1]
      if (next?.kind === 'linkText' && next.text.trim() !== '') {
        text += next.text.replace(/^[|\s]+/, '')
        index += 1
        continue
      }
      text += part.text
      continue
    }
    if (part.kind === 'linkText') {
      text += part.text.replace(/^[|\s]+/, '')
      continue
    }
    text += part.text
  }
  return text
}

/** First paragraph of a symbol's JSDoc, whitespace collapsed. */
function documentationOf(symbol: ts.Symbol, checker: ts.TypeChecker): string | undefined {
  const comment = documentationText(symbol.getDocumentationComment(checker)).trim()
  if (!comment) return undefined
  return collapse(comment.split(/\n[ \t]*\n/)[0] ?? '') || undefined
}

/**
 * The declared text of a prop's type. React Native's own `.d.ts` files spell
 * optionality twice (`accessible?: boolean | undefined`), and Bloom inherits
 * that habit in places — left alone, every such prop would print a union nobody
 * wrote and lose its knob. `optional` already carries the fact.
 */
function declaredTypeText(node: ts.TypeNode, optional: boolean): string {
  if (optional && ts.isUnionTypeNode(node)) {
    const kept = node.types.filter((member) => member.kind !== ts.SyntaxKind.UndefinedKeyword)
    if (kept.length > 0 && kept.length < node.types.length) {
      return kept.map((member) => collapse(member.getText())).join(' | ')
    }
  }
  return collapse(node.getText())
}

/** The string-literal members of a union type NODE, in the order they were written. */
function writtenUnionMembers(node: ts.TypeNode): string[] | undefined {
  if (!ts.isUnionTypeNode(node)) return undefined
  const members: string[] = []
  for (const member of node.types) {
    if (!ts.isLiteralTypeNode(member) || !ts.isStringLiteral(member.literal)) return undefined
    members.push(member.literal.text)
  }
  return members
}

/**
 * A union's members in the order Bloom wrote them.
 *
 * The checker orders a union by internal type id, which is deterministic but
 * arbitrary: `ButtonVariant` comes back with `icon` first, because `ButtonSize`
 * interned that literal earlier in the program. A select control should offer
 * `primary` first, the way the source does. Every candidate is checked against
 * the resolved set before it is used, so this can reorder members but never
 * invent or drop one.
 */
function orderedOptions(
  resolved: ts.Type,
  declared: ts.TypeNode | undefined,
  members: string[],
): string[] {
  const aliasDeclaration = resolved.aliasSymbol?.declarations?.[0]
  const candidates = [
    declared ? writtenUnionMembers(declared) : undefined,
    aliasDeclaration && ts.isTypeAliasDeclaration(aliasDeclaration)
      ? writtenUnionMembers(aliasDeclaration.type)
      : undefined,
  ]
  for (const candidate of candidates) {
    if (candidate
      && candidate.length === members.length
      && members.every((member) => candidate.includes(member))) {
      return candidate
    }
  }
  return members
}

/**
 * Everything a props type reaches outside Bloom, each paired with the name
 * Bloom writes for it.
 *
 * The walk descends THROUGH Bloom's own types — a Bloom interface extending
 * another Bloom interface that extends `ViewProps` reports `ViewProps`, not the
 * intermediate — and stops at the first declaration Bloom does not own. A
 * synthesised intersection (what `forwardRef` produces: `P & RefAttributes<T>`)
 * has no node to read a name from, so its constituents fall back to the
 * checker's printed form; a written one passes its own text down, which is why
 * `PropsWithChildren<object>` reports as itself rather than as the
 * `{ children?: ReactNode; }` half it resolves to.
 *
 * One name can cover several constituent types, so the result is a list rather
 * than a map.
 */
/** Longest base name worth printing whole; past this a generic is named by its head. */
const MAX_BASE_NAME = 80

/**
 * How a base type is named in `inheritsFrom`.
 *
 * `getText()` returns the source verbatim, so an inlined object literal brings
 * its JSDoc with it — `type DialogProps = React.PropsWithChildren<{ \/** …
 * Imperative open/close handle … *\/ control?: … }>` really does spell a
 * fifteen-property documented literal, and pasting that into a props table as
 * the name of a type is worse than useless. Comments go, and a generic too long
 * to read is named by its head, which is the part a reader needs.
 */
function baseName(node: ts.TypeNode | ts.ExpressionWithTypeArguments): string {
  const text = collapse(node.getText().replace(/\/\*[\s\S]*?\*\//g, ' '))
  if (text.length <= MAX_BASE_NAME) return text
  const head = ts.isTypeReferenceNode(node)
    ? node.typeName.getText()
    : ts.isExpressionWithTypeArguments(node) ? node.expression.getText() : null
  return head ? `${head}<\u2026>` : `${text.slice(0, MAX_BASE_NAME - 1)}\u2026`
}

function collectExternalBases(
  type: ts.Type,
  name: string | undefined,
  checker: ts.TypeChecker,
  bloomDir: string,
  found: Array<{ name: string; type: ts.Type }>,
  seen: Set<ts.Type>,
): void {
  if (seen.has(type)) return
  seen.add(type)

  const owned = (declaration: ts.Declaration): boolean =>
    declaration.getSourceFile().fileName.startsWith(`${bloomDir}/`)

  // A declaration Bloom owns is read BEFORE the type is treated as an
  // intersection, and the order is the whole correctness of this. `DialogProps`
  // is a Bloom alias whose right-hand side is an intersection; split as a bare
  // intersection first, its `children` half — which @types/react declares —
  // gets recorded under the name of the alias that contains it, and the
  // component reports inheriting from a Bloom type it IS. Reading the alias
  // instead names each half by what Bloom actually wrote there.
  const descend = (node: ts.TypeNode | ts.ExpressionWithTypeArguments): void => {
    collectExternalBases(
      checker.getTypeAtLocation(node), baseName(node), checker, bloomDir, found, seen,
    )
  }

  // EVERY declaration, not the first. An interface can be declared twice and
  // merged — which is how a typings package adds a base to someone else's
  // interface — and reading only `declarations[0]` silently drops whatever the
  // other one extends, leaving its props with nothing to attribute them to.
  const ownedDeclarations = [
    ...(type.symbol?.declarations ?? []),
    ...(type.aliasSymbol?.declarations ?? []),
  ].filter(owned)

  let label = name
  let transparent = false
  for (const declaration of ownedDeclarations) {
    if (ts.isInterfaceDeclaration(declaration)) {
      for (const clause of declaration.heritageClauses ?? []) for (const node of clause.types) descend(node)
      continue
    }
    // Anything else Bloom declares inline — a type literal — contributes only
    // its own properties, which are emitted rather than attributed.
    if (!ts.isTypeAliasDeclaration(declaration)) continue

    const right = declaration.type
    if (ts.isIntersectionTypeNode(right)) {
      for (const node of right.types) descend(node)
      continue
    }
    if (checker.getTypeAtLocation(right) !== type) {
      descend(right)
      continue
    }
    // An alias to a single type is TRANSPARENT: the right-hand side resolves to
    // this very type object, so descending would hit the cycle guard above and
    // record nothing at all. `type DialogProps = React.PropsWithChildren<{…}>`
    // is that shape, and it is how `children` went missing with nothing to
    // attribute it to. Adopt the name Bloom wrote there and carry on below.
    transparent = true
    label = baseName(right)
  }
  if (ownedDeclarations.length > 0 && !transparent) return

  // No declaration Bloom owns. A synthesised intersection — what `forwardRef`
  // produces — has no node to read a name from, so its constituents keep
  // whatever name reached them; an external alias like `PropsWithChildren<X>`
  // passes its own written form down, which is why it reports as itself rather
  // than as the `{ children?: ReactNode; }` half it resolves to.
  if (type.isIntersection()) {
    for (const member of type.types) {
      collectExternalBases(member, label, checker, bloomDir, found, seen)
    }
    return
  }

  found.push({ name: label ?? collapse(checker.typeToString(type)), type })
}

interface ExtractedProps {
  props: BloomProp[]
  inheritsFrom: string[]
  /** Props left out, by name. Every one must be covered by `inheritsFrom`. */
  omitted: string[]
  /** Omitted props no base accounts for. Non-empty means the emit is lying. */
  unattributed: string[]
}

function extractProps(
  propsType: ts.Type,
  entryTypeNode: ts.TypeNode | undefined,
  checker: ts.TypeChecker,
  bloomDir: string,
): ExtractedProps {
  const props: BloomProp[] = []
  const omitted = new Set<string>()

  for (const symbol of checker.getPropertiesOfType(propsType)) {
    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0]
    if (!declaration) continue

    if (!declaration.getSourceFile().fileName.startsWith(`${bloomDir}/`)) {
      omitted.add(symbol.getName())
      continue
    }

    const optional = (symbol.flags & ts.SymbolFlags.Optional) !== 0
    const node = ts.isPropertySignature(declaration) || ts.isPropertyDeclaration(declaration)
      ? declaration.type
      : undefined
    const type = checker.getTypeOfSymbolAtLocation(symbol, declaration)

    // Resolved through the alias, so a prop typed `ButtonVariant` still yields
    // its members. The declared text above deliberately cannot do this.
    const resolved = checker.getNonNullableType(type)
    const members = resolved.isUnion()
      && resolved.types.length > 1
      && resolved.types.every((member) => member.isStringLiteral())
      ? resolved.types.map((member) => (member as ts.StringLiteralType).value)
      : undefined

    const description = documentationOf(symbol, checker)
    props.push({
      name: symbol.getName(),
      type: node ? declaredTypeText(node, optional) : collapse(checker.typeToString(type)),
      ...(members ? { options: orderedOptions(resolved, node, members) } : {}),
      optional,
      ...(description ? { description } : {}),
    })
  }

  // Only bases that actually contribute an omitted prop are named. Without
  // that filter a component reports `Omit<ButtonProps, "variant">` — a wrapper
  // around one of BLOOM's own types, whose props are all listed above anyway.
  const entryName = entryTypeNode && checker.getTypeAtLocation(entryTypeNode) === propsType
    ? baseName(entryTypeNode)
    : undefined
  const bases: Array<{ name: string; type: ts.Type }> = []
  collectExternalBases(propsType, entryName, checker, bloomDir, bases, new Set())

  const inheritsFrom: string[] = []
  const covered = new Set<string>()
  for (const base of bases) {
    const contributes = checker.getPropertiesOfType(base.type)
      .filter((property) => omitted.has(property.getName()))
    if (contributes.length === 0) continue
    if (!inheritsFrom.includes(base.name)) inheritsFrom.push(base.name)
    for (const property of contributes) covered.add(property.getName())
  }

  return {
    props,
    inheritsFrom,
    omitted: [...omitted],
    unattributed: [...omitted].filter((name) => !covered.has(name)),
  }
}

interface ExtractedComponent {
  entry: BloomComponentEntry
  /**
   * The props type itself, so identical types can be recognised as identical.
   * Ten button components share one `ButtonProps`, and comparing the emitted
   * prop LISTS instead would also merge two types that happen to look alike
   * today — a coincidence, not a shared type, and it would come apart the
   * moment one of them gained a prop.
   */
  propsType: ts.Type | null
  /** The name Bloom gives that type, when it has one. */
  propsTypeName: string | null
  props: readonly BloomProp[]
  inheritsFrom: readonly string[]
  omittedCount: number
  unattributed: string[]
}

/**
 * The name Bloom gives a props type, or `null` for one written inline.
 *
 * The PRINTED type, not the type's symbol name. Nine of the button presets take
 * `Omit<ButtonProps, 'variant'>`, whose symbol is named `Omit` — the utility,
 * not the props — and whose parameter is declared inside React's own typings as
 * `P`, so neither the symbol nor the written parameter is any use. The printed
 * form is both a key and something a reader recognises.
 *
 * `null` when the printed form is not a name at all. Bloom writes its icon props
 * as an inline literal inside `ForwardRefExoticComponent<{…}>`, so there is no
 * name to find and the caller falls back to a component's.
 */
function propsTypeNameOf(type: ts.Type, checker: ts.TypeChecker): string | null {
  const printed = collapse(checker.typeToString(type))
    // `forwardRef` widens a props type to `P & RefAttributes<T>`. The ref half
    // is plumbing, it is already reported in `inheritsFrom`, and leaving it in
    // the name turns `SwitchProps` into `SwitchProps & RefAttributes<View>`.
    .replace(/\s*&\s*RefAttributes<[^<>]*>$/, '')
  if (!/^[A-Za-z_$][\w$.]*(<.+>)?$/.test(printed)) return null
  return printed.length <= MAX_BASE_NAME ? printed : printed.replace(/<.+>$/, '<\u2026>')
}

/**
 * Every component a surface exports.
 *
 * A component is an export whose name starts with a capital and which is
 * callable or constructable. Measured across all 87 surfaces this accepts 189
 * exports and nothing else: the narrower "and returns something React-shaped"
 * test differs on exactly one, `ConnectionStatusToasts`, which returns `null`
 * and is a component. A class (`ErrorBoundary`) and a portal (`Portal`, which
 * returns `ReactPortal | null`) are the other two the narrow test argues about,
 * and both are components too.
 */
function extractComponents(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  bloomDir: string,
): ExtractedComponent[] {
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile)
  if (!moduleSymbol) return []

  const components: ExtractedComponent[] = []
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const name = exported.getName()
    if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) continue

    let symbol = exported
    if (symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0]
    if (!declaration) continue

    const type = checker.getTypeOfSymbolAtLocation(symbol, declaration)
    const signature = type.getCallSignatures()[0] ?? type.getConstructSignatures()[0]
    if (!signature) continue

    const parameter = signature.getParameters()[0]
    const parameterDeclaration = parameter?.valueDeclaration ?? parameter?.declarations?.[0]
    const propsType = parameter && parameterDeclaration
      ? checker.getTypeOfSymbolAtLocation(parameter, parameterDeclaration)
      : null
    const propsTypeNode = parameterDeclaration && ts.isParameter(parameterDeclaration)
      ? parameterDeclaration.type
      : undefined
    const extracted = propsType
      ? extractProps(propsType, propsTypeNode, checker, bloomDir)
      : { props: [], inheritsFrom: [], omitted: [], unattributed: [] }

    const description = documentationOf(exported, checker) ?? documentationOf(symbol, checker)
    components.push({
      entry: { name, ...(description ? { description } : {}) },
      propsType,
      propsTypeName: propsType ? propsTypeNameOf(propsType, checker) : null,
      props: extracted.props,
      inheritsFrom: extracted.inheritsFrom,
      omittedCount: extracted.omitted.length,
      unattributed: extracted.unattributed,
    })
  }
  return components
}

// ---------------------------------------------------------------- emitter ---

const DO_NOT_EDIT = '// Generated by scripts/generate-bloom-catalog.ts. Do not edit.'

function quote(value: string): string {
  if (value.includes("'") && !value.includes('"')) return `"${value}"`
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function emitProp(prop: BloomProp, indent: string): string {
  const fields = [`name: ${quote(prop.name)}`, `type: ${quote(prop.type)}`]
  if (prop.options) fields.push(`options: [${prop.options.map(quote).join(', ')}]`)
  fields.push(`optional: ${prop.optional}`)
  if (prop.description) fields.push(`description: ${quote(prop.description)}`)
  return `${indent}{ ${fields.join(', ')} },`
}

interface SurfacePropTypes {
  /** Distinct props types on the surface, in the order their first component appears. */
  entries: Array<{ key: string; props: readonly BloomProp[]; inheritsFrom: readonly string[] }>
  /** Component name -> key into `entries`. Absent for a component with nothing to point at. */
  keyOfComponent: Map<string, string>
}

/**
 * Collapse a surface's components onto the distinct props types they share.
 *
 * Two components are merged on different evidence depending on whether Bloom
 * named the type, and the split is the whole correctness of this:
 *
 *   - **Named** types merge only when they are the SAME type. Ten button
 *     components really do take one `ButtonProps`. Two differently named types
 *     that happen to have identical props today are not one type, and merging
 *     them would print `IconButton` as taking `ChipProps`.
 *   - **Unnamed** types merge when their prop lists are identical. Bloom writes
 *     its icon props inline, so thirteen icons have thirteen distinct type
 *     objects carrying the same three props — nothing is named, so nothing can
 *     be mislabelled, and "every icon takes the same props" is a fact an icons
 *     page should be able to state rather than repeat thirteen times.
 *
 * Keyed by the name Bloom gives the type, because that is what a reader sees in
 * the `.d.ts` and it means nothing has to be minted. Two fallbacks, in order,
 * and both use a name Bloom already exports:
 *
 *   - a props type written inline has no name, so it takes its component's;
 *   - two DIFFERENT types printing one name — a `Props` interface per module,
 *     two of them on one surface — would silently overwrite each other in the
 *     emitted record, so the loser takes its component's name instead.
 *
 * Component names are module exports and therefore unique per surface, which is
 * what makes the fallback always available.
 */
function groupPropTypes(components: readonly ExtractedComponent[]): SurfacePropTypes {
  const entries: SurfacePropTypes['entries'] = []
  const keyOfComponent = new Map<string, string>()
  const byIdentity = new Map<ts.Type, string>()
  const byShape = new Map<string, string>()
  const taken = new Map<string, string>()

  for (const component of components) {
    const name = component.entry.name
    if (component.props.length === 0 && component.inheritsFrom.length === 0) continue

    const named = component.propsTypeName !== null
    const shape = JSON.stringify([component.props, component.inheritsFrom])

    const existing = named
      ? (component.propsType ? byIdentity.get(component.propsType) : undefined)
      : byShape.get(shape)
    if (existing !== undefined) {
      keyOfComponent.set(name, existing)
      continue
    }

    const preferred = component.propsTypeName
    const key = preferred !== null && !taken.has(preferred) ? preferred : name
    taken.set(key, shape)
    entries.push({ key, props: component.props, inheritsFrom: component.inheritsFrom })
    if (named) {
      if (component.propsType) byIdentity.set(component.propsType, key)
    } else {
      byShape.set(shape, key)
    }
    keyOfComponent.set(name, key)
  }

  return { entries, keyOfComponent }
}

function emitPropsModule(subpath: string, grouped: SurfacePropTypes, components: readonly BloomComponentEntry[]): string {
  const depth = subpath.split('/').length
  const lines = [
    DO_NOT_EDIT,
    '',
    `import type { BloomSurfaceProps } from '${'../'.repeat(depth)}bloom-catalog'`,
    '',
    'export const props: BloomSurfaceProps = {',
    `  subpath: ${quote(subpath)},`,
    '  propTypes: {',
  ]
  for (const entry of grouped.entries) {
    lines.push(`    ${quote(entry.key)}: {`)
    if (entry.props.length === 0) {
      lines.push('      props: [],')
    } else {
      lines.push('      props: [')
      for (const prop of entry.props) lines.push(emitProp(prop, '        '))
      lines.push('      ],')
    }
    if (entry.inheritsFrom.length > 0) {
      lines.push(`      inheritsFrom: [${entry.inheritsFrom.map(quote).join(', ')}],`)
    }
    lines.push('    },')
  }
  lines.push('  },', '  components: [')
  for (const component of components) {
    const key = grouped.keyOfComponent.get(component.name)
    const fields = [`name: ${quote(component.name)}`]
    if (key !== undefined) fields.push(`propsType: ${quote(key)}`)
    lines.push(`    { ${fields.join(', ')} },`)
  }
  lines.push('  ],', '}', '')
  return lines.join('\n')
}

function emitIndex(
  version: string,
  categories: readonly BloomCategory[],
  surfaces: readonly BloomSurfaceEntry[],
  stats: CatalogStats,
  drift: readonly string[],
): string {
  const lines = [
    DO_NOT_EDIT,
    '//',
    `// Source: @oxy.so/bloom@${version} — its exports map, its README component`,
    '// table and its shipped .d.ts files.',
    `// ${stats.surfaces} surfaces, ${stats.components} components, ${stats.propTypes} distinct`,
    `// props types carrying ${stats.props} props`,
    `// (${stats.inheritedProps} more reach them from outside Bloom and are named`,
    '// per component as `inheritsFrom` rather than listed).',
    ...(drift.length > 0
      ? ['//', '// Upstream drift, reported rather than enforced:', ...drift.map((line) => `//   ${line}`)]
      : []),
    '',
    "import type { BloomCategory, BloomSurfaceEntry } from './bloom-catalog'",
    '',
    '/**',
    ' * The `@oxy.so/bloom` version every component page below describes.',
    ' *',
    " * The docs sidebar's version selector reads a separate typedoc sync that can",
    ' * lag the installed package by whole majors, and a reader has no way to tell',
    ' * which half of that disagreement they are looking at. This is the half that',
    ' * matches what the site actually ships.',
    ' */',
    `export const bloomVersion = ${quote(version)}`,
    '',
    "/** Bloom's component groups, in the order its README lists them. */",
    'export const bloomCategories: readonly BloomCategory[] = [',
    ...categories.map((category) => `  { name: ${quote(category.name)}, utility: ${category.utility} },`),
    ']',
    '',
    '/** Every subpath Bloom publishes types for, sorted by subpath. */',
    'export const bloomIndex: readonly BloomSurfaceEntry[] = [',
  ]

  for (const surface of surfaces) {
    lines.push(
      '  {',
      `    subpath: ${quote(surface.subpath)},`,
      `    importPath: ${quote(surface.importPath)},`,
      `    category: ${quote(surface.category)},`,
    )
    if (surface.components.length === 0) {
      lines.push('    components: [],')
    } else {
      lines.push('    components: [')
      for (const component of surface.components) {
        const fields = [`name: ${quote(component.name)}`]
        if (component.description) fields.push(`description: ${quote(component.description)}`)
        lines.push(`      { ${fields.join(', ')} },`)
      }
      lines.push('    ],')
    }
    lines.push('  },')
  }

  lines.push(']', '')

  return lines.join('\n')
}

// ------------------------------------------------------------------ build ---

export function buildBloomCatalog(options: BuildOptions = {}): BuildResult {
  const bloomDir = options.bloomDir ?? resolveInstalledBloomDir()
  const floors = options.floors ?? FLOORS

  const manifest = JSON.parse(readFileSync(join(bloomDir, 'package.json'), 'utf8')) as BloomPackage
  const table = parseComponentTable(readFileSync(join(bloomDir, 'README.md'), 'utf8'))

  // `.` is the barrel, not a surface: it re-exports everything below it.
  const subpathKeys = Object.keys(manifest.exports).filter((key) => key.startsWith('./'))

  const typesFileOf = new Map<string, string>()
  const unresolved: string[] = []
  for (const key of subpathKeys) {
    const target = typesTargetOf(manifest.exports[key])
    if (target === null) continue // an asset export, or ./package.json itself
    const file = join(bloomDir, target)
    if (!existsSync(file)) {
      unresolved.push(`${key} declares types "${target}", which does not exist`)
      continue
    }
    typesFileOf.set(key.slice(2), file)
  }

  if (unresolved.length > 0) {
    throw new Error(
      `${unresolved.length} @oxy.so/bloom export(s) declare a types path that does not resolve:\n`
      + unresolved.map((line) => `    - ${line}`).join('\n'),
    )
  }

  const subpaths = [...typesFileOf.keys()].sort()

  const uncategorised = subpaths.filter((subpath) => categoryFor(subpath, table.categoryOf) === undefined)
  const categories = uncategorised.length > 0
    ? [...table.categories, { name: UNCATEGORIZED_GROUP, utility: false }]
    : table.categories

  const program = ts.createProgram([...typesFileOf.values()], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
  })
  const checker = program.getTypeChecker()

  const surfaces: BloomSurfaceEntry[] = []
  const modules = new Map<string, string>()
  const unattributed: string[] = []
  let componentCount = 0
  let propTypeCount = 0
  let propCount = 0
  let inheritedCount = 0

  for (const subpath of subpaths) {
    const file = typesFileOf.get(subpath) as string
    const sourceFile = program.getSourceFile(file)
    if (!sourceFile) {
      throw new Error(
        `The TypeScript program did not include ${file}, declared by ./${subpath}.\n`
        + '    Every surface must be read, or its props go missing without an error.',
      )
    }

    const components = extractComponents(sourceFile, checker, bloomDir)
    const grouped = groupPropTypes(components)
    componentCount += components.length
    propTypeCount += grouped.entries.length
    for (const entry of grouped.entries) propCount += entry.props.length
    for (const component of components) {
      inheritedCount += component.omittedCount
      for (const name of component.unattributed) {
        unattributed.push(`${subpath}: ${component.entry.name}.${name}`)
      }
    }

    surfaces.push({
      subpath,
      importPath: `@oxy.so/bloom/${subpath}`,
      category: categoryFor(subpath, table.categoryOf) ?? UNCATEGORIZED_GROUP,
      components: components.map((component) => component.entry),
    })
    modules.set(
      `${subpath}.ts`,
      emitPropsModule(subpath, grouped, components.map((component) => component.entry)),
    )
  }

  // The guarantee that makes leaving props out honest. If a prop is neither
  // emitted nor covered by a name in `inheritsFrom`, a props table loses it
  // silently — which is the failure mode this whole catalog exists to end.
  if (unattributed.length > 0) {
    throw new Error(
      `${unattributed.length} prop(s) were left out with nothing to attribute them to:\n`
      + unattributed.slice(0, 20).map((line) => `    - ${line}`).join('\n')
      + '\n    Every prop Bloom does not declare must come from a type named in that'
      + "\n    component's `inheritsFrom`. Widen collectExternalBases rather than emitting"
      + '\n    a props table that quietly loses a prop.',
    )
  }

  const stats: CatalogStats = {
    surfaces: surfaces.length,
    components: componentCount,
    propTypes: propTypeCount,
    props: propCount,
    inheritedProps: inheritedCount,
  }

  if (stats.surfaces < floors.surfaces) {
    throw new Error(
      `Only ${stats.surfaces} surfaces found, below the ${floors.surfaces} floor.\n`
      + '    A walk that stops early emits a short catalog and looks healthy. Something\n'
      + "    stopped reading Bloom's exports map — fix that, do not lower the floor.",
    )
  }
  if (stats.props < floors.props) {
    throw new Error(
      `Only ${stats.props} props found, below the ${floors.props} floor.\n`
      + "    Props come from a TypeScript program over Bloom's .d.ts files; a program that\n"
      + '    resolved nothing reports every prop type as `any` and every surface as empty.',
    )
  }

  const drift: string[] = []
  if (table.claimedSubpathCount !== null && table.claimedSubpathCount !== subpathKeys.length) {
    drift.push(
      `Bloom's README says it publishes ${table.claimedSubpathCount} subpath exports; `
      + `its exports map has ${subpathKeys.length} (${stats.surfaces} of them declare types).`,
    )
  }
  if (uncategorised.length > 0) {
    drift.push(
      `${uncategorised.length} typed surface(s) are absent from Bloom's README component table and `
      + `remain visible under ${UNCATEGORIZED_GROUP}: ${uncategorised.join(', ')}.`,
    )
  }

  return {
    version: manifest.version,
    index: emitIndex(manifest.version, categories, surfaces, stats, drift),
    modules,
    stats,
    drift,
  }
}

/** Every `.ts` file under `PROPS_DIR`, relative to it, sorted. */
export function listPropModules(dir: string = PROPS_DIR): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((entry) => entry.endsWith('.ts'))
    .map((entry) => entry.split('\\').join('/'))
    .sort()
}

export interface WriteTargets {
  index?: string
  propsDir?: string
}

/**
 * Commit a build to disk.
 *
 * Removing what is no longer generated is half the job, not a tidy-up: a
 * surface Bloom dropped leaves a module that still type-checks and still ships,
 * and nothing else would ever delete it. Skip that and the validator starts
 * failing on an orphan the generator will not clear — a red gate with no fix
 * that running the generator again can reach.
 */
export function writeBloomCatalog(built: BuildResult, targets: WriteTargets = {}): void {
  const index = targets.index ?? CATALOG_PATH
  const propsDir = targets.propsDir ?? PROPS_DIR

  writeFileSync(index, built.index)
  for (const [relative, source] of built.modules) {
    const file = join(propsDir, relative)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, source)
  }
  for (const stale of listPropModules(propsDir).filter((relative) => !built.modules.has(relative))) {
    rmSync(join(propsDir, stale))
  }
}

if (import.meta.main) {
  const built = buildBloomCatalog()
  const { modules, stats, drift } = built

  writeBloomCatalog(built)

  console.log(
    `[generate-bloom-catalog] wrote ${CATALOG_PATH} and ${modules.size} prop modules`
    + ` (${stats.surfaces} surfaces, ${stats.components} components,`
    + ` ${stats.propTypes} distinct props types carrying ${stats.props} props,`
    + ` ${stats.inheritedProps} inherited and named rather than listed)`,
  )
  for (const line of drift) console.warn(`[generate-bloom-catalog] upstream drift: ${line}`)
}
