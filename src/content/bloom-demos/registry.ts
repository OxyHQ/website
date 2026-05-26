import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { PlaygroundProp, PlaygroundValues } from './_playground'

/**
 * Bloom component demo registry.
 *
 * Each component demoed in the docs has a `<Name>.tsx` file with a default
 * export (the demo) and optional `meta` + `Playground` exports, plus an
 * optional `<Name>.props.ts` file describing playground knobs.
 *
 * This module reads each via Vite's `import.meta.glob` and exposes a single
 * `bloomDemos` map keyed by the demo name (capitalized).
 *
 * Adding a new demo: drop `<MyComponent>.tsx` here. No registration step.
 */

interface DemoMeta {
  description?: string
}

export type PlaygroundPreview = ComponentType<{ values: PlaygroundValues }>

interface DemoModule {
  default: ComponentType
  meta?: DemoMeta
  Playground?: PlaygroundPreview
}

interface PropsModule {
  props: readonly PlaygroundProp[]
}

export interface BloomDemo {
  /** Capitalized component name, e.g. "Button", "TextField". */
  name: string
  /** Short description shown on hub cards and thumbnail subtitle. */
  description: string
  /** Lazy-loaded demo component. */
  Component: LazyExoticComponent<ComponentType>
  /** Optional playground prop descriptors. */
  props?: readonly PlaygroundProp[]
  /**
   * Optional live preview component for the playground.
   * Receives the current knob values and renders the underlying Bloom
   * component. Demos that opt in surface in the `/playground` page.
   */
  Playground?: PlaygroundPreview
  /** Slug for the demo's deep-link in the API docs (functions/<Name>). */
  docsSlug: string
  /** Raw source code of the demo `.tsx` file. Shown inside `<BloomDemo>`. */
  source: string
}

const demoModules = import.meta.glob<DemoModule>('./*.tsx')
const propsModules = import.meta.glob<PropsModule>('./*.props.ts', { eager: true })

// Synchronous meta scan: glob with `eager: true` gives us `meta`, `description`,
// and the optional `Playground` named export. The demo's default export still
// loads lazily via `React.lazy` to keep the main bundle small.
const eagerMeta = import.meta.glob<{
  meta?: DemoMeta
  Playground?: PlaygroundPreview
}>('./*.tsx', { eager: true })
// Raw source for each demo, used by the docs view to show "view source".
const eagerSource = import.meta.glob<string>('./*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
})

function demoNameFromPath(p: string): string | null {
  const m = p.match(/^\.\/([A-Z][^./]*)\.tsx$/)
  return m && m[1] ? m[1] : null
}

function propsNameFromPath(p: string): string | null {
  const m = p.match(/^\.\/([A-Z][^./]*)\.props\.ts$/)
  return m && m[1] ? m[1] : null
}

const propsByName = new Map<string, readonly PlaygroundProp[]>()
for (const [key, mod] of Object.entries(propsModules)) {
  const name = propsNameFromPath(key)
  if (!name) continue
  propsByName.set(name, mod.props)
}

const metaByName = new Map<string, DemoMeta>()
const playgroundByName = new Map<string, PlaygroundPreview>()
for (const [key, mod] of Object.entries(eagerMeta)) {
  const name = demoNameFromPath(key)
  if (!name) continue
  if (mod.meta) metaByName.set(name, mod.meta)
  if (mod.Playground) playgroundByName.set(name, mod.Playground)
}

const demos: BloomDemo[] = []
for (const [key, loader] of Object.entries(demoModules)) {
  const name = demoNameFromPath(key)
  if (!name) continue
  const meta = metaByName.get(name)
  demos.push({
    name,
    description: meta?.description ?? `${name} component.`,
    Component: lazy(loader),
    props: propsByName.get(name),
    Playground: playgroundByName.get(name),
    docsSlug: `api/functions/${name}`,
    source: eagerSource[key] ?? '',
  })
}

demos.sort((a, b) => a.name.localeCompare(b.name))

/** All registered Bloom demos, alphabetized by component name. */
export const bloomDemos: readonly BloomDemo[] = demos

/** Map demo name → demo. Useful for `<BloomDemo name="Button" />`. */
export const bloomDemosByName: ReadonlyMap<string, BloomDemo> = new Map(
  demos.map((d) => [d.name, d]),
)

export function getBloomDemo(name: string): BloomDemo | undefined {
  return bloomDemosByName.get(name)
}
