import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useHero, useNewsroomPosts, type HeroMediaRef } from '../../api/hooks'
import { usePageChromeStore } from '../../stores/pageChromeStore'
import { AnimatedTitle } from '../ui/AnimatedTitle'

/* ──────────────────────────────────────────────
 * HomeHero
 *
 * Two viewports tall, with one viewport of it pinned. The top band is 60dvh
 * and the bottom 40dvh; the left 70% carries the headline and the ambient
 * video, the right 30% a panel that grows to swallow the whole hero as you
 * scroll.
 *
 * The timeline runs to 2, not to 1. Everything morphs between 0 and 1 — the
 * headline and the left columns leave upward, the right panel expands, its
 * copy scales back to 1 and walks to the centre — and then between 1 and 2 that
 * copy alone travels back down to its own origin. A single 0→1 progress reads
 * as one continuous slide and feels nothing like it.
 *
 * Desktop only: below 1024px there is no room for a 70/30 split, so the same
 * markup lays out as a stacked hero with no scroll effect — headline, the
 * panel's copy at a size that reads as secondary, the featured post, and the
 * video taking whatever height is left over.
 * ──────────────────────────────────────────── */

const IMG = '/images/landing'
const IMG_HERO = '/images/hero'

const DEFAULT_TITLE = 'Creating a future where technology empowers individuals\nto live connected, fulfilling, and sustainable lives.'
const DEFAULT_POSTER = `${IMG}/hero-bg.avif`
const DEFAULT_BG_WEBM = `${IMG}/hero-panel.webm`
const DEFAULT_BG_MP4 = `${IMG}/hero-panel.mp4`
/** The video's own first frame. The still below the panel is a different picture. */
const PANEL_POSTER = `${IMG}/hero-panel-poster.webp`
/** Behind the newsroom cell, under a scrim. */
const NEWS_CELL_BACKDROP = `${IMG}/4lffisf9oaY443RqgB8sCKLHJc.avif`

/**
 * The panel's copy, one line per element: each is centred on its own.
 *
 * From the charter's own opening — Oxy exists to build practical alternatives
 * to systems that exploit people, and technology is its first instrument, not
 * its final boundary. So the last line says where the work starts rather than
 * claiming the whole of it is software.
 */
const SENTENCES = [
  'Practical alternatives to',
  'systems built on extraction.',
  'Technology is where we start.',
]

/*
 * Read left to right as the charter reads: people first, what grows out of
 * that, and the scale it is meant to reach. The raised fist was the fifth
 * candidate and is left out on purpose — a single skin tone on a fist reads as
 * a specific signal rather than as "everyone".
 */
const PANEL_ICONS = [
  { src: `${IMG_HERO}/emoji-handshake.png`, alt: 'Handshake' },
  { src: `${IMG_HERO}/emoji-seedling.png`, alt: 'Seedling' },
  { src: `${IMG_HERO}/emoji-globe.png`, alt: 'Globe showing the Americas' },
]

/** How the icons enter once the panel has begun to open. */
const ICON_ANIMATION = { duration: 1, ease: 'power4.out' }

gsap.registerPlugin(ScrollTrigger, useGSAP)

function heroMediaUrl(ref: HeroMediaRef | undefined): string {
  if (!ref) return ''
  if (typeof ref === 'string') return ref
  return ref.thumbnails?.lg || ref.url || ''
}

export default function HomeHero() {
  const { data: hero } = useHero()
  const setHeroVisible = usePageChromeStore((s) => s.setHeroVisible)

  const title = hero?.title || DEFAULT_TITLE
  const poster = heroMediaUrl(hero?.backgroundPoster) || DEFAULT_POSTER
  const webm = heroMediaUrl(hero?.backgroundVideoWebm) || DEFAULT_BG_WEBM
  const mp4 = heroMediaUrl(hero?.backgroundVideoMp4) || DEFAULT_BG_MP4

  const sectionRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const leftTopRef = useRef<HTMLDivElement>(null)
  const leftBottomRef = useRef<HTMLDivElement>(null)
  const rightTopRef = useRef<HTMLDivElement>(null)
  const rightTopInnerRef = useRef<HTMLDivElement>(null)
  const panelCopyRef = useRef<HTMLDivElement>(null)
  const panelBackdropRef = useRef<HTMLDivElement>(null)
  const arrowsRef = useRef<HTMLButtonElement>(null)
  const newsRef = useRef<HTMLDivElement>(null)

  /*
   * The cue is also the control: it scrolls to where the pin lets go, which is
   * the far end of the morph. Native smooth scrolling, so the scrubbed timeline
   * follows it frame for frame — and `auto` for anyone who asked for less
   * motion, since the whole point of the trip is the animation.
   */
  const scrollPastHero = () => {
    const section = sectionRef.current
    if (!section) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({
      top: section.offsetTop + section.offsetHeight - window.innerHeight,
      behavior: reduce ? 'auto' : 'smooth',
    })
  }

  useGSAP(
    () => {
      const section = sectionRef.current
      const sticky = stickyRef.current
      const heading = titleRef.current
      const leftTop = leftTopRef.current
      const leftBottom = leftBottomRef.current
      const rightTop = rightTopRef.current
      const rightTopInner = rightTopInnerRef.current
      const copy = panelCopyRef.current
      const backdrop = panelBackdropRef.current
      const arrows = arrowsRef.current
      const news = newsRef.current

      if (!section || !sticky || !heading || !leftTop || !leftBottom) return
      if (!rightTop || !rightTopInner || !copy || !backdrop || !arrows || !news) return

      const animated = [heading, leftTop, leftBottom, rightTop, rightTopInner, copy, backdrop, arrows, news]
      let timeline: gsap.core.Timeline | null = null

      /*
       * Where the panel's copy has to end up. Measured, never assumed: the
       * sentences are `nowrap` at a size the 30% column cannot hold, so the
       * scale that fits them is whatever the ratio happens to be — and each
       * line's own offset is what centres it independently of the others.
       */
      const measure = () => {
        const stickyBox = sticky.getBoundingClientRect()
        const copyBox = copy.getBoundingClientRect()
        const sentences = gsap.utils.toArray<HTMLElement>('[data-hero-sentence]', copy)

        return {
          width: stickyBox.width,
          scale: rightTop.clientWidth / copyBox.width,
          x: (stickyBox.width - Math.floor(copyBox.width)) * 0.5,
          y: -(stickyBox.height - Math.floor(copyBox.height)) * 0.5,
          sentences,
          sentenceX: sentences.map((sentence) => {
            const box = sentence.getBoundingClientRect()
            return (copyBox.width - (box.width + (box.left - copyBox.left) * 2)) * 0.5
          }),
        }
      }

      const build = () => {
        timeline?.revert()
        timeline?.kill()
        // Measuring under the previous timeline's transforms would compound
        // them into the new one.
        gsap.set(animated, { clearProps: 'all' })

        const icons = gsap.utils.toArray<HTMLElement>('[data-hero-icon]', copy)
        gsap.set(icons, { y: '100%' })

        const geometry = measure()

        timeline = gsap.timeline({
          scrollTrigger: { trigger: section, start: 'top', end: 'bottom', scrub: true, invalidateOnRefresh: true },
        })

        timeline
          // Pinning the measured width first: the column collapses to 0 beside
          // it, and a percentage width would collapse with it.
          .set(heading, { width: heading.offsetWidth })
          .to(heading, { y: '-50dvh', duration: 1 }, 0)
          .to([leftTop, leftBottom], { width: 0, y: '-50dvh', duration: 1 }, 0)
          .to(rightTopInner, { width: geometry.width, height: '100dvh', duration: 1 }, 0)
          .fromTo(
            copy,
            { x: 0, y: 0, scale: geometry.scale },
            { scale: 1, x: geometry.x, y: geometry.y, duration: 1 },
            0,
          )
          .fromTo(backdrop, { opacity: 1 }, { opacity: 0, duration: 1 }, 0)
          .to(geometry.sentences, { x: (index: number) => geometry.sentenceX[index], duration: 1 }, 0)
          .fromTo(arrows, { y: '0%' }, { y: '-100%', duration: 1 }, 0)
          .fromTo(news, { y: '0%' }, { y: '100%', duration: 1 }, 0)
          // The second half, and the reason this reads as two moves rather than
          // one: the copy alone comes back down while everything else is done.
          .to(copy, { y: '0%', duration: 1 }, 1)
          .call(
            () => {
              const goingDown = (timeline?.scrollTrigger?.direction ?? 1) > -1
              gsap.fromTo(
                icons,
                { y: goingDown ? '100%' : '0%' },
                { y: goingDown ? '0%' : '100%', stagger: { amount: 0.1 }, ...ICON_ANIMATION },
              )
            },
            [],
            0.25,
          )
      }

      const media = gsap.matchMedia()

      media.add('(min-width: 1024px)', () => {
        build()

        /*
         * Both rebuild triggers exist for the same reason: every number above
         * is a measurement. A resize changes the column widths; a font landing
         * changes the sentence widths, which is the one that decides where each
         * line comes to rest.
         */
        let frame = 0
        const rebuild = () => {
          frame = 0
          build()
          ScrollTrigger.refresh()
        }
        const onResize = () => {
          if (frame === 0) frame = window.requestAnimationFrame(rebuild)
        }
        window.addEventListener('resize', onResize)

        let live = true
        document.fonts?.ready.then(() => {
          if (live) rebuild()
        })

        return () => {
          live = false
          window.removeEventListener('resize', onResize)
          if (frame !== 0) window.cancelAnimationFrame(frame)
          timeline?.revert()
          timeline?.kill()
          timeline = null
        }
      })

      return () => media.revert()
    },
    { scope: sectionRef },
  )

  return (
    <motion.section
      ref={sectionRef}
      className="block w-full bg-background max-lg:min-h-svh lg:min-h-[200dvh]"
      onViewportEnter={() => setHeroVisible(true)}
      onViewportLeave={() => setHeroVisible(false)}
      viewport={{ amount: 0 }}
    >
      <div className="w-full max-w-none px-0 lg:min-h-[200dvh]">
        <div
          ref={stickyRef}
          className="sticky top-0 flex h-auto overflow-hidden bg-background max-lg:min-h-svh max-lg:flex-col lg:min-h-dvh lg:flex-wrap"
        >
        {/* Top band — 60dvh */}
        <div className="flex w-full max-lg:flex-1 max-lg:pt-28 lg:h-[60dvh]">
          <div ref={leftTopRef} className="w-full shrink-0 lg:w-[70%]">
            <div className="flex size-full flex-col justify-end">
              <div
                ref={titleRef}
                className="flex flex-col justify-end px-[var(--layout-gutter)] will-change-transform lg:px-0 lg:pb-10 lg:pe-0 lg:ps-[max(var(--layout-gutter),calc((100vw-var(--layout-max-width))/2+var(--layout-gutter)))]"
              >
                <AnimatedTitle
                  as="h1"
                  randomness={1}
                  grow
                  className="font-display text-[clamp(2.25rem,3.6vw,4rem)] font-medium leading-[0.95] tracking-[-0.04em]"
                >
                  {title}
                </AnimatedTitle>
              </div>

              {/*
                The panel and the news column have nowhere to go on a phone, so
                they read here instead — one step down in size, because on this
                width they sit under the headline rather than beside it.
              */}
              <div className="flex flex-col items-start gap-6 px-[var(--layout-gutter)] pb-8 pt-6 lg:hidden">
                <div className="flex flex-col items-start text-body-lg text-muted-foreground">
                  {SENTENCES.map((sentence) => (
                    <p key={sentence}>{sentence}</p>
                  ))}
                </div>

                <div className="flex w-full flex-col gap-2">
                  <p className="font-mono text-label-sm uppercase text-muted-foreground">Newsroom</p>
                  <FeaturedNews />
                </div>
              </div>
            </div>
          </div>

          <div ref={rightTopRef} className="hidden w-full max-w-[30%] lg:block">
            <div
              ref={rightTopInnerRef}
              className="relative z-[5] flex size-full items-end justify-start bg-background"
            >
              {/*
                No width here on purpose. As a flex item holding `nowrap`
                sentences it takes its max-content width, which is far wider
                than the 30% column — and that ratio IS the scale the timeline
                starts from.
              */}
              <div
                ref={panelCopyRef}
                className="relative z-[5] flex origin-bottom-left flex-col items-start justify-end p-20 antialiased will-change-transform"
              >
                <div className="hidden w-full justify-center gap-4 lg:flex">
                  {PANEL_ICONS.map((icon) => (
                    <div key={icon.src} className="flex size-14 overflow-hidden">
                      <img
                        data-hero-icon
                        src={icon.src}
                        alt={icon.alt}
                        width={160}
                        height={160}
                        loading="lazy"
                        decoding="async"
                        className="block size-full object-contain will-change-transform"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-start">
                  {SENTENCES.map((sentence) => (
                    <p
                      key={sentence}
                      data-hero-sentence
                      className="block whitespace-nowrap text-[clamp(2.625rem,4vw,4rem)] leading-[0.95] tracking-[-0.045em] will-change-transform"
                    >
                      {sentence}
                    </p>
                  ))}
                </div>
              </div>

              {/*
                The video sits UNDER the layer that fades out, so it is revealed
                by the panel opening rather than by a tween of its own: one
                fade, one thing to keep in step. The scrim over it is what keeps
                the copy readable once it is showing.

              */}
              <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  aria-hidden="true"
                  preload="none"
                  poster={PANEL_POSTER}
                  className="size-full object-cover"
                >
                  {webm && <source src={webm} type="video/webm" />}
                  <source src={mp4} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-background/55" />
              </div>

              <div ref={panelBackdropRef} className="pointer-events-none absolute left-0 top-0 z-[4] size-full bg-surface" />
            </div>
          </div>
        </div>

        {/* Bottom band — 40dvh */}
        <div className="flex w-full max-lg:h-[32svh] lg:h-[40dvh]">
          <div ref={leftBottomRef} className="h-full w-full shrink-0 will-change-transform lg:w-[70%]">
            <div className="relative flex size-full items-center justify-center">
              {/*
                The still, not the video. The CMS still holds both, so this is
                one element away from moving again.

                A hero tall rather than a cell tall, hanging out of the bottom of
                its own cell. The cell rises half a viewport during the morph,
                and a picture that ended at the cell's edge would take the floor
                with it and leave the space below empty.
              */}
              <img
                src={poster}
                alt=""
                aria-hidden="true"
                className="absolute left-0 top-0 z-[2] h-full w-full object-cover lg:h-dvh"
                width={1920}
                height={1080}
                fetchPriority="high"
              />
            </div>
          </div>

          {/*
            Thirty per cent at rest, and it TAKES the width the column beside it
            gives up — a fixed `max-w-[30%]` would hold its size while that
            column collapsed and leave a growing strip of nothing along the
            band's right edge.
          */}
          <div className="hidden w-[30%] grow lg:block">
            <div className="relative z-[3] hidden size-full flex-col justify-between overflow-hidden lg:flex">
              {/*
                Fixed to the cell, not to the two blocks inside it: those slide
                out on scroll and the picture has to stay where it is.
              */}
              <img
                src={NEWS_CELL_BACKDROP}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 -z-10 size-full object-cover"
                loading="lazy"
                decoding="async"
              />
              {/* Heavier at the foot, where the card and the label sit. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-b from-background/65 via-background/80 to-background/92"
              />

              <button
                ref={arrowsRef}
                type="button"
                onClick={scrollPastHero}
                aria-label="Skip to the end of the hero"
                className="hidden w-fit cursor-pointer flex-col gap-2 p-10 transition-opacity will-change-transform hover:opacity-70 lg:flex"
              >
                <ScrollArrow delay={0} />
                <ScrollArrow delay={0.18} />
                <ScrollArrow delay={0.36} />
              </button>

              <div className="flex w-full justify-end">
                <div ref={newsRef} className="relative flex w-full flex-col gap-2 p-10 will-change-transform">
                  <p className="font-mono text-label-sm uppercase text-muted-foreground">Newsroom</p>
                  <FeaturedNews />
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </motion.section>
  )
}

function ScrollArrow({ delay }: { delay: number }) {
  return (
    <span
      aria-hidden="true"
      className="relative block size-4 animate-[hero-scroll-arrow_1.5s_ease-in-out_infinite] text-foreground"
      style={{ animationDelay: `${delay}s` }}
    >
      <svg viewBox="0 0 30 30" fill="none">
        <path
          d="M13.0013 2.99951L17.001 2.99951L17.001 18.9978L20.9942 18.9978V22.998L16.9945 22.998V18.9978H13.0091L13.0091 22.998H9.00934L9.00934 18.9978H13.0013L13.0013 2.99951Z"
          fill="currentColor"
        />
        <path d="M21.0007 14.9989H25.0005V18.9991H21.0007V14.9989Z" fill="currentColor" />
        <path d="M5.00049 14.9989L9.00023 14.9989V18.9991H5.00049V14.9989Z" fill="currentColor" />
        <path d="M13.0013 22.9993H17.001L17.001 26.9995H13.0013V22.9993Z" fill="currentColor" />
      </svg>
    </span>
  )
}

function FeaturedNews() {
  const { data } = useNewsroomPosts({ limit: 1 })
  const post = data?.posts?.[0]
  if (!post) return null

  return (
    <div className="flex w-full overflow-hidden bg-background">
      <Link
        to={`/newsroom/${post.slug}`}
        className="flex w-full min-w-0 items-center justify-between gap-4 p-2 transition-colors hover:bg-foreground/5"
      >
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt=""
            className="size-16 shrink-0 object-cover"
            width={128}
            height={128}
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <p className="line-clamp-2 w-full min-w-0 text-body-lg leading-tight">{post.title}</p>
      </Link>
    </div>
  )
}
