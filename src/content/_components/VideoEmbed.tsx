/* ──────────────────────────────────────────────
 * <VideoEmbed src="…" title="…" />
 *
 * Responsive 16:9 iframe wrapper for tutorial videos (YouTube, Vimeo, Loom).
 * Always renders with `loading="lazy"` and `allowFullScreen` for accessibility.
 *
 *   <VideoEmbed
 *     src="https://www.youtube.com/embed/dQw4w9WgXcQ"
 *     title="Welcome to Oxy"
 *   />
 * ──────────────────────────────────────────── */

interface VideoEmbedProps {
  src: string
  title: string
  /** Optional aspect ratio override. Defaults to 16:9. */
  aspectRatio?: '16/9' | '4/3' | '1/1' | '9/16'
}

const ASPECT: Record<NonNullable<VideoEmbedProps['aspectRatio']>, string> = {
  '16/9': 'aspect-video',
  '4/3': 'aspect-4/3',
  '1/1': 'aspect-square',
  '9/16': 'aspect-9/16',
}

export default function VideoEmbed({ src, title, aspectRatio = '16/9' }: VideoEmbedProps) {
  return (
    <figure className="not-prose my-6 overflow-hidden rounded-2xl border border-border bg-background">
      <div className={`${ASPECT[aspectRatio]} w-full`}>
        <iframe
          src={src}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="size-full"
        />
      </div>
    </figure>
  )
}
