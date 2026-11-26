import { expect, test } from 'bun:test';
import { applyRegistryPin } from './docs-registry-pin.ts';
import type { DocsConfig } from './types.ts';

const bloom: DocsConfig = {
  package: '@oxy.so/bloom',
  displayName: 'Bloom',
  shortName: 'bloom',
  repo: 'https://github.com/OxyHQ/Bloom',
  category: 'ui-library',
  versioned: true,
  versions: ['9.0.0', '8.1.0'],
  latestVersion: '9.0.0',
  defaultVersion: '9.0.0',
  docsPath: 'docs/',
  docsIgnore: ['superpowers'],
};

test('a release tag of the package is its latest version, listed first', () => {
  const pinned = applyRegistryPin({ name: 'Bloom', ref: '@oxy.so/bloom@23.9.1' }, bloom);
  expect(pinned.versions).toEqual(['23.9.1', '9.0.0', '8.1.0']);
  expect(pinned.latestVersion).toBe('23.9.1');
  expect(pinned.defaultVersion).toBe('23.9.1');
});

test('a release the config already lists is not listed twice', () => {
  const pinned = applyRegistryPin({ name: 'Bloom', ref: '@oxy.so/bloom@8.1.0' }, bloom);
  expect(pinned.versions).toEqual(['9.0.0', '8.1.0']);
  expect(pinned.latestVersion).toBe('8.1.0');
});

test('a branch, a commit or another package’s tag changes no version', () => {
  for (const ref of [
    'main',
    '0123456789abcdef0123456789abcdef01234567',
    '@oxy.so/bloom-language@1.7.0',
  ]) {
    expect(applyRegistryPin({ name: 'Bloom', ref }, bloom)).toBe(bloom);
  }
  const unversioned = { ...bloom, versioned: false };
  expect(applyRegistryPin({ name: 'Bloom', ref: '@oxy.so/bloom@23.9.1' }, unversioned)).toBe(
    unversioned,
  );
});

test('the entry’s docsIgnore adds to the config’s', () => {
  const pinned = applyRegistryPin(
    { name: 'Bloom', ref: '@oxy.so/bloom@23.9.1', docsIgnore: ['bloom-language*.mdx'] },
    bloom,
  );
  expect(pinned.docsIgnore).toEqual(['superpowers', 'bloom-language*.mdx']);
});
