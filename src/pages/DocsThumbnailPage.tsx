import { Suspense, createElement } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getBloomDemo } from '../content/bloom-demos/registry'

/**
 * Hidden internal route consumed by `scripts/render-bloom-thumbnails.ts`.
 * Renders a single Bloom demo centered on a clean, chrome-free canvas so
 * Playwright can screenshot the demo card without nav/footer/sidebar showing
 * up around it. Mounted at `/developers/docs/_thumbnail/:name`.
 *
 * Query params:
 *   - `theme=light|dark` — controls the canvas background AND toggles the
 *     `dark` class on <html> so Tailwind dark-mode utilities resolve right.
 *
 * Not linked from the navbar, sidebar, or any docs surface. Excluded from
 * the SEO sitemap. Existence is implementation detail of the thumbnail
 * generator.
 */
export default function DocsThumbnailPage() {
  const { name } = useParams<{ name: string }>()
  const [searchParams] = useSearchParams()
  const themeParam = searchParams.get('theme')
  const mode: 'light' | 'dark' = themeParam === 'dark' ? 'dark' : 'light'

  const demo = name ? getBloomDemo(name) : undefined

  return (
    <div
      data-thumbnail-root
      data-thumbnail-mode={mode}
      className="flex min-h-screen items-center justify-center bg-card"
    >
      <div
        data-thumbnail-frame
        className="flex h-[300px] w-[400px] items-center justify-center overflow-hidden p-6"
      >
        {demo ? (
          <Suspense fallback={null}>{createElement(demo.Component)}</Suspense>
        ) : (
          <div className="text-sm text-muted-foreground">
            Unknown demo: <code className="font-mono">{name}</code>
          </div>
        )}
      </div>
    </div>
  )
}
