# Oxy brand system

## Direction

Bloom is the shared design foundation for Oxy. Its recipes, semantic roles,
fonts and component behaviours are the starting point for product and website
work. Public guidance lives at `/brand` and its implementation is
`src/pages/BrandPage.tsx`. The guide covers identity, voice, imagery, social
communication and physical applications, as well as interface design.

Every marketing landing needs an intentional sequence of animated scenes.
Homiio and Mention provide examples of the ambition, and remain part of the
ongoing refinement. Preserve distinctive compositions and useful interactions.
Use shared foundations to make their relationship visible.

## Sources of truth

| Decision | Source |
| --- | --- |
| Product marks in docs, help and brand resources | `src/data/brand-assets.ts` |
| Product surfaces | `src/theme/brands.ts` |
| Generated colour CSS | `scripts/generate-theme-css.ts` |
| Colour recipes and component behaviour | `@oxy.so/bloom` |
| Brand guide composition | `src/styles/brand-book.css` |
| Landing motion | Each scene owns its timing; the app only provides reduced-motion preference |
| Public brand, voice and social guidance | `/brand` |
| Bloom demo sources and property controls | `src/content/bloom-demos/` |
| Complete published API catalog | Generated Bloom catalog |

## Landing choreography

1. Establish product, purpose and next action in the first scene.
2. Show one understandable task or relationship per scene.
3. Carry a recognisable element across transitions where useful.
4. Keep sections distinct through scale, composition and Bloom recipes.
5. Give the person control of scrolling and access to all essential content.
6. Resolve into a clear action and a recognisable Oxy ending.

Feedback uses 160 ms, content arrival 600 ms, and scene transitions 900 ms as
starting points. The shared exit curve is cubic-bezier(.16, 1, .3, 1).
Scroll-linked sequences have their own duration because the visitor controls
the pace. CSS view timelines are progressive enhancements. Framer Motion
respects the user's reduced-motion preference through the application provider.
Product-specific scenes must also provide usable static arrangements.

Do not animate a whole pinned section's transform while a nested element is
using sticky positioning. Animate the contents or an independent visual layer.
Never hide essential text behind a JS-only reveal.

## Identity

Use the existing Oxy symbol and wordmark from the same services components as
the navigation. Preserve their geometry. The initial guide proposes a minimum
clear area of one quarter of the mark's height; assess it at the real output
size before treating it as a production specification for print.

Products retain their names and symbols. Interface controls use Bloom's icon
vocabulary. A product mark is not a generic UI icon. Validate icon variants on
both light and dark surfaces before adding them to the registry.

## Colour and type

Choose existing recipes for editorial and product contexts. Add a genuine new
brand surface as a seed in `brands.ts`, then generate the CSS. Never keep a
second palette in a product component. Text, controls and status cues use their
semantic roles; success and error must not change meaning with a recipe.

Bloom provides the shared type families. The brand guide uses the shared sans
family at an editorial scale; expressive product scenes retain their deliberate
display treatments. Code and precise data use the shared monospace family. Web headlines have their own fluid composition scale; compact app
heading tokens must not accidentally shrink a marketing heading at a breakpoint.
Use sentence case. Capitalisation in existing expressive compositions can be
retained when it is deliberate and readable.

## Voice

Clear, warm and direct. Put a useful point first. Explain a concrete capability
with an example. Use "we" when Oxy owns a decision and "you" when addressing
the person. Express principles through decisions people can verify.

Avoid unsupported superlatives, absolute privacy claims, universal integration
claims, invented statistics and vague claims of revolution. Distinguish what is
available, what is experimental and what is intended. Explain conditions near
the relevant claim. State support failures plainly and provide a safe next step.
Use humour sparingly, especially around privacy, account access and errors.

Translate meaning naturally. Preserve product names. New locale keys must be
translated into all eleven dictionaries as required by AGENTS.md. The new guide
currently follows the existing English-authored product-page model; full prose
localisation remains separate work, not an implied completed translation.

## Images and demonstrations

Use authentic product imagery or clearly labelled illustrations. Prepared sample
messages should never be mistaken for real correspondence. Do not reuse another
product's video to substantiate a feature. Product photography should make form,
material, scale and use clear. Packaging and merchandise apply the same identity
through placement and finish; concepts are not manufacturing specifications.

Inbox's revised page is grounded in the client README and the client source:
email, threads, labels, search and composition. Its interactive sample is an
illustration, visibly labelled, and sends nothing. The previous claims of universal
messaging, arbitrary performance and absolute encryption have not been verified
and are not carried into the new copy.

## Social publishing

Use four recurring subjects: a useful product detail, a principle with evidence,
work in progress, and people contributing. Three useful posts a week is an initial
planning cadence, not a requirement to fill space.

| Week | Product | Principle | Work / community |
| --- | --- | --- | --- |
| 1 | A readable Bloom recipe demonstration | Why shared controls matter | Ask which component needs a better example |
| 2 | One real Inbox task | Explain a verified control available to users | Show a concrete improvement from feedback |
| 3 | One Mention or Homiio interaction | Connect a charter commitment to a product decision | Credit a contribution with consent |
| 4 | A short before/after with context | Explain a tradeoff openly | Publish what changed and what remains |

Draft lines, to pair with verified examples and destinations before publishing:

- "Your attention belongs to you."
- "Small details. More control."
- "A colour palette is a set of relationships. Here is how we are bringing ours together."
- "Here is what changed, and why."
- "Good questions make better tools. What would make this easier for you?"
- "Built in the open. Improved together."

These are drafts, not published or scheduled posts. Caption videos, preserve
safe areas, provide useful alt text and adapt the pacing to the channel. Confirm
feature availability before launch copy. Measure useful conversations, visits
to the relevant destination and contributions before setting growth targets.

## Bloom explorer

The visual grid uses real, readable demos with the component name and purpose.
The complete API inventory remains available beneath it; utilities and exports
without visual examples are not represented by empty preview cards.

The playground provides a component library, canvas, property inspector, recipe,
light/dark and width controls. Component/recipe/mode are reproducible URL state.
Free editing starts from the complete source example. It explicitly does not
pretend to synchronise arbitrary code edits with property controls.

The canvas is a separate, sandboxed document with an opaque origin. It has no
Oxy authentication provider. Only the dedicated document allows evaluation, and
its CSP denies network connections, embedded frames and form submissions.
The parent validates the message source; the canvas validates the parent origin
and render payload. Snippet source is never loaded from a shareable URL. The main
website's CSP retains its restriction on evaluation.

## Remaining rollout

The first website pass was rejected for generic composition and damage to
Homiio. This revision restores Homiio’s original cobalt-to-cream scene, yellow
wordmark, white property cards and coloured feature tiles from commit 9c80a38.
Those existing scene colours remain deliberately intact while a faithful Bloom
recipe migration is assessed visually. The reduced-motion fallback remains.

The brand guide now demonstrates the identity through full-bleed compositions,
interactive recipe and type studios, motion examples, voice examples and three
social applications. Its visual approach draws on the user’s references: Dropbox
and OKO for expressive systems and colour relationships, OpenAI for editorial
clarity, and Cash App for applied identity. These are direction references, not
assets to copy. The guide is a working direction, not a claim that every landing
has completed its visual review. Continue page by page.

Further work includes remaining component demos, complete small-screen review
of every complex existing scene, a full product/CMS naming inventory, authentic
recordings for each product, prose localisation and final social asset production.
Keep availability checks attached to content changes. Do not publish placeholders
as completed demonstrations or metrics.

## Review before rollout

The Website review pull-request workflow runs the full build and existing browser
gates, then exercises the guide at four widths and Homiio with motion enabled
and reduced. Its screenshot artifact makes compositions reviewable before merge.
Inspect these captures as well as the automated results; a passing build alone
does not establish design quality.
