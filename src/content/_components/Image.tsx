/* ──────────────────────────────────────────────
 * <Image src="…" alt="…" caption="…" />
 *
 * Responsive image with optional caption. Renders as a semantic <figure>
 * with lazy loading and async decoding. Use this instead of raw `<img>`
 * inside MDX so the image and caption stay visually grouped and accessible.
 *
 *   <Image
 *     src="/help/account/recovery-email.png"
 *     alt="Settings panel with the recovery email field highlighted"
 *     caption="Settings → Security → Recovery email"
 *   />
 * ──────────────────────────────────────────── */

interface ImageProps {
  src: string
  alt: string
  caption?: string
  width?: number
  height?: number
  /** Render at full container width (default true). */
  fullWidth?: boolean
}

export default function Image({
  src,
  alt,
  caption,
  width,
  height,
  fullWidth = true,
}: ImageProps) {
  return (
    <figure className="not-prose my-6">
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={fullWidth ? 'w-full rounded-2xl border border-border' : 'rounded-2xl border border-border'}
      />
      {caption ? (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
