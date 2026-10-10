import { test, expect } from 'bun:test';
import { readdirSync } from 'node:fs';
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
  'chat-people/contact-row': 'ChatPeople',
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
