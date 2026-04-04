import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    svgr(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
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
