import { expect, test } from 'bun:test';
import { parse } from 'yaml';

import { quoteUnsafeFrontMatterScalars } from './frontmatter-safe';

const data = (source: string) => parse(source.split('\n---')[0].slice(4));

test('a description with a colon becomes a quoted scalar the YAML parser accepts', () => {
  const input =
    '---\ntitle: The UI thread\ndescription: How the host keeps it moving: everything\n---\n\n# Body\n';
  expect(() => data(input)).toThrow();
  const output = quoteUnsafeFrontMatterScalars(input);
  expect(data(output)).toEqual({
    title: 'The UI thread',
    description: 'How the host keeps it moving: everything',
  });
  expect(output.endsWith('\n---\n\n# Body\n')).toBe(true);
});

test('already valid frontmatter is left byte for byte alone', () => {
  const input = '---\ntitle: "A: b"\norder: 3\ntags: [a, b]\ndescription: plain text\n---\nbody\n';
  expect(quoteUnsafeFrontMatterScalars(input)).toBe(input);
  expect(quoteUnsafeFrontMatterScalars('# no frontmatter\n')).toBe('# no frontmatter\n');
});
