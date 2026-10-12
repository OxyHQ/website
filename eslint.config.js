// ESLint runs ONLY the rules Biome has no equivalent for. Formatting and every
// other lint rule belong to Biome (`biome.json`); do not grow this file into a
// second general-purpose linter.
//
// 1. The React Compiler rules from `eslint-plugin-react-hooks` v7. The app is
//    compiled with `babel-plugin-react-compiler` (vite.config.ts), and these
//    rules report the code the compiler silently skips or miscompiles: refs
//    read during render, impure render, mutated props/state, setState in an
//    effect body. `rules-of-hooks` and `exhaustive-deps` are left to Biome
//    (`useHookAtTopLevel`, `useExhaustiveDependencies`).
// 2. A few ESLint core rules with no Biome counterpart.
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const compilerRules = Object.fromEntries(
  Object.keys(reactHooks.configs['recommended-latest'].rules)
    .filter(
      (rule) => rule !== 'react-hooks/rules-of-hooks' && rule !== 'react-hooks/exhaustive-deps',
    )
    .map((rule) => [rule, 'error']),
);

export default defineConfig([
  globalIgnores([
    '**/dist/**',
    '**/dist-ssr/**',
    '**/node_modules/**',
    '.worktrees/**',
    'src/content/_synced/**',
    'src/content/_changelog/**',
    'server/db/migrations/**',
    '**/*.generated.*',
  ]),
  {
    files: ['**/*.{ts,tsx,js,mjs,cjs,jsx}'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      'no-unexpected-multiline': 'error',
      'no-useless-assignment': 'error',
      'no-invalid-regexp': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
    },
  },
  {
    // Only the SPA goes through the React Compiler.
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: compilerRules,
  },
]);
