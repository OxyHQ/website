# Website visual identity

Oxy's website uses Bloom's identity. Consolidation means reusing the same
typographic roles, page frame and controls across pages, while keeping the
intentional product palettes in `src/theme/brands.ts`. It does not require a
new palette or a uniform layout for every product.

## Sources of truth

| Concern | Authority | Use |
| --- | --- | --- |
| Root palette | `SITE_PRESET` in `src/theme/brands.ts` | Oxy's shared page chrome and default surfaces. |
| Product palettes | `BRAND_SURFACES` and `BrandScope` | One Bloom seed recipe per named surface, including its component context. |
| First-paint colors | `scripts/generate-theme-css.ts` | Generate resolved values; do not edit `theme.generated.css` by hand. |
| Font families and files | Bloom's `fonts` exports and installed font assets | BlomusModernus for display, Inter for body/UI, JetBrains Mono for code. |
| First-paint typography | `scripts/generate-font-css.ts` | Captures Bloom's web stylesheet into `fonts.generated.css`; Vite emits the same font assets used at runtime. |
| Page frame | `.container` in `src/index.css` | 90rem maximum width; existing responsive `--layout-gutter`. |
| Section rhythm | `PageSection` | Choose its spacing and width variants instead of adding another spacing table. |
| Site frame | `PageShell`, `Navbar`, `Footer` | Keep navigation, landmarks and footer consistent across public pages. |
| Actions | `components/ui/Button.tsx` | Existing Bloom appearance/tone mapping and canonical internal links. |

Palette aliases must resolve in the scope that declares them. Use
`buildSeedScopeVars` for scoped palettes, and `BrandScope` so Bloom controls
receive the same palette as their surrounding CSS. Product styles can define
type, rhythm and shape; color values remain Bloom roles or `color-mix()` over
those roles.

## Use typography by role

These are existing classes, not a new scale:

| Role | Existing implementation | When to use it |
| --- | --- | --- |
| Large brand statement | `.oxy-display` | One deliberate hero statement, as on Inbox. |
| Large editorial section | `.oxy-title` | A section that belongs to that statement-led composition. |
| Supporting lead | `.oxy-copy` | Introductory prose with a bounded reading measure. |
| Quiet section label | `.oxy-eyebrow` | Sentence-case editorial labels. |
| Standard section heading | `SectionHeading` with `size="md"` or `"lg"` | SDK grids, resources and regular marketing sections. |
| Standard page heading | `text-heading-responsive-lg` with a real H1 | Compact directory/document entry pages. |
| UI/body text | `text-body-*`, `text-label-*`, `text-heading-*` | Controls, cards and text in flow; avoid one-off pixel sizes. |
| Existing slice composition | `text-h*` / `text-b*` in `slice-theme.css` | Maintain a complete existing slice composition; do not mix scales within it. |

The large statement and compact section roles intentionally differ. Do not
replace every heading with `.oxy-display`. When touching a page, choose a
composition and apply its roles consistently to headings, lead, labels and
section spacing. Preserve one H1 and the document's heading hierarchy.

`AnimatedTitle` is a presentation enhancement, not a separate typography
system. Its caller owns the heading level and type class. Essential copy must
remain available before animation, with reduced-motion preferences honored.

## Composition and controls

- Align section content to `.container`; use `PageSection` for ordinary
  sections. Its `wide` variant already inherits the site gutter. Use `prose`
  or `narrow` only when reading measure requires it.
- Use `SectionHeading` for ordinary heading/description blocks. It owns the
  gap, measure and alignment, so callers do not re-create those properties.
- Use the shared `Button`: filled accent for the primary action, neutral
  outline for a secondary action, subtle for a lower-priority action. Keep
  visible keyboard focus and touch targets of at least 44px where appropriate.
- Reuse `components/layout/Card.tsx` for marketing resource cards and Bloom
  cards for application-style surfaces. Avoid adding a third card component
  solely to change padding or border radius.
- Keep named palette sections intentional. A new page does not need a new
  `BRAND_SURFACES` entry merely to look distinct.
- Use official logo assets or the established logo component. Preserve its
  geometry and existing contrast treatment.

## Consolidation candidates

The current Developers hero uses `text-heading-responsive-lg`; Company uses
an inline responsive size sequence; the Apps hero uses `text-h2b`; Inbox uses
`.oxy-display`. These differences are visible at the same viewport width.
Review the intended role first, then migrate a complete composition to the
shared classes. A global search-and-replace would change product hierarchy
without a visual review.

The font comments in older website files may name Geist Mono. The installed
Bloom `fontFamilies` export is authoritative and currently names JetBrains
Mono. Documentation and generated CSS should follow that export.

Card and button styling also carries navigation behavior. An internal card
URL must pass through `src/lib/navigation` or `canonicalHref`; making a card
look consistent must not reintroduce slashless links and redirects.

## Verification

Build with `bunx tsc -b` and the relevant project build checks. Inspect the
built route with a trailing slash in a real browser at desktop and mobile
widths, in light and dark modes. Check keyboard focus, wrapping and horizontal
overflow, then repeat with reduced motion.

Compare the page before and after the app's JavaScript runs: block `**/*.js`
in Playwright rather than disabling JavaScript. Check both computed colors
and font families, and confirm that the expected font files actually loaded.
Matching a family name alone does not prove the brand font rendered. First
paint should use the same Bloom palette and font assets as the mounted page.

For a creative layout change, review the concrete design before adopting it
in shared components; those components affect every consumer.
