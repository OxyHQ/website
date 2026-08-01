import { Link } from 'react-router-dom'

interface BannerAction {
  label: string
  href: string
  external?: boolean
}

interface BannerCtaProps {
  title: string
  body: string
  primary: BannerAction
  secondary?: BannerAction
  /** Fills the panel edge to edge. A `video` needs its `poster` as the image. */
  background?: { image: string; video?: string; alt?: string }
}

const PRIMARY_CLASSES =
  'relative rounded-full px-6 py-3.5 text-b1 bg-gray-a10 text-gray-a1 transition-all duration-200 ease-impulse hover:bg-gray-a8'
const SECONDARY_CLASSES =
  'relative rounded-full px-6 py-3.5 text-b1 border border-gray-a10/30 bg-transparent text-gray-a10 transition-all duration-200 ease-impulse hover:border-gray-a10'

function Action({ action, classes }: { action: BannerAction; classes: string }) {
  return action.external || !action.href.startsWith('/') ? (
    <a className={classes} href={action.href} target="_blank" rel="noopener noreferrer">
      {action.label}
    </a>
  ) : (
    <Link className={classes} to={action.href}>
      {action.label}
    </Link>
  )
}

/**
 * The closing ask, run edge to edge: footage or artwork bled across the full
 * viewport with the copy on the page gutter. The scrim is what keeps the text
 * legible over a bright frame, so it stays even when the media is dark.
 */
export default function BannerCta({ title, body, primary, secondary, background }: BannerCtaProps) {
  return (
    <section className="relative isolate w-full overflow-hidden bg-gray-a1">
      {background && (
        <>
          {background.video ? (
            <video
              className="absolute inset-0 -z-10 size-full object-cover"
              loop
              autoPlay
              muted
              playsInline
              preload="metadata"
              poster={background.image}
            >
              <source src={background.video} type="video/mp4" />
            </video>
          ) : (
            <img alt={background.alt ?? ''} loading="lazy" decoding="async" className="absolute inset-0 -z-10 size-full object-cover" src={background.image} />
          )}
          {/* Scrim in the ramp's dark end, so the panel keeps its contrast whichever
           * way the theme runs. */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gray-a1/55" />
        </>
      )}
      {/* The panel bleeds, its contents do not: the copy sits inside the
       * site's content width so it lines up with every other section. */}
      <div className="layout-px-large py-20 md:py-32 lg:py-48">
        <div className="flex flex-col text-gray-a10">
          <h2 className="text-h2b max-md:max-w-[6em]">{title}</h2>
          <p className="pt-6 text-b1 sm:max-w-[26em]">{body}</p>
          <div className="mt-12 flex flex-col items-start max-lg:gap-y-4 lg:flex-row lg:gap-x-6">
            <Action action={primary} classes={PRIMARY_CLASSES} />
            {secondary && <Action action={secondary} classes={SECONDARY_CLASSES} />}
          </div>
        </div>
      </div>
    </section>
  )
}
