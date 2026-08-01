import type { CSSProperties } from 'react'

interface SliceIconProps {
  /** File name under `public/icons/`, without the extension. */
  name: 'arrow-left' | 'arrow-right' | 'arrow-right-top-alt' | 'check' | 'chevron-down' | 'download' | 'arrow-top' | 'minus'
  /** Sizing and colour — the glyph is painted with `currentColor`. */
  className?: string
}

/**
 * Monochrome icon drawn by masking `currentColor` with an SVG, so one asset
 * serves every colour and state instead of shipping a file per variant.
 */
export default function SliceIcon({ name, className = 'size-4' }: SliceIconProps) {
  return (
    <span
      className={`slice-icon pointer-events-none ${className}`}
      role="img"
      aria-label={name}
      style={{ '--image': `url("/icons/${name}.svg")` } as CSSProperties}
    />
  )
}
