# Article content blocks

Newsroom content is Markdown, not MDX. Rich blocks therefore use fenced JSON:

````md
```article-callout
{
  "eyebrow": "Context",
  "title": "Why this matters",
  "body": "The body supports **Markdown**, lists and links.",
  "tone": "primary",
  "width": "prose"
}
```
````

The JSON is validated before rendering. Raw HTML is never enabled. URLs must be
site-relative or HTTP(S), and an invalid block renders a quiet unavailable
notice rather than executable or partially trusted markup.

## Widths

- `prose`: the centred six-column reading measure; it never overlaps the TOC.
- `wide` (default): ten editorial columns. The sticky TOC fades only while the
  block geometrically overlaps its rail.
- `full`: the complete content frame, intended for exceptional media only.

## Media

````md
```article-media
{
  "type": "image",
  "src": "/images/newsroom/example.webp",
  "alt": "A useful description",
  "caption": "Optional caption and credit",
  "aspect": "video",
  "width": "wide"
}
```
````

`type` is `image`, `video`, or `embed`. Video supports `poster`; embed requires
a `title` for accessibility and runs in a sandbox without same-origin access.
`aspect` is `video`, `square`, or `auto`.

## Callouts and metrics

Use `article-callout` as above. `tone` is `primary`, `tertiary`, or `quiet`.

````md
```article-stats
{
  "eyebrow": "In the field",
  "title": "A compact group of comparable measures",
  "items": [
    { "value": "42%", "label": "Less waiting", "detail": "Against baseline" },
    { "value": "3.1x", "label": "More completed work" }
  ]
}
```
````

## Tabs

````md
```article-tabs
{
  "label": "Choose a perspective",
  "tabs": [
    { "id": "people", "label": "People", "content": "Markdown content." },
    { "id": "systems", "label": "Systems", "content": "Another view." }
  ]
}
```
````

IDs contain letters, numbers, and hyphens. Tabs support click, ArrowLeft,
ArrowRight, Home, and End, with correct tab/tabpanel relationships.

## Testimonials

````md
```article-testimonials
{
  "label": "Partner perspectives",
  "items": [
    { "quote": "A direct quotation.", "name": "Ada", "role": "Researcher" },
    { "quote": "A second quotation.", "name": "Lin", "role": "Designer" }
  ]
}
```
````

The carousel exposes previous/next buttons, position, and a polite live region.

## Comparison

````md
```article-comparison
{
  "title": "Before and after",
  "panels": [
    { "label": "Before", "content": "The first result." },
    { "label": "After", "content": "The second result." }
  ]
}
```
````

Exactly two panels are required.

## Tables

Normal GFM tables remain supported. For CMS-authored data use:

````md
```article-table
{
  "caption": "Observed results",
  "columns": ["Signal", "Result"],
  "rows": [["Latency", "Lower"], ["Completion", "Higher"]]
}
```
````

Every row must contain exactly one cell per column. The wrapper scrolls
horizontally on narrow screens.

## Citations and footnotes

Add an inline citation as `[[cite:method]]`, then define the matching note:

````md
```article-footnotes
{
  "items": [
    {
      "id": "method",
      "text": "Methodology and scope.",
      "url": "https://example.com/source",
      "linkLabel": "Source"
    }
  ]
}
```
````

The citation links to the note and the note links back to the citation.

## MDX articles

Company MDX articles use the same visual primitives directly through
`articleMdxComponents`: `ArticleMedia`, `ArticleCallout`, `ArticleStats`,
`ArticleTabs`, `ArticleTestimonialCarousel`, `ArticleComparison`, `ArticleTable`,
`ArticleFootnotes`, and `ArticleCitation`. Their props match the JSON fields
above; children passed as strings may contain the same safe Markdown subset.

## Existing Newsroom articles

`scripts/enrich-newsroom-articles.ts` selectively enhances published Newsroom
articles without rewriting or discarding their editorial copy. A curated map
chooses both the component and its exact position for each suitable article;
articles that read best as essays deliberately remain plain Markdown. Drafts
and translations are never decorated automatically. Existing `article-*`
fences are treated as authored content and are never modified.

The current selection intentionally mixes stats, comparisons, callouts, tabs,
and tables. The shared hero, audio/share row, reading measure, and responsive
TOC still apply to every article regardless of whether its Markdown contains a
custom block. Legacy `mcp-admin` bylines are normalized to `Oxy Editorial` so
the page does not request a profile for a non-user automation identity.

Run the read-only census first, then apply the same checked transformation:

```sh
bun scripts/enrich-newsroom-articles.ts
bun scripts/enrich-newsroom-articles.ts --apply
```

The apply mode locks and updates posts in one transaction. It refuses an empty
inventory, an unknown curated target, a missing insertion heading, or a
concurrent edit.
