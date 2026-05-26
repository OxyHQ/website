import { Suspense, lazy } from 'react'
import { useQuery } from '@tanstack/react-query'
import { loaderFor } from './docsApiSpec'

const ApiReferenceReact = lazy(() =>
  import('@scalar/api-reference-react').then((m) => ({ default: m.ApiReferenceReact })),
)

export function DocsApiBody({ version }: { version: string }) {
  const specQuery = useQuery({
    queryKey: ['docs-api-spec', version],
    queryFn: async () => {
      const loader = loaderFor(version)
      if (!loader) throw new Error(`No OpenAPI document for version "${version}".`)
      const mod = await loader()
      return mod.default
    },
    staleTime: Infinity,
  })

  const spec = specQuery.data ?? null
  const error = specQuery.error instanceof Error ? specQuery.error.message : null

  if (error) {
    return (
      <div className="not-prose rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">API reference unavailable</h2>
        <p className="text-sm text-muted-foreground">
          Run <code>bun scripts/sync-docs.ts</code> from the website root after generating the
          OpenAPI document inside <code>packages/api</code>.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Detail: {error}</p>
      </div>
    )
  }
  if (!spec) {
    return <div className="text-sm text-muted-foreground">Loading API reference…</div>
  }
  return (
    <div className="-mx-6 lg:-mx-12">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <ApiReferenceReact configuration={{ content: spec }} />
      </Suspense>
    </div>
  )
}
