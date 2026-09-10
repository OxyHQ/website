import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { TextButton } from '@oxy.so/bloom/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
} from '@oxy.so/bloom/select'
import { bloomDemos, getBloomDemo } from '../../content/bloom-demos/registry'
import { getPackage, resolveVersion } from '../../content/docs-loader'
import PageShell from '../layout/PageShell'
import { DocsShell } from './DocsShell'
import { buildSidebar } from './DocsPackageSidebar'
import { BloomLiveEditor } from './BloomLiveEditor'
import { BloomLivePreview } from './BloomLivePreview'

/**
 * Live editor for Bloom, at `/developers/docs/bloom/:version/playground`.
 *
 * The reader edits a file and watches it render. The picker seeds that file
 * with a demo's own source — the same `.tsx` the docs show elsewhere, imports
 * and `export default` included — so what is on screen is always something
 * that would compile in an app, and editing starts from working code rather
 * than a blank box.
 */

interface DemoOption {
  value: string
  label: string
}

const DEMO_OPTIONS: readonly DemoOption[] = bloomDemos.map((demo) => ({
  value: demo.name,
  label: demo.name,
}))

export default function BloomPlayground() {
  const params = useParams<{ version?: string }>()
  const pkg = getPackage('bloom')
  const resolvedVersion = pkg ? resolveVersion(pkg, params.version) : undefined
  const versionString =
    resolvedVersion?.version ?? pkg?.latestVersion ?? params.version ?? 'main'
  const sections = pkg && resolvedVersion ? buildSidebar(pkg, resolvedVersion) : null

  const firstDemo = bloomDemos[0]
  const [selected, setSelected] = useState(firstDemo?.name ?? '')
  const [source, setSource] = useState(firstDemo?.source ?? '')

  const seedFrom = (name: string) => {
    setSelected(name)
    setSource(getBloomDemo(name)?.source ?? '')
  }

  return (
    <PageShell
      className="docs-theme bg-background"
      seo={{
        title: 'Bloom component playground',
        description: 'Edit Bloom component code and watch it render live in your browser.',
        canonicalPath: '/developers/docs/bloom/playground',
      }}
      mainClassName="flex-1 bg-background text-muted-foreground"
      mainAsDiv
    >
      <DocsShell
        sections={sections}
        eyebrow="Bloom"
        title="Playground"
        subtitle="Edit the code and watch it render. It compiles in your browser."
        pkg={pkg ?? undefined}
        currentVersion={versionString}
        slug="playground"
        activePkg={pkg ?? undefined}
        versionAgnostic
      >
        <div className="not-prose flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Start from
              </span>
              <DemoPicker value={selected} onChange={seedFrom} />
            </div>
            <TextButton onPress={() => seedFrom(selected)}>Reset</TextButton>
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <BloomLiveEditor value={source} onChange={setSource} label="Bloom snippet source" />
            <BloomLivePreview source={source} />
          </div>
        </div>
      </DocsShell>
    </PageShell>
  )
}

function DemoPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div style={{ maxWidth: 320 }}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger label="Component">
          {/* Every option's label IS its value, so the trigger can render the
              value it was given. `SelectValue`'s default reads the selected
              ITEM, which the content has not registered until the dropdown has
              been opened once — that is a placeholder on first paint. */}
          <SelectValue placeholder="Select component">{() => value}</SelectValue>
          <SelectIcon />
        </SelectTrigger>
        <SelectContent
          items={[...DEMO_OPTIONS]}
          label="Component"
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
