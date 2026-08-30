// Polyfill: some libraries (react-native-web animated) expect Node's `global`
if (typeof globalThis !== 'undefined' && typeof (globalThis as Record<string, unknown>).global === 'undefined') {
  ;(globalThis as Record<string, unknown>).global = globalThis
}

const __BUILD_TAG = '2026-04-16T11:00:00Z'
;(globalThis as Record<string, unknown>).__BUILD_TAG = __BUILD_TAG

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import { initTheme } from './theme'
import App from './App.tsx'
import { queryClient } from './api/queryClient'
import { seedNewsroomBootstrap } from './lib/newsroom-bootstrap'
import { preloadNewsroomPostRoute } from './lib/route-preload'

// Apply saved color preset + dark/light mode before first render
initTheme()

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

// The Newsroom index and direct article requests carry inert build-time data.
// Seed it before React's first render so the index does not wait on the list
// API and a direct article never regresses from readable prose to a loader.
seedNewsroomBootstrap(queryClient)
if (/^\/(?:[a-z]{2}\/)?newsroom\/[^/]+\/?$/.test(window.location.pathname)) {
  try {
    await preloadNewsroomPostRoute()
  } catch {
    // React's route boundary owns the visible failure state. The static article
    // has remained readable up to this point, so a failed speculative preload
    // must not stop the app from attempting its normal render.
  }
}

// React is ready to replace the prerendered view now. Drop the static SEO at
// the last possible moment so a slow route chunk never leaves the document
// without its canonical/article metadata.
for (const tag of document.head.querySelectorAll('[data-static-seo]')) tag.remove()

createRoot(rootElement).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
