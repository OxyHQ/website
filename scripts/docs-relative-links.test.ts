import { expect, test } from 'bun:test';
import {
  rewriteRelativeDocLinks,
  rewriteUnpublishedDocsRootLinks,
  type RelativeDocLinkContext,
} from './docs-links.ts';

const context: RelativeDocLinkContext = {
  pageDir: '',
  fileToSlug: new Map([
    ['bloom-language.mdx', 'bloom-language'],
    ['bloom-language-tokens.mdx', 'bloom-language-tokens'],
    ['guides/index.mdx', 'guides'],
    ['guides/glass.mdx', 'guides/glass'],
  ]),
  baseUrl: '/developers/docs/bloom-language',
  docsPathInRepo: 'docs',
  sourceUrl: 'https://github.com/OxyHQ/Bloom/blob/0123456789abcdef0123456789abcdef01234567',
};

test('a sibling the version serves becomes its page URL, the anchor kept', () => {
  expect(
    rewriteRelativeDocLinks(
      'See [space](bloom-language-tokens.mdx#space) and [the design](./bloom-language.mdx).',
      context,
    ),
  ).toBe(
    'See [space](/developers/docs/bloom-language/bloom-language-tokens#space) and [the design](/developers/docs/bloom-language/bloom-language).',
  );
});

test("a link resolves against the page's own directory, an index to its folder", () => {
  const nested = { ...context, pageDir: 'guides' };
  expect(rewriteRelativeDocLinks('[Glass](glass.mdx) [Up](../bloom-language.mdx)', nested)).toBe(
    '[Glass](/developers/docs/bloom-language/guides/glass) [Up](/developers/docs/bloom-language/bloom-language)',
  );
  expect(rewriteRelativeDocLinks('[Guides](guides/index.mdx)', context)).toBe(
    '[Guides](/developers/docs/bloom-language/guides)',
  );
});

test('a repo file the site does not serve links to its source at the synced commit', () => {
  expect(rewriteRelativeDocLinks('[Theme](./theme.mdx#modes) [ADR](adr/0001.md)', context)).toBe(
    `[Theme](${context.sourceUrl}/docs/theme.mdx#modes) [ADR](${context.sourceUrl}/docs/adr/0001.md)`,
  );
  expect(rewriteRelativeDocLinks('[Readme](../README.md)', context)).toBe(
    `[Readme](${context.sourceUrl}/README.md)`,
  );
});

test('what cannot be resolved stays as written: outside the repo, no source, URLs, code', () => {
  expect(rewriteRelativeDocLinks('[Out](../../elsewhere.md)', context)).toBe(
    '[Out](../../elsewhere.md)',
  );
  expect(rewriteRelativeDocLinks('[Theme](theme.mdx)', { ...context, sourceUrl: undefined })).toBe(
    '[Theme](theme.mdx)',
  );
  const untouched = [
    '[Site](https://example.com/a.mdx)',
    '[Root](/developers/docs/bloom/x)',
    '```md',
    '[Tokens](bloom-language-tokens.mdx)',
    '```',
  ].join('\n');
  expect(rewriteRelativeDocLinks(untouched, context)).toBe(untouched);
});

test('a docs-root link to a file the site leaves out becomes its source on GitHub', () => {
  const tree = new Map<string, 'blob' | 'tree'>([
    ['docs/audits/issue-663/run', 'tree'],
    ['docs/benchmarks/run.json', 'blob'],
    ['docs/guides', 'tree'],
  ]);
  const context = {
    packages: new Set(['bloom']),
    slugs: new Set(['guides']),
    docsPathInRepo: 'docs',
    sourceUrl: 'https://github.com/OxyHQ/Bloom/blob/0123456789abcdef0123456789abcdef01234567',
    typeOf: (repoPath: string) => tree.get(repoPath),
  };
  expect(
    rewriteUnpublishedDocsRootLinks(
      [
        'The [run](/developers/docs/audits/issue-663/run/) and [data](/developers/docs/benchmarks/run.json).',
        'Served: [guides](/developers/docs/guides/), [Bloom](/developers/docs/bloom/main/x), [gone](/developers/docs/nothing/).',
        '```md',
        '[run](/developers/docs/audits/issue-663/run/)',
        '```',
      ].join('\n'),
      context,
    ),
  ).toBe(
    [
      'The [run](https://github.com/OxyHQ/Bloom/tree/0123456789abcdef0123456789abcdef01234567/docs/audits/issue-663/run) and [data](https://github.com/OxyHQ/Bloom/blob/0123456789abcdef0123456789abcdef01234567/docs/benchmarks/run.json).',
      'Served: [guides](/developers/docs/guides/), [Bloom](/developers/docs/bloom/main/x), [gone](/developers/docs/nothing/).',
      '```md',
      '[run](/developers/docs/audits/issue-663/run/)',
      '```',
    ].join('\n'),
  );
});
