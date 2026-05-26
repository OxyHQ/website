import path from 'node:path'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    svgr(),
    // MDX runs before React so JSX in synced docs becomes valid React.
    // `remarkFrontmatter` parses `---` YAML blocks as data (so they can
    // include angle brackets without parser errors). `remarkMdxFrontmatter`
    // then exposes that data as `export const frontmatter = {...}` on the
    // compiled module — loaders read it via `module.frontmatter` instead of
    // re-parsing the raw source (which `enforce: 'pre'` would also transform).
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
        providerImportSource: '@mdx-js/react',
      }),
    },
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    ViteImageOptimizer({
      jpg: { quality: 80, progressive: true },
      jpeg: { quality: 80, progressive: true },
      png: { quality: 80, effort: 4 },
      webp: { quality: 80, effort: 4 },
      avif: { quality: 65, effort: 4 },
      svg: {
        plugins: [
          'preset-default',
          'sortAttrs',
          'removeEmptyAttrs',
        ],
      },
      includePublic: true,
      logStats: true,
    }),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: [
      // Native-only spec helper that `react-native-svg` and Bloom's
      // `BottomSheet` pull in transitively. `react-native-web` doesn't ship
      // this path, so we resolve it to a noop shim — see
      // `src/lib/codegenNativeComponentShim.ts`. The alias must precede the
      // bare `react-native` mapping below so it matches first.
      {
        find: /^react-native\/Libraries\/Utilities\/codegenNativeComponent$/,
        replacement: path.resolve(import.meta.dirname, 'src/lib/codegenNativeComponentShim.ts'),
      },
      // `react-native-svg` eagerly imports its Fabric (new-architecture)
      // native modules even on web. Those modules call
      // `TurboModuleRegistry.getEnforcing(...)` which `react-native-web`
      // doesn't export, so we redirect them to a noop default export — the
      // SVG primitives that read these modules are gated on
      // `Platform.OS === 'ios' | 'android'`, so the web bundle never reaches
      // them at runtime.
      {
        find: /^react-native-svg\/lib\/module\/fabric\/.+$/,
        replacement: path.resolve(import.meta.dirname, 'src/lib/nativeSvgFabricShim.ts'),
      },
      // Route `from 'react-native'` to a thin shim that re-exports
      // `react-native-web` and adds the legacy native-only exports
      // (`TurboModuleRegistry`) that some RN packages — namely
      // `react-native-svg` — eagerly import on the web target. Without
      // the shim, those imports throw `MISSING_EXPORT` at bundle time even
      // though the runtime code paths are gated on `Platform.OS`.
      {
        find: /^react-native$/,
        replacement: path.resolve(import.meta.dirname, 'src/lib/reactNativeWebExtended.ts'),
      },
    ],
  },
  optimizeDeps: {
    include: ['react-simple-maps', 'prop-types', 'd3-geo', 'topojson-client'],
    // `react-native-svg` and `react-native-safe-area-context` ship native
    // Fabric modules that don't bundle for the web target. Excluding them
    // from dep optimization keeps Vite's source-mode resolver in charge, so
    // the aliases above can rewrite the unresolvable native paths to web
    // shims. Without this, Rolldown pre-bundles the package and bypasses the
    // alias layer, which surfaces as `MISSING_EXPORT`/`UNLOADABLE_DEPENDENCY`.
    exclude: [
      '@react-native-async-storage/async-storage',
      'react-native-svg',
      'react-native-safe-area-context',
    ],
  },
  server: {
    host: true,
    forwardConsole: true,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
