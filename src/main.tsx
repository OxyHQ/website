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

// Apply saved color preset + dark/light mode before first render
initTheme()

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

createRoot(rootElement).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
