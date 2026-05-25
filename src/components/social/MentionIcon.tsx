/**
 * Inline Mention brand glyph — a speech bubble with a question mark dot.
 * Kept as a local SVG (rather than an icon-lib import) so the mark matches
 * Mention's visual identity exactly and renders without an extra request.
 */

interface MentionIconProps {
  /** Tailwind size / colour classes. Defaults to `h-4 w-4`. */
  className?: string
}

export default function MentionIcon({ className = 'h-4 w-4' }: MentionIconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12a4 4 0 1 1 8 0c0 2.5-2 3-2 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="18" r="0.5" fill="currentColor" stroke="currentColor" />
    </svg>
  )
}
