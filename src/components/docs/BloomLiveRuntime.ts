import type { ComponentType } from 'react'
import { SNIPPET_MODULES } from './BloomLiveScope.generated'

/**
 * Compile and run a snippet the reader typed.
 *
 * The snippet is a module, not an expression: it writes the `import` lines and
 * the `export default` it would write in an app, and what renders is that
 * default export. Sucrase turns it into CommonJS — JSX and TypeScript stripped,
 * `import` rewritten to `require` — and `require` is answered from
 * {@link SNIPPET_MODULES}. So a snippet that runs here is a file that runs in an
 * app, imports included, and there is nothing to translate when it is copied
 * out.
 *
 * That map is GENERATED from what the demos in `src/content/bloom-demos/`
 * import, by `scripts/generate-bloom-live-scope.ts`, and it is not the whole of
 * `@oxy.so/bloom` on purpose: the barrel would have added 260.90 kB (75.82 kB
 * gzipped) to the first paint of every page of the site, because
 * `vite.config.ts` sends every `@oxy.so/*` module to the entry-preloaded
 * `vendor-oxy` chunk and chunk assignment is static. The generator's own
 * comment carries the reasoning; the rule a reader can hold is that the
 * playground speaks the vocabulary the demos are written in, which is the set
 * the picker seeds from.
 *
 * This is the reader's own code in the reader's own tab, so there is no sandbox
 * and nothing here pretends to be one — `new Function` over their input is the
 * devtools console with a nicer editor. What it does owe them is that a mistake
 * stays legible: every failure it can reach comes back as a message, never as a
 * blank route.
 */

/** A compiled snippet, or why it did not compile. */
export type BloomLiveResult =
  | { ok: true; Component: ComponentType }
  | { ok: false; message: string }

/**
 * Sucrase is 45.16 kB gzipped and only a reader who opens this page needs it,
 * so it is fetched on first compile and kept for the rest of the session. The
 * promise (not the module) is memoised so concurrent keystrokes share one fetch.
 */
let transformPromise: Promise<typeof import('sucrase').transform> | null = null

function loadTransform(): Promise<typeof import('sucrase').transform> {
  transformPromise ??= import('sucrase').then((sucrase) => sucrase.transform)
  return transformPromise
}

function resolveModule(specifier: string): object {
  const resolved = SNIPPET_MODULES[specifier]
  if (resolved) return resolved
  throw new Error(
    `Cannot import "${specifier}". The playground resolves ${Object.keys(SNIPPET_MODULES).join(', ')}.`,
  )
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function evaluateSnippet(source: string): Promise<BloomLiveResult> {
  const exports: Record<string, unknown> = {}
  try {
    const transform = await loadTransform()
    const { code } = transform(source, {
      transforms: ['jsx', 'typescript', 'imports'],
      jsxRuntime: 'automatic',
      production: true,
      // Sucrase prefixes its parse errors with this name, so it is what the
      // reader sees next to the line and column.
      filePath: 'Playground.tsx',
    })
    // Both `module` and `exports` are passed because Sucrase's output writes
    // through `exports` while snippets pasted from elsewhere may assign
    // `module.exports` instead.
    new Function('require', 'module', 'exports', code)(
      resolveModule,
      { exports },
      exports,
    )
  } catch (error) {
    // One catch for both phases: a syntax error from Sucrase, an unresolvable
    // import, and anything the snippet's top level throws all read the same to
    // the reader — the snippet did not run, and here is why.
    return { ok: false, message: messageFor(error) }
  }

  // A component is a function, or an object — `memo` and `forwardRef` both
  // return one. Anything else has nothing to render.
  const exported = exports.default
  if (exported === null || (typeof exported !== 'function' && typeof exported !== 'object')) {
    return {
      ok: false,
      message: 'Nothing to render: the snippet must `export default` a component.',
    }
  }
  return { ok: true, Component: exported as ComponentType }
}
