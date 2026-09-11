import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    // Browser-side SPA code. The Node/Bun-side trees are handled by the next
    // block — the React plugins and browser globals don't apply there.
    files: ['**/*.{ts,tsx}'],
    ignores: ['scripts/**', 'server/**', 'functions/**'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Cloudflare answers `/pricing` with a 308 to `/pricing/`, so react-router's
      // own Link publishes a redirect as this site's idea of where the page is.
      // `src/lib/navigation` normalises `to` with the same helper the canonical
      // tag and the sitemap use. See scripts/internal-links.test.ts.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-router-dom',
              importNames: ['Link', 'NavLink', 'Navigate', 'useNavigate'],
              message: "Import Link/NavLink/Navigate/useNavigate from 'src/lib/navigation' so the URLs they publish carry the canonical trailing slash.",
            },
          ],
        },
      ],
    },
  },
  {
    // Build scripts (Bun), the Express backend (Bun), and the Cloudflare Pages
    // edge function. No React, no browser globals.
    files: ['scripts/**/*.ts', 'server/**/*.ts', 'functions/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
  },
  {
    // The wrapper itself has to import what it wraps.
    files: ['src/lib/navigation.tsx', 'src/lib/canonicalPath.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // `useNavigate` belongs next to the components it mirrors: all four
    // replacements for react-router's URL-publishing APIs are imported from one
    // module, which is what makes the `no-restricted-imports` rule above a
    // single, obvious redirect rather than a scavenger hunt.
    files: ['src/lib/navigation.tsx'],
    rules: {
      'react-refresh/only-export-components': ['error', { allowExportNames: ['useNavigate'] }],
    },
  },
  {
    // Bloom demo files intentionally co-locate a `meta` constant and a
    // `Playground` named export alongside the default-exported demo
    // component — the registry reads all three to build a single entry.
    // Co-locating keeps each demo a single file and adding a new demo a
    // single drop-in. Fast refresh isn't relevant here (these files are
    // never edited live during product development).
    files: ['src/content/bloom-demos/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowExportNames: ['meta', 'Playground'] },
      ],
    },
  },
])
