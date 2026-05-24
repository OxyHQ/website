import { Link } from 'react-router-dom'
import { getPackages } from '../../content/docs-loader'
import DocsLayout from '../../components/docs-platform/DocsLayout'
import type { DocsCategory } from '../../../scripts/types'

interface CategoryConfig {
  category: DocsCategory
  title: string
  description: string
}

const categoryOrder: CategoryConfig[] = [
  { category: 'ui-library', title: 'UI Library', description: 'Cross-platform components and theming primitives.' },
  { category: 'sdk', title: 'SDKs', description: 'TypeScript clients, React hooks, and React Native components.' },
  { category: 'app', title: 'Apps', description: 'Guides for the Oxy product surface: accounts, inbox, console.' },
  { category: 'service', title: 'Services', description: 'Backend services and REST APIs.' },
]

export default function DocsHubPage() {
  const packages = getPackages()
  return (
    <DocsLayout canonicalPath="/docs" seoTitle="Oxy Documentation">
      <h1>Documentation</h1>
      <p className="lead">
        Everything you need to build on the Oxy platform. Open source, no vendor lock-in.
      </p>
      {categoryOrder.map((cat) => {
        const pkgs = packages.filter((p) => p.category === cat.category)
        if (pkgs.length === 0) return null
        return (
          <section key={cat.category} className="not-prose my-10">
            <h2 className="text-2xl font-semibold text-foreground mb-1">{cat.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">{cat.description}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {pkgs.map((pkg) => (
                <Link
                  key={pkg.shortName}
                  to={`/docs/${pkg.shortName}/${pkg.defaultVersion}`}
                  className="block rounded-2xl border border-border bg-surface p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground">{pkg.displayName}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {pkg.defaultVersion}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{pkg.package}</div>
                  {pkg.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">{pkg.description}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        )
      })}
      {packages.length === 0 ? (
        <div className="not-prose my-10 rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Docs index is empty. Run <code>bun scripts/sync-docs.ts</code> from the website root.
          </p>
        </div>
      ) : null}
    </DocsLayout>
  )
}
