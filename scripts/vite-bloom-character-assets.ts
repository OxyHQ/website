import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import type { Plugin } from 'vite'
import { BLOOM_CHARACTER_BASE } from '../src/lib/bloomCharacterRuntime'

/** Serve and emit Bloom's runtime verbatim; its sibling imports must stay intact. */
export default function bloomCharacterAssets(): Plugin {
  const require = createRequire(import.meta.url)
  const root = path.join(
    path.dirname(require.resolve('@oxy.so/bloom/package.json')),
    'assets/character-runtime',
  )
  const files = fs.readdirSync(root, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.relative(root, path.join(entry.parentPath, entry.name))
      .split(path.sep).join('/'))
  const allowed = new Set(files)
  const mime: Record<string, string> = {
    '.mjs': 'text/javascript',
    '.wasm': 'application/wasm',
    '.png': 'image/png',
    '.json': 'application/json',
    '.md': 'text/plain',
  }
  let ssr = false
  return {
    name: 'bloom-character-assets',
    configResolved(config) {
      ssr = !!config.build.ssr
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (!url.pathname.startsWith(BLOOM_CHARACTER_BASE)) return next()
        const file = url.pathname.slice(BLOOM_CHARACTER_BASE.length)
        if (!allowed.has(file) || !['GET', 'HEAD'].includes(req.method ?? '')) {
          res.statusCode = 404
          res.end()
          return
        }
        res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(req.method === 'HEAD' ? undefined : fs.readFileSync(path.join(root, file)))
      })
    },
    generateBundle() {
      if (ssr) return
      for (const file of files) {
        this.emitFile({
          type: 'asset',
          fileName: `${BLOOM_CHARACTER_BASE.slice(1)}${file}`,
          source: fs.readFileSync(path.join(root, file)),
        })
      }
    },
  }
}
