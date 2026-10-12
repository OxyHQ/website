import { expect, test } from 'bun:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { docsChunkIndex } from './docs-chunks';
import { assertDeploymentFileBudget, countDeploymentFiles } from './deployment-file-budget';

test('documentation partitions thousands of pages into bounded stable lazy entries', () => {
  for (const version of ['7.34.0', '8.1.0', 'main']) {
    const buckets = new Set<number>();
    for (let index = 0; index < 4000; index++) {
      buckets.add(docsChunkIndex(`bloom/${version}/api/functions/example-${index}.mdx`));
    }
    expect(buckets.size).toBe(128);
    expect(
      [...buckets].every((value) => Number.isInteger(value) && value >= 0 && value < 128),
    ).toBe(true);
  }
});

test('file projection excludes only route outputs and temporary root search stubs', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'website-file-budget-'));
  try {
    for (const file of [
      'index.html',
      'docs/page/index.html',
      'assets/page.js',
      'docs-content/page.html',
      'pagefind/chunk.pf_fragment',
      'assets/real-content/data.json',
    ]) {
      await mkdir(path.dirname(path.join(root, file)), { recursive: true });
      await writeFile(path.join(root, file), 'fixture');
    }
    expect(await countDeploymentFiles(root)).toBe(6);
    expect(
      await countDeploymentFiles(root, { excludeRouteDocuments: true, excludeIndexStubs: true }),
    ).toBe(3);
    await rm(path.join(root, 'docs-content'), { recursive: true });
    expect(await countDeploymentFiles(root)).toBe(5);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('deployment still rejects the safety budget and the Cloudflare hard limit', () => {
  expect(() => assertDeploymentFileBudget(18_000)).not.toThrow();
  expect(() => assertDeploymentFileBudget(18_001)).toThrow('18000 budget');
  expect(() => assertDeploymentFileBudget(20_001)).toThrow('Cloudflare Pages limit 20000');
});
