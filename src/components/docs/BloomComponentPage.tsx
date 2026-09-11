import { Suspense, createElement, use, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from '../../lib/navigation'
import { Button } from '@oxy.so/bloom/button'
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '@oxy.so/bloom/select'
import { Switch } from '@oxy.so/bloom/switch'
import { TextField, TextFieldInput } from '@oxy.so/bloom/text-field'
import { bloomIndex, bloomVersion } from '../../content/bloom-catalog.generated'
import { loadBloomSurfaceProps } from '../../content/bloom-catalog-loader'
import { knobFor, pascalPath } from '../../content/bloom-catalog'
import type {
  BloomKnob,
  BloomProp,
  BloomSurfaceEntry,
  BloomSurfaceProps,
} from '../../content/bloom-catalog'
import { bloomDemos, getBloomDemo } from '../../content/bloom-demos/registry'
import type { PlaygroundValue, PlaygroundValues } from '../../content/bloom-demos/_playground'
import CodeBlock from '../../content/_components/CodeBlock'
import { getPackage, resolveVersion } from '../../content/docs-loader'
import PageShell from '../layout/PageShell'
import { DocsShell } from './DocsShell'
import { buildSidebar } from './DocsPackageSidebar'

/** Where the component index lives, and what every card on it links under. */
const HUB_PATH = '/developers/docs/bloom/components'

/**
 * What these pages describe, stated on every one of them.
 *
 * The rail's version selector reads the typedoc sync, which lags the installed
 * package by whole majors — so a page that named no version at all left the
 * reader unable to tell which of the two they were reading.
 */
const EYEBROW = `Bloom ${bloomVersion}`

/**
 * The package rail both pages sit in. Bloom's docs are versioned and these
 * pages are not — they read the installed package, not a synced version — so
 * they resolve the latest version for the sidebar and show no version chrome.
 */
function bloomDocsShell() {
  const pkg = getPackage('bloom')
  const version = pkg ? resolveVersion(pkg) : undefined
  return { pkg, sections: pkg && version ? buildSidebar(pkg, version) : null }
}

/**
 * One Bloom surface: what it exports, what it looks like, and every prop it
 * declares.
 *
 * Mounts at `/developers/docs/bloom/components/<subpath>` — a splat route,
 * because three of Bloom's subpaths carry a slash (`tabs/expo-router`).
 *
 * Everything on the page comes from the generated catalog: the props from
 * `loadBloomSurfaceProps`, the controls from `knobFor`, the grouping from the
 * fact that a props list is stored once per TYPE. The one hand-written input is
 * the demo, and 16 of Bloom's 87 surfaces have one.
 */
export default function BloomComponentPage() {
  const params = useParams()
  const subpath = (params['*'] ?? '').replace(/^\/+|\/+$/g, '')
  const entry = bloomIndex.find((surface) => surface.subpath === subpath)
  const { pkg, sections } = bloomDocsShell()

  if (!entry) {
    return (
      <PageShell
        className="docs-theme bg-background"
        seo={{
          title: 'Bloom component not found',
          description: 'Browse the Bloom component index to find the published surface you need.',
          canonicalPath: HUB_PATH,
        }}
        mainClassName="flex-1 bg-background text-muted-foreground"
        mainAsDiv
      >
        <DocsShell
          sections={sections}
          eyebrow={EYEBROW}
          title="No such surface"
          activePkg={pkg ?? undefined}
        >
          <div className="not-prose flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 text-sm text-muted-foreground">
            <p>
              Bloom publishes no export called <code className="font-mono text-foreground">{subpath}</code>.
              Its {bloomIndex.length} documented subpaths are named after what you import from —{' '}
              <code className="font-mono text-foreground">button</code>,{' '}
              <code className="font-mono text-foreground">text-field</code>,{' '}
              <code className="font-mono text-foreground">tabs/expo-router</code>.
            </p>
            <p>
              <Link className="text-primary hover:underline" to={HUB_PATH}>
                Back to the component index
              </Link>
            </p>
          </div>
        </DocsShell>
      </PageShell>
    )
  }

  const surfaceName = pascalPath(entry.subpath)
  const description = entry.components.find((component) => component.name === surfaceName)?.description

  return (
    <PageShell
      className="docs-theme bg-background"
      seo={{
        title: `${surfaceName} · Bloom components`,
        description: description ?? `Explore ${surfaceName} exports, props and live examples in Bloom.`,
        canonicalPath: `${HUB_PATH}/${entry.subpath}`,
      }}
      mainClassName="flex-1 bg-background text-muted-foreground"
      mainAsDiv
    >
      <DocsShell
        sections={sections}
        eyebrow={EYEBROW}
        title={surfaceName}
        subtitle={description ?? entry.category}
        activePkg={pkg ?? undefined}
      >
        <div className="not-prose flex flex-col gap-12">
          <nav className="flex flex-wrap gap-6" aria-label="Component tools">
            <Link className="oxy-link" to={HUB_PATH}>All components</Link>
            {getBloomDemo(pascalPath(entry.subpath)) && <Link className="oxy-link" to={`/developers/docs/bloom/playground?component=${encodeURIComponent(pascalPath(entry.subpath))}`}>Try in playground</Link>}
          </nav>
          <Suspense
            fallback={<p className="text-sm text-muted-foreground">Loading the props for {entry.importPath}…</p>}
          >
            <SurfaceBody key={entry.subpath} entry={entry} />
          </Suspense>
        </div>
      </DocsShell>
    </PageShell>
  )
}

/** An `id` a heading can be linked at, and the contents rail can list. */
function slugId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * One promise per surface, so `use()` below is handed the same one on every
 * render. `loadBloomSurfaceProps` returns a fresh promise per call, and a
 * fresh promise is a fresh suspension — the render would never settle.
 */
const surfacePropsBySubpath = new Map<string, Promise<BloomSurfaceProps>>()

function surfacePropsFor(subpath: string): Promise<BloomSurfaceProps> {
  const cached = surfacePropsBySubpath.get(subpath)
  if (cached) return cached
  const pending = loadBloomSurfaceProps(subpath)
  surfacePropsBySubpath.set(subpath, pending)
  return pending
}

/** One props type, and the components on this surface that take it. */
interface PropsGroup {
  /** Key into `propTypes` — a type name, or a component name used as a handle. */
  key: string
  /** The components that share it, in export order. */
  names: string[]
  /**
   * True when the key is itself a component name on this surface. Bloom writes
   * those props inline, with no type name to take, so the key is a grouping
   * handle rather than a type a reader could look up.
   */
  handle: boolean
}

/**
 * Fold the surface's components onto the props types they share.
 *
 * This is the fact the catalog stores and the old docs hid: ten of Bloom's
 * button components take one props list, not ten identical ones.
 */
function groupByPropsType(surface: BloomSurfaceProps): {
  groups: PropsGroup[]
  withoutProps: string[]
} {
  const order: string[] = []
  const namesByKey = new Map<string, string[]>()
  const withoutProps: string[] = []
  for (const component of surface.components) {
    if (!component.propsType) {
      withoutProps.push(component.name)
      continue
    }
    const names = namesByKey.get(component.propsType)
    if (names) {
      names.push(component.name)
      continue
    }
    namesByKey.set(component.propsType, [component.name])
    order.push(component.propsType)
  }
  const componentNames = new Set(surface.components.map((component) => component.name))
  return {
    groups: order.map((key) => ({
      key,
      names: namesByKey.get(key) ?? [],
      handle: componentNames.has(key),
    })),
    withoutProps,
  }
}

/**
 * The import line and the element the controls currently describe — the same
 * `values` the preview is rendered with, spelled as code.
 */
function usageSnippet(
  importPath: string,
  componentName: string,
  props: readonly BloomProp[],
  values: PlaygroundValues,
): string {
  const attributes = props.flatMap((prop) => {
    const value: PlaygroundValue | undefined = values[prop.name]
    if (value === undefined) return []
    if (typeof value === 'boolean') return value ? [prop.name] : []
    if (typeof value === 'number') return [`${prop.name}={${value}}`]
    return [value.includes('"') ? `${prop.name}={${JSON.stringify(value)}}` : `${prop.name}="${value}"`]
  })
  const importLine = `import { ${componentName} } from '${importPath}'`
  const oneLine = `<${componentName}${attributes.map((attribute) => ` ${attribute}`).join('')} />`
  const element =
    oneLine.length <= 72
      ? oneLine
      : `<${componentName}\n${attributes.map((attribute) => `  ${attribute}`).join('\n')}\n/>`
  return `${importLine}\n\n${element}`
}

function SurfaceBody({ entry }: { entry: BloomSurfaceEntry }) {
  const surface = use(surfacePropsFor(entry.subpath))
  const [values, setValues] = useState<PlaygroundValues>({})

  const surfaceName = pascalPath(entry.subpath)
  const demo = getBloomDemo(surfaceName)
  // The principal export is the one named after the surface; where Bloom names
  // none (`skeleton` exports `Pill`, `Circle`, …), the first export leads.
  const principal =
    surface.components.find((component) => component.name === surfaceName) ?? surface.components[0]
  const principalProps = principal?.propsType ? surface.propTypes[principal.propsType]?.props ?? [] : []
  const controls = principalProps.flatMap((prop) => {
    const knob = knobFor(prop)
    return knob ? [{ prop, knob }] : []
  })
  const { groups, withoutProps } = groupByPropsType(surface)
  const descriptions = new Map(
    entry.components.flatMap((component) =>
      component.description ? [[component.name, component.description] as const] : [],
    ),
  )

  const setValue = (name: string, value: PlaygroundValue | undefined) => {
    setValues((previous) => {
      const next = { ...previous }
      if (value === undefined) {
        delete next[name]
      } else {
        next[name] = value
      }
      return next
    })
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 id="preview" className="text-xl font-semibold text-foreground">
          Preview
        </h2>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">
              <span>{demo ? 'Live demo' : 'No demo'}</span>
              <span className="font-mono normal-case tracking-normal">{entry.importPath}</span>
            </header>
            <div className="flex min-h-[240px] items-center justify-center p-8">
              {demo ? (
                <Suspense fallback={null}>
                  {demo.Playground
                    ? createElement(demo.Playground, { values })
                    : createElement(demo.Component)}
                </Suspense>
              ) : (
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  Nobody has written a demo for this surface yet — {bloomDemos.length} of Bloom&apos;s{' '}
                  {bloomIndex.length} surfaces have one. Everything below is read from the types Bloom
                  ships, demo or no demo.
                </p>
              )}
            </div>
          </div>
          {principal && controls.length > 0 ? (
            <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  <code className="font-mono">{principal.name}</code> props
                </h3>
                {Object.keys(values).length > 0 ? (
                  <Button variant="text" size="small" onPress={() => setValues({})}>
                    Reset
                  </Button>
                ) : null}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {demo
                  ? 'Every value writes the snippet below. The preview is a hand-written demo, so it moves for the props it renders.'
                  : 'Every value writes the snippet below.'}
              </p>
              {/*
                Bloom declares 30 props on a button, and the list is the
                surface's own — so the panel scrolls rather than pushing the
                preview it drives off the screen.
              */}
              <div className="flex flex-col gap-4 lg:max-h-[26rem] lg:overflow-y-auto lg:pr-1">
                {controls.map(({ prop, knob }) => (
                  <PropControl
                    key={prop.name}
                    prop={prop}
                    knob={knob}
                    value={values[prop.name]}
                    onChange={setValue}
                  />
                ))}
              </div>
            </aside>
          ) : null}
        </div>
        {principal ? (
          <CodeBlock language="tsx" filename={entry.importPath}>
            {usageSnippet(entry.importPath, principal.name, principalProps, values)}
          </CodeBlock>
        ) : (
          <p className="text-sm text-muted-foreground">
            <code className="font-mono text-foreground">{entry.importPath}</code> exports no
            components — it publishes hooks, tokens or presets, and has no props to document.
          </p>
        )}
      </section>

      {groups.length > 0 || withoutProps.length > 0 ? (
        <section className="flex flex-col gap-8">
          <h2 id="props" className="text-xl font-semibold text-foreground">
            Props
          </h2>
          {groups.map((group) => {
            const propType = surface.propTypes[group.key]
            return (
              <div key={group.key} className="flex flex-col gap-3">
                <h3
                  id={`props-${slugId(group.key)}`}
                  className="font-mono text-base font-semibold text-foreground [overflow-wrap:anywhere]"
                >
                  {group.handle ? group.names.join(', ') : group.key}
                </h3>
                {group.handle ? null : (
                  <p className="text-sm text-muted-foreground">
                    {group.names.length > 1
                      ? `${group.names.length} components take these props: ${group.names.join(', ')}.`
                      : `The props of ${group.names[0]}.`}
                  </p>
                )}
                {group.names.map((name) => {
                  const componentDescription = descriptions.get(name)
                  return componentDescription ? (
                    <p key={name} className="text-sm text-muted-foreground">
                      <code className="font-mono text-foreground">{name}</code> —{' '}
                      <PropDescription text={componentDescription} />
                    </p>
                  ) : null
                })}
                {propType && propType.props.length > 0 ? (
                  <PropsTable props={propType.props} />
                ) : (
                  <p className="text-sm text-muted-foreground">Declares no props of its own.</p>
                )}
                {propType?.inheritsFrom ? (
                  <p className="text-sm text-muted-foreground">
                    Plus everything from{' '}
                    {propType.inheritsFrom.map((inherited, index) => (
                      <span key={inherited}>
                        {index > 0 ? ' and ' : null}
                        <code className="font-mono text-foreground [overflow-wrap:anywhere]">
                          {inherited}
                        </code>
                      </span>
                    ))}
                    , which Bloom inherits rather than declares.
                  </p>
                ) : null}
              </div>
            )
          })}
          {withoutProps.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h3
                id="props-none"
                className="font-mono text-base font-semibold text-foreground [overflow-wrap:anywhere]"
              >
                {withoutProps.join(', ')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {withoutProps.length > 1 ? 'These take no props' : 'Takes no props'} — neither its own
                nor inherited.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  )
}

function PropControl({
  prop,
  knob,
  value,
  onChange,
}: {
  prop: BloomProp
  knob: BloomKnob
  value: PlaygroundValue | undefined
  onChange: (name: string, value: PlaygroundValue | undefined) => void
}) {
  if (knob.kind === 'boolean') {
    return (
      <div className="flex items-center justify-between gap-3">
        <PropControlLabel prop={prop} />
        <Switch
          value={value === true}
          onValueChange={(next) => onChange(prop.name, next ? true : undefined)}
          accessibilityLabel={prop.name}
          size="sm"
        />
      </div>
    )
  }
  if (knob.kind === 'select') {
    return (
      <div className="flex flex-col gap-1">
        <PropControlLabel prop={prop} />
        <Select
          value={typeof value === 'string' ? value : undefined}
          onValueChange={(next) => onChange(prop.name, next)}
        >
          <SelectTrigger label={prop.name}>
            <SelectValue placeholder="unset">
              {() => (typeof value === 'string' ? value : 'unset')}
            </SelectValue>
            <SelectIcon />
          </SelectTrigger>
          <SelectContent
            label={prop.name}
            items={knob.options.map((option) => ({ value: option, label: option }))}
            renderItem={(item) => (
              <SelectItem value={item.value} label={item.label}>
                <SelectItemText>{item.label}</SelectItemText>
                <SelectItemIndicator />
              </SelectItem>
            )}
          />
        </Select>
      </div>
    )
  }
  const numeric = knob.kind === 'number'
  return (
    <div className="flex flex-col gap-1">
      <PropControlLabel prop={prop} />
      <TextField>
        <TextFieldInput
          label={prop.name}
          value={value === undefined ? '' : String(value)}
          inputMode={numeric ? 'numeric' : 'text'}
          placeholder="unset"
          onChangeText={(text) => {
            if (text === '') {
              onChange(prop.name, undefined)
              return
            }
            if (!numeric) {
              onChange(prop.name, text)
              return
            }
            const parsed = Number(text)
            onChange(prop.name, Number.isFinite(parsed) ? parsed : undefined)
          }}
        />
      </TextField>
    </div>
  )
}

function PropControlLabel({ prop }: { prop: BloomProp }) {
  return (
    <span className="font-mono text-xs text-muted-foreground">
      {prop.name}
      {prop.optional ? null : <span className="text-warning-text"> *</span>}
    </span>
  )
}

function PropsTable({ props }: { props: readonly BloomProp[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2 font-medium">Prop</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-b border-border/60 last:border-b-0">
              {/* `w-px` + `nowrap`: the column hugs the longest prop name
                  rather than hyphenating `accessibilityLabel` over three lines. */}
              <td className="w-px whitespace-nowrap px-4 py-3 align-top">
                <code className="font-mono text-[13px] text-foreground">{prop.name}</code>
                {prop.optional ? null : (
                  <span className="ml-2 rounded-full bg-warning-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning-text">
                    required
                  </span>
                )}
              </td>
              {/* Wide enough that `StyleProp<ViewStyle>` stays on one line,
                  capped so Bloom's inline object types cannot take the row. */}
              <td className="min-w-[13rem] max-w-sm px-4 py-3 align-top">
                <PropType prop={prop} />
              </td>
              <td className="px-4 py-3 align-top text-muted-foreground">
                {prop.description ? <PropDescription text={prop.description} /> : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PropType({ prop }: { prop: BloomProp }) {
  // A prop declared as its own literal union already reads as its members, so
  // printing both the type and the chips would say it twice.
  const declaredAsUnion = prop.type.trimStart().startsWith("'")
  return (
    <div className="flex flex-col gap-1.5">
      {prop.options && declaredAsUnion ? null : (
        <code className="font-mono text-[13px] text-foreground [overflow-wrap:anywhere]">
          {prop.type}
        </code>
      )}
      {prop.options ? (
        <div className="flex flex-wrap gap-1">
          {prop.options.map((option) => (
            <code
              key={option}
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
            >
              {option}
            </code>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * A JSDoc paragraph, with its `backticked` spans rendered as code — 179 of the
 * catalog's 521 descriptions carry them, and raw backticks read as a typo.
 */
function PropDescription({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, index) =>
        index % 2 === 1 ? (
          <code
            key={index}
            className="rounded bg-muted px-1 py-0.5 font-mono text-[12px] text-foreground"
          >
            {part}
          </code>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}
