import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
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
