import { Suspense, createElement, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { BloomThemeProvider } from '@oxyhq/bloom/theme'
import { getBloomDemo } from '../content/bloom-demos/registry'
import { getSavedPreset } from '../theme'

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

  // Toggle the `dark` class on <html> so Tailwind dark-mode utilities work
  // for the duration this route is mounted. Derived-state pattern: mirror the
  // current mode into a local state slot so the side effect runs only when
  // the query param flips, not on every render.
  const [lastMode, setLastMode] = useState<'light' | 'dark' | null>(null)
  if (lastMode !== mode) {
    setLastMode(mode)
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', mode === 'dark')
    }
  }

  const preset = getSavedPreset()
  const demo = name ? getBloomDemo(name) : undefined

  // Solid neutral backdrop in both modes so screenshots compose well in the
  // grid. Background color matches the demo card surface to avoid edge halos.
  const backgroundClass = mode === 'dark' ? 'bg-[#0b0b0e]' : 'bg-[#ffffff]'

  return (
    <BloomThemeProvider mode={mode} colorPreset={preset}>
      <div
        data-thumbnail-root
        className={`flex min-h-screen items-center justify-center ${backgroundClass}`}
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
    </BloomThemeProvider>
  )
}
