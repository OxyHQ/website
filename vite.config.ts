import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    svgr(),
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
    // Prefer `.web.{ts,tsx,js,jsx}` over plain extensions so libraries that
    // ship platform-specific web forks (like @oxyhq/bloom's Dialog with its
    // Dialog.web.tsx) are picked up automatically. Without this, the bundler
    // resolves to the native files and tries to pull in @gorhom/bottom-sheet
    // and other RN-only peers.
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json', '.mjs'],
    alias: {
      // Order matters: more specific aliases first. Some React Native libraries
      // (notably react-native-safe-area-context, pulled in by @oxyhq/bloom's
      // Dialog primitives) statically import
      // `react-native/Libraries/Utilities/codegenNativeComponent` at the top
      // of their files. react-native-web doesn't ship that path, so Rolldown
      // can't resolve it during production build. Map both the original and
      // the alias-rewritten variant to a no-op web shim.
      'react-native/Libraries/Utilities/codegenNativeComponent': fileURLToPath(
        new URL('./src/lib/shims/codegenNativeComponent.ts', import.meta.url),
      ),
      'react-native-web/Libraries/Utilities/codegenNativeComponent': fileURLToPath(
        new URL('./src/lib/shims/codegenNativeComponent.ts', import.meta.url),
      ),
      'react-native': 'react-native-web',
    },
  },
  optimizeDeps: {
    include: ['react-simple-maps', 'prop-types', 'd3-geo', 'topojson-client'],
    exclude: ['@react-native-async-storage/async-storage'],
  },
  server: {
    forwardConsole: true,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
