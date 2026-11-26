import { test, expect } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { bloomIndex } from '../src/content/bloom-catalog.generated';
import { bloomReferenceSurfaces } from '../src/content/bloom-reference-surfaces';
import { catalogPreviews } from '../src/components/bloom/catalogPreviews';

const normalize = (name: string) => name.replace(/[^a-z0-9]/gi, '').toLowerCase();
const examples = new Set(
  ['bloom-demos', 'bloom-examples'].flatMap((folder) =>
    readdirSync(new URL(`../src/content/${folder}/`, import.meta.url))
      .filter((name) => /^[A-Z].*\.tsx$/.test(name))
      .map((name) => normalize(name.replace(/\.tsx$/, ''))),
  ),
);
const aliases: Record<string, string> = {
  'zoomable-image-gallery': 'ZoomableMediaGallery',
};

test('every published Bloom surface has a real example or an explicit integration reference', () => {
  const missing = bloomIndex
    .filter(
      (entry) =>
        !examples.has(normalize(aliases[entry.subpath] ?? entry.subpath)) &&
        !catalogPreviews[entry.subpath] &&
        !bloomReferenceSurfaces[entry.subpath],
    )
    .map((entry) => entry.subpath);
  expect(missing).toEqual([]);
  expect(
    Object.keys(bloomReferenceSurfaces).filter(
      (subpath) => !bloomIndex.some((entry) => entry.subpath === subpath),
    ),
  ).toEqual([]);
});

test('Bloom examples, runtime and documentation use the same published release', () => {
  const require = createRequire(import.meta.url);
  const installed = JSON.parse(readFileSync(require.resolve('@oxy.so/bloom/package.json'), 'utf8'));
  const website = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const registry = JSON.parse(
    readFileSync(new URL('../docs-registry.json', import.meta.url), 'utf8'),
  );
  const bloom = registry.repos.find((entry: { name: string }) => entry.name === 'Bloom');
  expect(website.dependencies['@oxy.so/bloom']).toBe(installed.version);
  expect(website.overrides['@oxy.so/bloom']).toBe(installed.version);
  expect(bloom?.ref).toBe(`@oxy.so/bloom@${installed.version}`);
  expect(bloom?.localPath).toBeUndefined();
});

test('the Bloom language docs are pinned to a language release or a Bloom commit', () => {
  const registry = JSON.parse(
    readFileSync(new URL('../docs-registry.json', import.meta.url), 'utf8'),
  );
  const language = registry.repos.find(
    (entry: { name: string }) => entry.name === 'Bloom language',
  );
  // A tag of the language's own release line, or a full commit until the next
  // release carries `bloom-language.docs.config.json`; never a moving branch,
  // and never a local checkout, so the site publishes what was released.
  expect(language?.ref).toMatch(/^(@oxy\.so\/bloom-language@\d+\.\d+\.\d+|[0-9a-f]{40})$/);
  expect(language?.localPath).toBeUndefined();
  expect(language?.configPaths).toEqual(['bloom-language.docs.config.json']);
});
