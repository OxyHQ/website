import path from 'node:path'
import fs from 'node:fs'
import { createRequire } from 'node:module'
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
import rehypeSlug from 'rehype-slug'
import reactNativeWeb from 'vite-plugin-react-native-web'

const require = createRequire(import.meta.url)
const emptyModule = path.resolve(import.meta.dirname, 'src/lib/empty-module.js')

// Bloom / services ship `'worklet'` directives but not the Babel-plugin
// `__workletHash` metadata. Reanimated's `useHandler` (used by
// `useAnimatedScrollHandler` in Bloom's BottomSheet) rejects plain functions
// even on web, so we must run `react-native-reanimated/plugin` over those
// packages.
const oxyhqWorkletPath =
  /[/\\]node_modules[/\\]@oxyhq[/\\](?:bloom|services)[/\\]/

/**
 * Transform `@oxyhq/bloom` / `@oxyhq/services` with the Reanimated Babel
 * plugin. Implemented as a dedicated Vite plugin (not `@rolldown/plugin-babel`)
 * so we can strip Vite's `?v=` query from `filename` — Reanimated's plugin
 * `fs.readFileSync`s the filename and ENOENTs on query-suffixed paths.
 */
function oxyhqReanimatedWorklets() {
  // Lazy-require so config evaluation doesn't pay the Babel cost until first
  // transform, and so CJS `react-native-reanimated/plugin` loads cleanly.
  let babelTransform: typeof import('@babel/core').transformSync | undefined
  let reanimatedPlugin: import('@babel/core').PluginTarget | undefined

  return {
    name: 'oxyhq-reanimated-worklets',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      const file = id.split('?', 1)[0]
      if (!oxyhqWorkletPath.test(file)) return null
      if (!/\.[cm]?[jt]sx?$/.test(file)) return null

      if (!babelTransform) {
        babelTransform = require('@babel/core').transformSync
        reanimatedPlugin = require('react-native-reanimated/plugin')
      }
      if (!babelTransform || !reanimatedPlugin) return null

      const result = babelTransform(code, {
        filename: file,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        // Bloom/services may resolve to `.tsx` / JSX source (react-native
        // export condition or monorepo). Babel does not enable those parsers
        // by default — without this, transformSync throws a syntax error.
        parserOpts: {
          plugins: ['jsx', 'typescript'],
        },
        // `substituteWebPlatformChecks` folds `isWeb()` / `shouldBeUseWeb()`
        // to `true` at transform time for the web target.
        plugins: [[reanimatedPlugin, { substituteWebPlatformChecks: true }]],
      })
      if (!result?.code) return null
      return { code: result.code, map: result.map }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    reactNativeWeb(),
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
        rehypePlugins: [rehypeSlug],
        providerImportSource: '@mdx-js/react',
      }),
    },
    // `react-native-reanimated` ships `lib/module/*.js` files that contain
    // untransformed JSX (e.g. `component/LayoutAnimationConfig.js`). Vite 8 /
    // rolldown defaults to treating `.js` files as plain JavaScript — JSX
    // parsing is disabled. Those files produce `[PARSE_ERROR] Unexpected JSX
    // expression` / `[builtin:vite-transform] Unexpected JSX expression` during
    // the production build.
    //
    // The fix: intercept those files in a `load` hook and return them with
    // `moduleType: 'jsx'`. Rolldown's `ModuleType` union includes `'jsx'`,
    // which instructs the bundler (and the OXC transform wired by
    // `@vitejs/plugin-react`) to parse and transform the file as JSX rather
    // than plain JS.
    {
      name: 'reanimated-jsx',
      enforce: 'pre',
      load(id) {
        if (
          id.includes('node_modules/react-native-reanimated') &&
          id.endsWith('.js') &&
          !id.includes('\0')
        ) {
          return { code: fs.readFileSync(id, 'utf-8'), moduleType: 'jsx' }
        }
        return undefined
      },
    },
    // Workletize Bloom/services before other transforms see them.
    oxyhqReanimatedWorklets(),
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
    // Prefer `.web.js` platform variants over `.js` — react-native-gesture-handler
    // ships `.web.js` stubs for files (e.g. `getShadowNodeFromRef.web.js`) that
    // contain dynamic `require()` calls to Flow-typed react-native internals in
    // their native counterpart. Without this ordering Vite resolves the native
    // version and rolldown tries to statically parse those Flow files, producing
    // `[PARSE_ERROR] Flow is not supported`. Order mirrors Metro's default.
    extensions: ['.web.js', '.web.ts', '.web.tsx', '.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    tsconfigPaths: true,
    alias: [
      { find: /^react-native\/Libraries\/.*/, replacement: emptyModule },
      {
        find: 'react-native-screens',
        replacement: path.resolve(import.meta.dirname, 'src/lib/shims/react-native-screens.js'),
      },
      {
        find: '@react-native/assets-registry/registry',
        replacement: 'react-native-web/dist/modules/AssetRegistry',
      },
      {
        find: '@react-native-async-storage/async-storage',
        replacement: emptyModule,
      },
      { find: 'expo-web-browser', replacement: emptyModule },
      { find: 'expo-document-picker', replacement: emptyModule },
      { find: 'expo-haptics', replacement: emptyModule },
      { find: 'expo-image-manipulator', replacement: emptyModule },
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
  build: {
    // Emit build output under a versioned directory so every asset URL is new.
    //
    // A `_redirects` misconfiguration previously served `/index.html` with
    // status 200 for missing files, and `_headers` marks everything under
    // `/assets/*` as `immutable, max-age=31536000`. Browsers that requested a
    // hashed bundle before it existed therefore cached HTML under a `.js` URL
    // for a year and now refuse it ("Expected a JavaScript-or-Wasm module
    // script but the server responded with MIME type text/html"), leaving the
    // whole app blank. Filenames are content-hashed, so an unchanged chunk
    // keeps its poisoned URL — only a new path escapes it, and we cannot purge
    // a visitor's browser cache from here.
    //
    // Bump this suffix if the same class of poisoning ever happens again.
    assetsDir: 'assets/v2',
  },
  define: {
    __DEV__: JSON.stringify(mode !== 'production'),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  optimizeDeps: {
    // `react-native-svg` ships CommonJS files inside its ESM build
    // (`lib/module/.../transform.js`, `transformToRn.js`, …) and its own ESM
    // modules import *named* exports from them. In source mode (excluded) Vite
    // can't resolve those named exports across the CJS↔ESM boundary, which
    // breaks any page that renders an SVG transform (e.g. the docs shell).
    // Pre-bundling the package bundles those files together so the interop is
    // resolved. The native Fabric paths it eagerly imports are redirected by
    // the `resolve.alias` entries above, which the optimizer honours.
    //
    // `react-native-reanimated` and `react-native-gesture-handler` are
    // pre-bundled here so esbuild resolves their cross-CJS/ESM interop during
    // dev mode. For the production build the `oxc` override above handles
    // the JSX in reanimated's `lib/module/` files directly via rolldown.
    //
    // `debug`, `expo-modules-core`, `fontfaceobserver` and `color` are CJS-only
    // packages reached through the excluded `@oxyhq/services` subtree below.
    // `exclude` stops Vite prebundling that subtree, so in dev they are served
    // unbundled and `import x from 'cjs-pkg'` fails with "does not provide an
    // export named 'default'". Listing them lets esbuild resolve the interop up
    // front. Production is unaffected — rolldown bundles the whole graph.
    //
    // `@expo/vector-icons` and `react-native-qrcode-svg` are required peers of
    // `@oxyhq/services` that ship untransformed JSX in `.js` files. Served
    // unbundled they fail Vite's import-analysis parse ("invalid JS syntax").
    // Prebundling them here transforms the JSX up front, scoped to these two
    // packages (not a global loader), so their CJS interop stays intact.
    include: [
      'd3-geo',
      'debug',
      'color',
      'fontfaceobserver',
      'expo-modules-core',
      '@expo/vector-icons',
      'react-native-qrcode-svg',
      'react-native-svg',
      'react-native-reanimated',
      'react-native-gesture-handler',
    ],
    // Keep Bloom/services out of the dep optimizer so the Reanimated Babel
    // plugin (above) can attach `__workletHash` to their `'worklet'` callbacks.
    // Prebundling would ship the untransformed JS and throw
    // "Passed a function that is not a worklet" from `useHandler`.
    exclude: [
      '@react-native-async-storage/async-storage',
      'react-native-safe-area-context',
      '@oxyhq/bloom',
      '@oxyhq/services',
    ],
  },
  server: {
    host: true,
    forwardConsole: true,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
}))
