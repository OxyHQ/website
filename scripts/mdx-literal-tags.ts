/**
 * Escape a `<Word>` in synced MDX prose that the author meant as text.
 *
 * Upstream docs are markdown to their authors, so "Continue with <Brand>" is a
 * placeholder in a sentence. MDX reads it as a JSX element with no closing tag
 * and the whole site build fails on a file nobody here wrote — and a released
 * version is synced from an immutable git tag, so fixing the sentence upstream
 * cannot repair the version that already shipped.
 *
 * So the MDX parser itself decides, not a pattern: parse, and when it reports
 * an element with no closing tag, escape exactly that `<` and parse again.
 * Anything else it rejects is left alone, so a genuinely broken document still
 * fails the build with the compiler's own message.
 */

import { createProcessor } from '@mdx-js/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';

/**
 * The parser's own message. Its `place` is the enclosing paragraph, so the
 * tag's position is read from the `(line:column-line:column)` it names.
 */
const UNCLOSED_TAG = /^Expected a closing tag for `<[^>]*>` \((\d+):(\d+)-\d+:\d+\)/;

/** A document with more stray tags than this is not prose with a slip in it. */
const MAX_ESCAPES = 50;

interface ParseFailure {
  message?: string;
  reason?: string;
  place?: { offset?: number };
}

/** What the parser says when a `{` it read as an expression is not one. */
const BAD_EXPRESSION = 'Could not parse expression with acorn';

/**
 * A prose line that starts with `{` is an MDX expression, so a sentence that
 * wraps inside inline code (Bloom 23.9.1's storage.mdx: "`createStorage(namespace,"
 * then "{ adapter?, onError? })`") fails to parse. When the expression the parser
 * rejects opens its line, and the line before is text, join the two with a space:
 * markdown renders a newline inside a paragraph as that space, so the page reads
 * as its author wrote it. Returns `undefined` for any other failure.
 */
function joinWrappedLine(source: string, failure: ParseFailure): string | undefined {
  const offset = failure.place?.offset;
  if (offset === undefined) return undefined;
  const lineStart = source.lastIndexOf('\n', offset - 1) + 1;
  const indent = /^[ \t]*/.exec(source.slice(lineStart))?.[0].length ?? 0;
  if (source[lineStart + indent] !== '{' || lineStart < 2) return undefined;
  const previous = source.slice(source.lastIndexOf('\n', lineStart - 2) + 1, lineStart - 1);
  if (previous.trim() === '') return undefined;
  return `${source.slice(0, lineStart - 1)} ${source.slice(lineStart + indent)}`;
}

/** 1-based line and column to a string offset. */
function offsetAt(source: string, line: number, column: number): number | undefined {
  let offset = 0;
  for (let current = 1; current < line; current += 1) {
    const newline = source.indexOf('\n', offset);
    if (newline === -1) return undefined;
    offset = newline + 1;
  }
  return offset + column - 1;
}

export function escapeUnclosedProseTags(source: string): { source: string; escaped: string[] } {
  // The same syntax extensions the site compiles with (`vite.config.ts`).
  const processor = createProcessor({ remarkPlugins: [remarkFrontmatter, remarkGfm] });
  const escaped: string[] = [];
  let current = source;
  for (let attempt = 0; attempt <= MAX_ESCAPES; attempt += 1) {
    try {
      processor.parse(current);
      return { source: current, escaped };
    } catch (error) {
      const failure = error as ParseFailure;
      const reason = failure.reason ?? failure.message ?? '';
      const joined = reason.startsWith(BAD_EXPRESSION)
        ? joinWrappedLine(current, failure)
        : undefined;
      if (joined !== undefined) {
        escaped.push('{ (a wrapped line, joined)');
        current = joined;
        continue;
      }
      const match = UNCLOSED_TAG.exec(reason);
      const offset = match ? offsetAt(current, Number(match[1]), Number(match[2])) : undefined;
      if (offset === undefined || current[offset] !== '<') {
        return { source: current, escaped };
      }
      escaped.push(current.slice(offset, current.indexOf('>', offset) + 1));
      current = `${current.slice(0, offset)}\\${current.slice(offset)}`;
    }
  }
  return { source: current, escaped };
}
