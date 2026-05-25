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
    alias: {
      'react-native': 'react-native-web',
    },
  },
  optimizeDeps: {
    include: ['react-simple-maps', 'prop-types', 'd3-geo', 'topojson-client'],
    exclude: ['@react-native-async-storage/async-storage'],
  },
  server: {
    host: true,
    forwardConsole: true,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
