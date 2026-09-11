import { Suspense, createElement, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link } from '../../lib/navigation'
import { TextButton } from '@oxy.so/bloom/button'
import { bloomDemos, getBloomDemo } from '../../content/bloom-demos/registry'
import { defaultValues, type PlaygroundValues } from '../../content/bloom-demos/_playground'
import { bloomVersion } from '../../content/bloom-catalog.generated'
import PageShell from '../layout/PageShell'
import { DocsShell } from './DocsShell'
import { BloomLiveEditor } from './BloomLiveEditor'
import { BloomLivePreview } from './BloomLivePreview'
import { APP_COLOR_NAMES, type AppColorName } from '@oxy.so/bloom/color-presets'

/** The standalone canvas owns its Bloom provider. Recipe changes never write
 * over the theme of the surrounding website. */
export default function BloomPlayground() {
  const [params, setParams] = useSearchParams()
  const selected = getBloomDemo(params.get('component') ?? 'Button') ?? bloomDemos[0]
  const presetValue = params.get('recipe') ?? 'oxy'
  const preset: AppColorName = APP_COLOR_NAMES.includes(presetValue as AppColorName)
    ? (presetValue as AppColorName)
    : 'oxy'
  const mode = params.get('mode') === 'dark' ? 'dark' : 'light'
  const [query, setQuery] = useState('')
  const [values, setValues] = useState<PlaygroundValues>(() => defaultValues(selected?.props ?? []))
  const [source, setSource] = useState(selected?.source ?? '')
  const [editing, setEditing] = useState(false)
  const [width, setWidth] = useState('full')
  const [lastName, setLastName] = useState(selected?.name)
  if (lastName !== selected?.name) {
    setLastName(selected?.name)
    setValues(defaultValues(selected?.props ?? []))
    setSource(selected?.source ?? '')
    setEditing(false)
  }
  const update = (key: string, value: string) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.set(key, value)
        return next
      },
      { replace: true },
    )
  const reset = () => {
    setValues(defaultValues(selected?.props ?? []))
    setSource(selected?.source ?? '')
    setEditing(false)
  }
  const matches = bloomDemos.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
  if (!selected) return null
  return (
    <PageShell
      className="docs-theme bg-background"
      seo={{
        title: 'Bloom playground',
        description:
          'Explore Bloom components, change their properties and try colour recipes on a live canvas.',
        canonicalPath: '/developers/docs/bloom/playground',
      }}
      mainAsDiv
    >
      <DocsShell
        sections={null}
        hideSidebar
        wideContent
        eyebrow={`Bloom ${bloomVersion}`}
        title="Playground"
        subtitle="Choose a component. Make it yours."
        versionAgnostic
      >
        <div className="not-prose space-y-6">
          <div className="bloom-toolbar flex flex-wrap items-end gap-4">
            <Link className="oxy-link mr-auto" to="/developers/docs/bloom/components">
              All components
            </Link>
            <label className="grid gap-2 text-sm">
              Recipe
              <select
                aria-label="Recipe"
                value={preset}
                onChange={(e) => update('recipe', e.target.value)}
              >
                {APP_COLOR_NAMES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              Appearance
              <select
                aria-label="Appearance"
                value={mode}
                onChange={(e) => update('mode', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              Canvas
              <select aria-label="Canvas" value={width} onChange={(e) => setWidth(e.target.value)}>
                <option value="full">Responsive</option>
                <option value="390">Mobile · 390 px</option>
                <option value="768">Tablet · 768 px</option>
              </select>
            </label>
            <TextButton onPress={reset}>Reset example</TextButton>
          </div>
          <div className="bloom-workbench">
            <aside
              className="bloom-workbench-rail bloom-workbench-library border-b border-border xl:border-r xl:border-b-0"
              aria-label="Component library"
            >
              <label className="mb-4 grid gap-2 text-sm">
                Find a component
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search components"
                />
              </label>
              <div className="flex flex-wrap gap-1 xl:flex-col">
                {matches.map((d) => (
                  <button
                    key={d.name}
                    aria-pressed={selected.name === d.name}
                    onClick={() => update('component', d.name)}
                    className={`rounded-lg px-3 py-3 text-left text-sm ${selected.name === d.name ? 'bg-primary text-primary-foreground' : 'hover:bg-primary-subtle'}`}
                  >
                    {d.name}
                  </button>
                ))}
                {!matches.length && <p className="text-sm p-3">No components match your search.</p>}
              </div>
            </aside>
            <div className="min-w-0 bg-surface p-3 md:p-6">
              <div className="mb-4 flex flex-wrap justify-between gap-2 text-sm">
                <h2 className="font-semibold">{selected.name}</h2>
                <span>{editing ? 'Code preview' : 'Interactive preview'}</span>
              </div>
              <div
                style={{ maxWidth: width === 'full' ? undefined : Number(width) }}
                className="mx-auto w-full"
              >
                <BloomLivePreview
                  source={editing ? source : undefined}
                  demo={selected.name}
                  values={values}
                  preset={preset}
                  mode={mode}
                />
              </div>
            </div>
            <aside
              className="bloom-workbench-rail border-t border-border sm:border-l sm:border-t-0"
              aria-label="Component properties"
            >
              <h2 className="mb-6 font-semibold">Properties</h2>
              {editing ? (
                <p className="text-sm leading-relaxed">
                  You are editing the example's code. Reset the example to use the property controls
                  again.
                </p>
              ) : (
                <div className="space-y-5">
                  {selected.props?.map((prop) => (
                    <label key={prop.name} className="grid gap-2 text-sm">
                      <span>{prop.name}</span>
                      {prop.kind === 'select' ? (
                        <select
                          aria-label={prop.name}
                          value={String(values[prop.name])}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [prop.name]: e.target.value }))
                          }
                        >
                          {prop.options.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      ) : prop.kind === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={values[prop.name] === true}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [prop.name]: e.target.checked }))
                          }
                        />
                      ) : (
                        <input
                          type={prop.kind === 'number' ? 'number' : 'text'}
                          value={String(values[prop.name] ?? '')}
                          {...(prop.kind === 'number'
                            ? { min: prop.min, max: prop.max, step: prop.step }
                            : {})}
                          onChange={(e) =>
                            setValues((v) => ({
                              ...v,
                              [prop.name]:
                                prop.kind === 'number' ? Number(e.target.value) : e.target.value,
                            }))
                          }
                        />
                      )}
                    </label>
                  ))}
                  {!selected.props?.length && (
                    <p className="text-sm">
                      This example has no configurable properties. Try the component on the canvas
                      or edit its source.
                    </p>
                  )}
                </div>
              )}
            </aside>
          </div>
          <details className="rounded-2xl border border-border p-5">
            <summary className="cursor-pointer text-base font-semibold">Example source</summary>
            <p className="my-4 text-sm text-muted-foreground">
              The complete component example. Editing starts from this example; changes in the
              property inspector are independent.
            </p>
            <BloomLiveEditor
              value={source}
              onChange={(value) => {
                setSource(value)
                setEditing(true)
              }}
              label="Bloom example source"
            />
          </details>
          <details className="rounded-2xl border border-border p-5">
            <summary className="cursor-pointer text-base font-semibold">All variants</summary>
            <div className="py-8">
              <Suspense fallback={<p>Loading examples…</p>}>
                {createElement(selected.Component)}
              </Suspense>
            </div>
          </details>
        </div>
      </DocsShell>
    </PageShell>
  )
}
