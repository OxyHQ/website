#!/usr/bin/env bun
/**
 * Every package the API server imports resolves in the runtime image.
 *
 * Run by checks.yml's image smoke INSIDE the built image, as its runtime user
 * (the image has bun and the production install, nothing else):
 *
 *   docker run --rm -v "$PWD/.github/scripts:/checks:ro" --entrypoint bun <image> \
 *     /checks/check-server-imports.mjs /app/server/index.ts /app/server/db/migrate.ts
 *
 * Booting the image only loads what boot loads. This walks the server's whole
 * module graph from its entry points with Bun.build (in memory, nothing
 * written): every static import and every literal dynamic `import()`, so a
 * route or a lazy import that boot never reaches is covered too. Each bare
 * specifier is resolved from the file that imports it, the way the runtime
 * will. One that does not resolve fails, unless OPTIONAL names it with the
 * reason it may be absent.
 *
 * The image installs `dependencies` only (`--production`), so this is what
 * catches a server import of a package that sits in `devDependencies`.
 */
import { isBuiltin } from 'node:module';
import { dirname, relative, resolve } from 'node:path';

/** Packages the server imports lazily and runs without, each a reviewed decision. */
const OPTIONAL = new Map([
  [
    'sharp',
    'a devDependency (the frontend build uses it); services/media.ts and services/thumbnails.ts import it lazily and store images without dimensions or thumbnails when it is absent',
  ],
]);

// Absolute, so the bare-specifier filter below never sees an entry point.
const entrypoints = process.argv.slice(2).map((entry) => resolve(entry));
if (entrypoints.length === 0) {
  console.error('usage: check-server-imports.mjs <entry.ts>...');
  process.exit(2);
}

/** specifier -> first importing file */
const seen = new Map();
const result = await Bun.build({
  entrypoints,
  target: 'bun',
  plugins: [
    {
      name: 'record-bare-imports',
      setup(build) {
        build.onResolve({ filter: /^[^./]/ }, (args) => {
          if (!isBuiltin(args.path) && !args.path.startsWith('bun:') && !seen.has(args.path)) {
            seen.set(args.path, args.importer);
          }
          return { path: args.path, external: true };
        });
      },
    },
  ],
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  console.error('::error::the server module graph did not build');
  process.exit(1);
}

const missing = [];
const optional = [];
let resolved = 0;
for (const [specifier, importer] of [...seen].sort(([a], [b]) => a.localeCompare(b))) {
  try {
    Bun.resolveSync(specifier, dirname(importer));
    resolved++;
  } catch {
    const name = specifier.startsWith('@')
      ? specifier.split('/').slice(0, 2).join('/')
      : specifier.split('/')[0];
    const where = relative(process.cwd(), importer);
    if (OPTIONAL.has(name)) optional.push(`${specifier} (${where}): ${OPTIONAL.get(name)}`);
    else missing.push(`${specifier} (imported by ${where})`);
  }
}

console.log(
  `${seen.size} bare specifiers in the server graph, ${resolved} resolve in this install`,
);
for (const line of optional) console.log(`absent, allowed: ${line}`);
if (missing.length > 0) {
  console.error('::error::server imports that do not resolve in the runtime image:');
  for (const line of missing) console.error(`  ${line}`);
  process.exit(1);
}
