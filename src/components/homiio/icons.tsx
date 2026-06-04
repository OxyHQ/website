interface IconProps {
  className?: string
}

/**
 * The Homiio price glyph — a circle crossed by a horizontal bar, echoing the
 * FairCoin token used throughout the original landing. Rendered inline next to
 * every listing price.
 */
export function CoinGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
