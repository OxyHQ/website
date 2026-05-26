import { Suspense, createElement, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Switch } from '@oxyhq/bloom/switch'
import * as Select from '@oxyhq/bloom/select'
import { bloomDemos, getBloomDemo, type BloomDemo } from '../../content/bloom-demos/registry'
import {
  defaultValues,
  type PlaygroundProp,
  type PlaygroundValue,
  type PlaygroundValues,
} from '../../content/bloom-demos/_playground'
import { getPackage, resolveVersion } from '../../content/docs-loader'
import { DocsShell } from './DocsShell'
import { buildSidebar } from './DocsPackageSidebar'

/**
 * Interactive playground for Bloom components.
 *
 * Mounts at `/developers/docs/bloom/:version/playground`. Surfaces every
 * registered Bloom demo that opts into the playground (by exporting a
 * `Playground` named function from its demo file) and offers a live prop
 * editor next to a rendered preview + generated code snippet.
 */
export default function BloomPlayground() {
  const params = useParams<{ version?: string }>()
  const pkg = getPackage('bloom')
  const resolvedVersion = pkg ? resolveVersion(pkg, params.version) : undefined
  const versionString = resolvedVersion?.version ?? pkg?.latestVersion ?? params.version ?? 'main'

  const interactiveDemos = useMemo(
    () => bloomDemos.filter((d) => Boolean(d.Playground) && Boolean(d.props && d.props.length > 0)),
    [],
  )
  const initialName = interactiveDemos[0]?.name ?? bloomDemos[0]?.name ?? ''
  const [selected, setSelected] = useState(initialName)

  const sections = pkg && resolvedVersion ? buildSidebar(pkg, resolvedVersion) : null

  const activeDemo = getBloomDemo(selected)
  const demoOptions = useMemo(
    () =>
      interactiveDemos.map((d) => ({
        value: d.name,
        label: d.name,
      })),
    [interactiveDemos],
  )

  return (
    <DocsShell
      sections={sections}
      eyebrow="Bloom"
      title="Playground"
      subtitle="Pick a component and tweak its props to see the live preview update."
      pkg={pkg ?? undefined}
      currentVersion={versionString}
      slug="playground"
      activePkg={pkg ?? undefined}
    >
      <div className="not-prose flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Component
          </span>
          <DemoPicker
            value={selected}
            options={demoOptions}
            onChange={(next) => setSelected(next)}
          />
        </div>
        {activeDemo ? (
          <PlaygroundBody demo={activeDemo} />
        ) : (
          <EmptyState />
        )}
      </div>
    </DocsShell>
  )
}

interface DemoPickerOption {
  value: string
  label: string
}

function DemoPicker({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly DemoPickerOption[]
  onChange: (value: string) => void
}) {
  return (
    <div style={{ maxWidth: 320 }}>
      <Select.Root value={value} onValueChange={onChange}>
        <Select.Trigger label="Component">
          <Select.ValueText placeholder="Select component">
            {(selected) =>
              selected && typeof selected === 'object' && 'label' in selected
                ? (selected as DemoPickerOption).label
                : 'Select component'
            }
          </Select.ValueText>
          <Select.Icon />
        </Select.Trigger>
        <Select.Content
          items={[...options]}
          label="Component"
          renderItem={(item) => (
            <Select.Item value={item.value} label={item.label}>
              <Select.ItemText>{item.label}</Select.ItemText>
              <Select.ItemIndicator />
            </Select.Item>
          )}
        />
      </Select.Root>
    </div>
  )
}

const EMPTY_PROPS: readonly PlaygroundProp[] = []

function PlaygroundBody({ demo }: { demo: BloomDemo }) {
  // Stable reference for the props list — `demo.props` is undefined for demos
  // without a knob descriptor file. Falling back to a module-level constant
  // (rather than `demo.props ?? []`) keeps the array identity stable across
  // renders so memoization hooks downstream don't churn.
  const props = demo.props ?? EMPTY_PROPS
  // Reset values whenever the demo identity changes. Derived-state pattern
  // mirrors the demo's name into a local slot so we only recompute when it
  // actually flips (not on every render).
  const [lastName, setLastName] = useState(demo.name)
  const [values, setValues] = useState<PlaygroundValues>(() => defaultValues(props))
  if (lastName !== demo.name) {
    setLastName(demo.name)
    setValues(defaultValues(props))
  }

  const updateValue = (name: string, value: PlaygroundValue) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const code = useMemo(() => buildCodeSnippet(demo.name, props, values), [demo.name, props, values])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">
            <span>Preview</span>
            <span className="font-mono normal-case tracking-normal">{demo.name}</span>
          </header>
          <div className="flex min-h-[220px] items-center justify-center p-8">
            {demo.Playground ? (
              <Suspense fallback={null}>
                {createElement(demo.Playground, { values })}
              </Suspense>
            ) : (
              <p className="text-sm text-muted-foreground">
                This demo doesn't expose a Playground export yet.
              </p>
            )}
          </div>
          <details className="group border-t border-border bg-surface">
            <summary className="cursor-pointer select-none px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
              <span className="group-open:hidden">Show source</span>
              <span className="hidden group-open:inline">Hide source</span>
            </summary>
            <pre className="overflow-x-auto border-t border-border bg-background px-4 py-3 text-xs leading-relaxed text-foreground">
              <code className="font-mono">{code}</code>
            </pre>
          </details>
        </div>
      </div>
      <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">Props</h2>
        <PropControls props={props} values={values} onChange={updateValue} />
      </aside>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted-foreground">
      No interactive playground demos registered yet. Drop a
      <code className="mx-1 font-mono">Playground</code>
      export into a
      <code className="ml-1 font-mono">src/content/bloom-demos/&lt;Name&gt;.tsx</code>
      file to surface it here.
    </div>
  )
}

interface PropControlsProps {
  props: readonly PlaygroundProp[]
  values: PlaygroundValues
  onChange: (name: string, value: PlaygroundValue) => void
}

function PropControls({ props, values, onChange }: PropControlsProps) {
  if (props.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">This component has no playground knobs.</p>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      {props.map((prop) => (
        <PropControl key={prop.name} prop={prop} value={values[prop.name]} onChange={onChange} />
      ))}
    </div>
  )
}

interface PropControlProps {
  prop: PlaygroundProp
  value: PlaygroundValue | undefined
  onChange: (name: string, value: PlaygroundValue) => void
}

function PropControl({ prop, value, onChange }: PropControlProps) {
  if (prop.kind === 'boolean') {
    const checked = value === true
    return (
      <label className="flex items-center justify-between gap-3 text-sm text-foreground">
        <span className="font-mono text-xs text-muted-foreground">{prop.name}</span>
        <Switch value={checked} onValueChange={(next) => onChange(prop.name, next)} size="sm" />
      </label>
    )
  }
  if (prop.kind === 'select') {
    const current = typeof value === 'string' ? value : prop.default
    return (
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs text-muted-foreground">{prop.name}</span>
        <Select.Root value={current} onValueChange={(next) => onChange(prop.name, next)}>
          <Select.Trigger label={prop.name}>
            <Select.ValueText placeholder={prop.name}>{() => current}</Select.ValueText>
            <Select.Icon />
          </Select.Trigger>
          <Select.Content
            label={prop.name}
            items={prop.options.map((opt) => ({ value: opt, label: opt }))}
            renderItem={(item) => (
              <Select.Item value={item.value} label={item.label}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            )}
          />
        </Select.Root>
      </div>
    )
  }
  if (prop.kind === 'number') {
    const current = typeof value === 'number' ? value : prop.default
    return (
      <label className="flex flex-col gap-1 text-sm text-foreground">
        <span className="font-mono text-xs text-muted-foreground">{prop.name}</span>
        <input
          type="number"
          value={current}
          min={prop.min}
          max={prop.max}
          step={prop.step ?? 1}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (Number.isFinite(n)) onChange(prop.name, n)
          }}
          className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
        />
      </label>
    )
  }
  // text
  const current = typeof value === 'string' ? value : prop.default
  return (
    <label className="flex flex-col gap-1 text-sm text-foreground">
      <span className="font-mono text-xs text-muted-foreground">{prop.name}</span>
      <input
        type="text"
        value={current}
        onChange={(e) => onChange(prop.name, e.target.value)}
        className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
      />
    </label>
  )
}

/**
 * Serialize the current knob state to a JSX-ish snippet. This is a best-
 * effort reflection — components with structured children render with the
 * relevant text props as JSX attributes. Good enough for "copy what I see".
 */
function buildCodeSnippet(
  name: string,
  props: readonly PlaygroundProp[],
  values: PlaygroundValues,
): string {
  const attrs: string[] = []
  let inner = ''
  for (const prop of props) {
    const v = values[prop.name]
    if (v === undefined || v === prop.default || v === '') continue
    if (prop.name === 'children') {
      inner = String(v)
      continue
    }
    if (prop.name === 'body') continue
    if (typeof v === 'boolean') {
      if (v) attrs.push(prop.name)
      continue
    }
    if (typeof v === 'number') {
      attrs.push(`${prop.name}={${v}}`)
      continue
    }
    attrs.push(`${prop.name}="${String(v).replace(/"/g, '\\"')}"`)
  }
  const attrsStr = attrs.length ? ` ${attrs.join(' ')}` : ''
  if (inner) {
    return `<${name}${attrsStr}>${inner}</${name}>`
  }
  return `<${name}${attrsStr} />`
}
