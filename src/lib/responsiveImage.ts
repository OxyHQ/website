export interface ResponsiveImageSource {
  src?: string
  srcSet?: string
}

interface MediaValue {
  url?: unknown
  thumbnails?: {
    sm?: unknown
    md?: unknown
    lg?: unknown
  }
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/**
 * Resolve a populated Media value into the smallest useful image candidates.
 *
 * Newsroom cards avoid the multi-megabyte original when a suitable 800px or
 * 400px rendition exists. A width-based srcset is emitted when the thumbnail
 * ladder reaches 800px; otherwise the best single fallback is used.
 */
export function resolveResponsiveImage(field: unknown): ResponsiveImageSource {
  if (typeof field === 'string') return field ? { src: field } : {}
  if (!field || typeof field !== 'object') return {}

  const media = field as MediaValue
  const original = nonEmptyString(media.url)
  const sm = nonEmptyString(media.thumbnails?.sm)
  const md = nonEmptyString(media.thumbnails?.md)
  const lg = nonEmptyString(media.thumbnails?.lg)
  // A lone 200px rendition is too small for the rail on high-density screens.
  // Keep the original in that one case; 400px and 800px variants are suitable
  // card sources and take priority whenever they exist.
  const src = lg ?? md ?? original ?? sm

  if (!lg) return { src }

  const candidates = [
    sm ? `${sm} 200w` : undefined,
    md ? `${md} 400w` : undefined,
    `${lg} 800w`,
  ].filter((candidate): candidate is string => Boolean(candidate))

  return {
    src,
    srcSet: candidates.length > 1 ? candidates.join(', ') : undefined,
  }
}
