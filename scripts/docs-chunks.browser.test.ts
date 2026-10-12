import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { docsChunkIndex } from './docs-chunks';
import docsChunks from './vite-docs-chunks';

const root = await mkdtemp(path.join(tmpdir(), 'website-docs-hmr-'));
const contentRoot = path.join(root, 'content');
await mkdir(contentRoot);
const first = 'first.md';
let second = '';
for (let i = 0; !second; i++) {
  const candidate = `second-${i}.md`;
  if (docsChunkIndex(candidate) === docsChunkIndex(first)) second = candidate;
}
const index = (files: string[]) =>
  JSON.stringify({ packages: [{ versions: [{ pages: files.map((file) => ({ file })) }] }] });
await writeFile(path.join(contentRoot, first), 'First document');
await writeFile(path.join(contentRoot, 'index.json'), index([first]));
await writeFile(
  path.join(root, 'index.html'),
  '<html><body><pre id="source"></pre><script type="module" src="/entry.js"></script></body></html>',
);
await writeFile(
  path.join(root, 'entry.js'),
  `import {fileBuckets, sourceChunks} from 'virtual:docs-chunks';
const file=Object.keys(fileBuckets).sort().at(-1);
const chunk=await sourceChunks[fileBuckets[file]]();
document.querySelector('#source').textContent=chunk.default[file];`,
);
const server = await createServer({
  configFile: false,
  root,
  plugins: [docsChunks({ contentRoot })],
  server: { host: '127.0.0.1', port: 0 },
});
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_EXECUTABLE || undefined,
});
try {
  await server.listen();
  const address = server.httpServer?.address();
  assert(address && typeof address !== 'string');
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${address.port}`);
  await page.waitForFunction(
    () => document.querySelector('#source')?.textContent === 'First document',
  );
  // Both documents share a bucket: invalidating only the manifest would leave
  // the already loaded bucket stale and this addition would display nothing.
  await writeFile(path.join(contentRoot, second), 'Added without restart');
  await writeFile(path.join(contentRoot, 'index.json'), index([first, second]));
  await page.waitForFunction(
    () => document.querySelector('#source')?.textContent === 'Added without restart',
  );
  await writeFile(path.join(contentRoot, second), 'Edited without restart');
  await page.waitForFunction(
    () => document.querySelector('#source')?.textContent === 'Edited without restart',
  );
  assert.deepEqual(errors, []);
  console.log(
    '[docs-chunks] index additions and raw edits reload correctly without restarting Vite',
  );
} finally {
  await browser.close();
  await server.close();
  await rm(root, { recursive: true, force: true });
}
