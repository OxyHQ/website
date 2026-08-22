import { useParams } from 'react-router-dom'
import { getPackage, resolveVersion } from '../../content/docs-loader'
import PageShell from '../layout/PageShell'
import ColorSystemPlayground from './ColorSystemPlayground'
import { DocsShell } from './DocsShell'
import { buildSidebar } from './DocsPackageSidebar'

/** Public Bloom colour laboratory, hosted inside the complete Website chrome. */
export default function BloomColorSystemPage() {
  const params = useParams<{ version?: string }>()
  const pkg = getPackage('bloom')
  const resolvedVersion = pkg ? resolveVersion(pkg, params.version) : undefined
  const versionString = resolvedVersion?.version ?? pkg?.latestVersion ?? params.version ?? 'main'
  const sections = pkg && resolvedVersion ? buildSidebar(pkg, resolvedVersion) : null

  return (
    <PageShell
      className="docs-theme bg-background"
      seo={{
        title: 'Bloom color system playground',
        description: 'Compare every Bloom color combination across light and dark Mention interfaces.',
        canonicalPath: '/developers/docs/bloom/color-system',
      }}
      mainClassName="flex-1 bg-background text-muted-foreground"
      mainAsDiv
    >
      <DocsShell
        sections={sections}
        eyebrow="Bloom"
        title="Color system playground"
        subtitle="Compare identity, support and action colors in a complete product interface."
        pkg={pkg ?? undefined}
        currentVersion={versionString}
        slug="color-system"
        activePkg={pkg ?? undefined}
        wideContent
        versionAgnostic
      >
        <div className="not-prose rounded-[2rem]">
          <ColorSystemPlayground />
        </div>
      </DocsShell>
    </PageShell>
  )
}
