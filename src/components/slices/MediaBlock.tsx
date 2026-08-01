interface MediaBlockProps {
  src: string
  alt: string
  /** A `poster` turns the block into an autoplaying, muted, looping video. */
  poster?: string
  /** Aspect ratio classes — defaults to the wide editorial crop. */
  ratioClassName?: string
  /**
   * `card` insets the media to the content width and rounds it;
   * `bleed` fills the viewport out to the tight gutter, square-cornered.
   */
  variant?: 'card' | 'bleed'
  /** Outer spacing, so a page can butt two media blocks together. */
  className?: string
}

/** A full-width image or video, either inset as a card or bled to the edges. */
export default function MediaBlock({
  src,
  alt,
  poster,
  ratioClassName = 'aspect-4/3 sm:aspect-3/2 lg:aspect-video',
  variant = 'card',
  className = '',
}: MediaBlockProps) {
  const media = `size-full object-cover ${variant === 'card' ? 'sm:rounded-xl lg:rounded-2xl' : ''} ${ratioClassName}`

  return (
    <div
      className={`relative w-full items-center justify-center overflow-hidden ${
        // `bleed` keeps the narrow inset on purpose: the media is meant to run
        // nearly edge to edge, which is the one place a slice opts out of the
        // site frame rather than lining up with it.
        variant === 'card' ? 'sm:layout-px-large' : 'px-5 layout-py sm:px-6'
      } ${className}`}
    >
      {poster ? (
        <video className={`${media} block transform-gpu will-change-transform`} loop autoPlay muted playsInline preload="metadata" poster={poster}>
          <source src={src} type="video/mp4" />
        </video>
      ) : (
        <img alt={alt} loading="lazy" decoding="async" className={media} src={src} />
      )}
    </div>
  )
}
