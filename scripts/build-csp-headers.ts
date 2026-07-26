#!/usr/bin/env bun
/**
 * Substitute the real inline-script hashes into `dist/_headers`.
 *
 * The Content-Security-Policy in `public/_headers` ships a
 * `__CSP_SCRIPT_HASHES__` placeholder rather than literal hashes. Literal
 * hashes are a trap: `index.html` carries two inline scripts that must run
 * before first paint (the theme-FOUC guard and the per-host brand swap), and
 * editing either one without also updating a hash in a different file blocks it
 * at the edge. The failure mode is a blank page in production, with the only
 * evidence in a console nobody is watching.
 *
 * So the hashes are derived from the built artifact itself, which is the only
 * place they can be correct by construction. Runs in `postbuild`, after
 * `vite build` has copied `public/_headers` into `dist/`.
 *
 * Fails the build if the placeholder is missing or no inline scripts are found:
 * either means the CSP is silently not what it claims to be, and a security
 * header that quietly stops applying is worse than one that was never added.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'

const WEBSITE_ROOT = path.resolve(import.meta.dir, '..')
const DIST_DIR = path.join(WEBSITE_ROOT, 'dist')
const HEADERS_FILE = path.join(DIST_DIR, '_headers')
const INDEX_FILE = path.join(DIST_DIR, 'index.html')
const PLACEHOLDER = '__CSP_SCRIPT_HASHES__'

/**
 * Every inline `<script>` in the document, including `type="application/ld+json"`.
 * CSP hashes cover the element's exact text content, byte for byte — leading and
 * trailing whitespace included — so the captured group is used verbatim.
 */
function inlineScriptHashes(html: string): string[] {
  const hashes = new Set<string>()
  for (const match of html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    const body = match[1]
    if (body.trim() === '') continue
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`)
  }
  return [...hashes]
}

if (!existsSync(HEADERS_FILE)) {
  throw new Error(`[csp] ${HEADERS_FILE} missing — run vite build first`)
}
if (!existsSync(INDEX_FILE)) {
  throw new Error(`[csp] ${INDEX_FILE} missing — run vite build first`)
}

const headers = await readFile(HEADERS_FILE, 'utf8')
// Exactly one occurrence, checked rather than assumed. A `String.replace` with a
// string pattern rewrites only the first match, so a second occurrence anywhere
// in the file — a comment mentioning the token, say — silently consumes the
// substitution and ships a CSP that still contains the placeholder, which
// browsers parse as an unknown source expression and which therefore blocks
// every inline script.
const occurrences = headers.split(PLACEHOLDER).length - 1
if (occurrences !== 1) {
  throw new Error(
    `[csp] expected exactly 1 '${PLACEHOLDER}' in dist/_headers, found ${occurrences}. ` +
      `Zero means the placeholder was removed from public/_headers or this script ` +
      `already ran; more than one means the substitution would be ambiguous. Either ` +
      `way the CSP would not be what it claims.`,
  )
}

const hashes = inlineScriptHashes(await readFile(INDEX_FILE, 'utf8'))
if (hashes.length === 0) {
  throw new Error('[csp] no inline scripts found in dist/index.html — refusing to emit an empty script-src allowance')
}

await writeFile(HEADERS_FILE, headers.replaceAll(PLACEHOLDER, hashes.join(' ')), 'utf8')
console.log(`[csp] wrote ${hashes.length} inline-script hashes into dist/_headers`)
