import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { docsChunkIndex } from './docs-chunks';

const MANIFEST = 'virtual:docs-chunks';
const PREFIX = 'virtual:docs-chunk/';

/** Static imports inside lazy buckets avoid one dynamic-entry facade per page. */
export default function docsChunks(options: { contentRoot?: string } = {}): Plugin {
  const root = options.contentRoot ?? path.resolve(import.meta.dirname, '../src/content/_synced');
  const indexPath = path.join(root, 'index.json');
  let files: string[] | undefined;
  function documents(): string[] {
    if (files) return files;
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as {
      packages: { versions: { pages: { file: string }[] }[] }[];
    };
    files = [
      ...new Set(
        index.packages.flatMap((pkg) =>
          pkg.versions.flatMap((version) => version.pages.map((page) => page.file)),
        ),
      ),
    ]
      .filter((file) => /\.mdx?$/.test(file))
      .sort();
    for (const file of files) {
      if (!path.resolve(root, file).startsWith(`${root}${path.sep}`))
        throw new Error(`Invalid documentation path: ${file}`);
    }
    return files;
  }
  return {
    name: 'lazy-docs-chunks',
    buildStart() {
      files = undefined;
      this.addWatchFile(indexPath);
    },
    watchChange(id) {
      if (id === indexPath) files = undefined;
    },
    handleHotUpdate({ file, server }) {
      if (file !== indexPath) return;
      files = undefined;
      const ids = [MANIFEST];
      for (let bucket = 0; bucket < 128; bucket++) {
        ids.push(`${PREFIX}docs-page-${bucket}`, `${PREFIX}docs-source-${bucket}`);
      }
      for (const id of ids) {
        const module = server.moduleGraph.getModuleById(`\0${id}`);
        if (module) server.moduleGraph.invalidateModule(module);
      }
      server.ws.send({ type: 'full-reload' });
      return [];
    },
    resolveId(id) {
      if (id === MANIFEST || id.startsWith(PREFIX)) return `\0${id}`;
    },
    load(id) {
      if (id === `\0${MANIFEST}`) {
        this.addWatchFile(indexPath);
        const byFile = Object.fromEntries(documents().map((file) => [file, docsChunkIndex(file)]));
        const buckets = [...new Set(Object.values(byFile))].sort((a, b) => a - b);
        const loaders = (kind: string) =>
          buckets
            .map(
              (bucket) =>
                `${bucket}:()=>import(${JSON.stringify(`${PREFIX}docs-${kind}-${bucket}`)})`,
            )
            .join(',');
        return `export const fileBuckets=${JSON.stringify(byFile)};\nexport const pageChunks={${loaders('page')}};\nexport const sourceChunks={${loaders('source')}};`;
      }
      if (!id.startsWith(`\0${PREFIX}`)) return;
      this.addWatchFile(indexPath);
      const match = /^\0virtual:docs-chunk\/docs-(page|source)-(\d+)$/.exec(id);
      if (!match) throw new Error(`Invalid documentation chunk: ${id}`);
      const selected = documents().filter((file) => docsChunkIndex(file) === Number(match[2]));
      const imports = selected.map(
        (file, i) =>
          `import document${i} from ${JSON.stringify(path.join(root, file).split(path.sep).join('/') + (match[1] === 'source' ? '?raw' : ''))};`,
      );
      return `${imports.join('\n')}\nexport default {${selected.map((file, i) => `${JSON.stringify(file)}:document${i}`).join(',')}};`;
    },
  };
}
