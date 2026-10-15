import { expect, test } from 'bun:test';
import { removedSlugsOf, unlinkRemovedPageLinks } from './docs-links.ts';

test('a page another version serves and this one lacks is removed from this one', () => {
  const removed = removedSlugsOf(new Set(['button', 'badge']), [
    new Set(['button', 'glass']),
    new Set(['badge']),
  ]);
  expect([...removed]).toEqual(['glass']);
});

test('a link to a removed page is drawn as its text, the anchor and trailing slash included', () => {
  const removed = new Set(['glass']);
  expect(unlinkRemovedPageLinks('See [Glass](/developers/docs/glass).', removed)).toBe(
    'See Glass.',
  );
  expect(unlinkRemovedPageLinks('See [the sheen](/developers/docs/glass/#sheen).', removed)).toBe(
    'See the sheen.',
  );
});

test('every other link stays: a live page, another package, a slug no version has', () => {
  const removed = new Set(['glass']);
  const source = [
    '[Button](/developers/docs/button)',
    '[Allo](/developers/docs/allo/matrix)',
    '[Typo](/developers/docs/glas)',
    '[Site](/pricing)',
  ].join('\n');
  expect(unlinkRemovedPageLinks(source, removed)).toBe(source);
});

test('nothing removed, nothing touched', () => {
  const source = '[Glass](/developers/docs/glass)';
  expect(unlinkRemovedPageLinks(source, new Set())).toBe(source);
});
