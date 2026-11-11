/**
 * A synced document's frontmatter is YAML the site compiles with
 * `remark-mdx-frontmatter`, and its authors write `description: How X works: …`
 * unquoted. A plain scalar cannot hold `: ` or ` #`, so one such line fails the
 * WHOLE site build ("Nested mappings are not allowed in compact mappings").
 * Quote every single-line plain scalar that YAML would read as anything but text.
 */
export function quoteUnsafeFrontMatterScalars(source: string): string {
  if (!source.startsWith('---\n')) return source;
  const end = source.indexOf('\n---', 4);
  if (end < 0) return source;
  const block = source
    .slice(4, end)
    .split('\n')
    .map((line) => {
      const match = line.match(/^([A-Za-z_][\w-]*):[ \t]+(\S.*?)[ \t]*$/);
      if (!match) return line;
      const [, key, value] = match;
      // Already quoted, a flow collection, a block scalar, an anchor, alias or tag.
      if (/^["'[{|>&*!]/.test(value)) return line;
      if (!/: |:$| #|^[-?:,%@`]/.test(value)) return line;
      return `${key}: ${JSON.stringify(value)}`;
    });
  return `---\n${block.join('\n')}${source.slice(end)}`;
}
