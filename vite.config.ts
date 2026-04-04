import { defineConfig } from 'vite'
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
    alias: {
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
