/**
 * Shared SVG icon components.
 *
 * Every icon in this folder accepts the standard `SVGProps<SVGSVGElement>`
 * (className, width, height, aria-*, etc.) so it composes cleanly with
 * Tailwind classes. Pick a size with `className="size-4"` or by passing
 * `width` / `height` — the icons don't hardcode a size.
 *
 * Use the `currentColor` stroke/fill convention so colour comes from CSS
 * (`text-foreground`, `text-muted-foreground`, etc.).
 *
 * To add an icon:
 *   1. Create `MyIcon.tsx` in this folder.
 *   2. Default-export a function component that returns a single `<svg>`.
 *   3. Re-export it from this file.
 */

export { ArrowRightIcon } from './ArrowRightIcon'
export { CheckIcon } from './CheckIcon'
export { ChevronDownIcon } from './ChevronDownIcon'
export { SearchIcon } from './SearchIcon'
export { SpinnerIcon } from './SpinnerIcon'
export { ThumbsUpIcon } from './ThumbsUpIcon'
export { ThumbsDownIcon } from './ThumbsDownIcon'
