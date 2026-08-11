import { useCallback } from 'react'
import { useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

/**
 * AnimatedTitle
 *
 * A heading whose characters rise into place from below. Every character starts
 * a full line down; the ones at certain positions are rendered twice, one copy
 * above the other, and land on the SECOND copy — so that letter reads as having
 * been pushed up through the line by its own twin. The stagger widens with the
 * character's index, which is why the line stops marching and comes apart
 * towards its end.
 *
 * The lines come from `SplitText`, so they are the real wrapped lines of the
 * paragraph at its rendered width. Nothing here decides where a line breaks, and
 * nothing has to be told how many there are.
 *
 * The caller owns the type scale and the heading level — pass them through
 * `className` and `as`.
 */

interface AnimatedTitleProps {
  /** The heading. It wraps at whatever width the caller gives it. */
  children: string
  /**
   * The heading element screen readers and search engines see. One `h1` per
   * page; everything else is a section heading.
   */
  as?: 'h1' | 'h2' | 'h3'
  /** Scales the stagger. 0 makes every character leave at the same instant. */
  randomness?: number
  /** Open each line's height from zero as its characters arrive. */
  grow?: boolean
  /** Render at rest and never animate. */
  static?: boolean
  className?: string
}

const DURATION = 1
const EASE = 'power4.inOut'
const LINE_STAGGER = 0.7
/** How much taller a line box is than its line, to leave room for the twin. */
const LINE_EXPANSION = 1.15
/** A descender's twin would sit inside the clip rather than below it. */
const NEVER_DUPLICATED = ['y', 'p', 'q']

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function AnimatedTitle({
  children,
  as: Heading = 'h2',
  randomness = 1,
  grow = true,
  static: noMotion = false,
  className = '',
}: AnimatedTitleProps) {
  const reducedMotion = useReducedMotion()

  /**
   * Owns the split, the timeline and their teardown, so no layout effect is
   * needed: React 19 runs this on mount and runs the returned cleanup on
   * unmount. `gsap.context` is what makes that teardown one call.
   */
  const play = useCallback(
    (root: HTMLDivElement | null) => {
      if (!root) return
      const title = root.querySelector('p')
      if (!title || noMotion || reducedMotion) return

      /*
       * Hidden here rather than by a class in the markup. A class would hide the
       * heading on the prerendered page and for anyone with JavaScript off,
       * where nothing ever arrives to reveal it. Refs attach before the browser
       * paints, so there is no frame where the text is visible.
       *
       * Only when the heading is actually rendered, though. Inside a collapsed
       * panel or an unselected tab it has no boxes, so it can never intersect,
       * so nothing would ever reveal it again — hiding it there trades a missed
       * animation for a heading that is silently blank.
       */
      const rendered = root.getClientRects().length > 0
      if (rendered) title.style.opacity = '0'

      const build = () => gsap.context(() => {
        const split = SplitText.create(title, {
          type: 'lines, words, chars',
          tag: 'span',
          linesClass: 'overflow-hidden text-nowrap block',
          wordsClass: 'word inline-flex text-nowrap',
          charsClass: 'char',
        })

        const charsByLine = split.lines.map((line) => [
          ...line.querySelectorAll<HTMLElement>('.char'),
        ])

        /*
         * Each line box is opened past the line it holds, so a twin has
         * somewhere to sit, and each line is then pulled back up by what the
         * lines ABOVE it gained. That keeps every line on the baseline it would
         * have had anyway, which is what makes the revert at the end invisible:
         * the reference pushes lines DOWN instead, which only lands correctly
         * inside a fixed-height box anchored to its bottom edge, and dropped the
         * text ~17px for the length of the animation here.
         */
        let totalHeight = 0

        for (const [lineIndex, line] of split.lines.entries()) {
          const element = line as HTMLElement
          const lineHeight = element.clientHeight
          totalHeight += lineHeight

          const expandedHeight = lineHeight * LINE_EXPANSION
          const liftedBy = Math.round((expandedHeight - lineHeight) * lineIndex)

          element.style.display = 'block'
          element.style.height = `${expandedHeight}px`
          element.style.transformOrigin = 'top center'
          element.style.transform = `translateY(${-liftedBy}px)`
        }

        // Holds the block's natural height while the lines inside open from
        // zero, so nothing below it moves for the length of the animation.
        gsap.set(root, { height: totalHeight })

        /*
         * Which characters get a twin is fixed by position, not drawn at random:
         * every fifth and every eighth, and never a descender.
         */
        const duplicated = charsByLine.map((chars) =>
          chars.map((char, charIndex) => {
            const character = char.innerHTML
            if (NEVER_DUPLICATED.includes(character)) return false
            if (charIndex % 5 !== 0 && charIndex % 8 !== 0) return false
            char.innerHTML += `<br />${character}`
            return true
          }),
        )

        const timeline = gsap.timeline({
          onStart: () => {
            title.style.opacity = ''
          },
          onComplete: () => {
            // The extra spans and the twins exist only for the animation.
            split.revert()
            gsap.set(root, { clearProps: 'height' })
          },
        })

        for (const [lineIndex, chars] of charsByLine.entries()) {
          timeline.fromTo(
            chars,
            { y: '100%' },
            {
              // A twin lands on its second copy; everything else on its own.
              y: (charIndex: number) => (duplicated[lineIndex][charIndex] ? '-50%' : '0%'),
              stagger: (charIndex: number) =>
                charIndex * randomInteger(1, 5) * (0.005 * randomness),
              duration: DURATION,
              ease: EASE,
            },
            lineIndex * LINE_STAGGER * 1.05,
          )
        }

        if (grow && split.lines.length) {
          timeline.from(
            split.lines,
            { height: 0, duration: DURATION * 1.3, ease: EASE, stagger: LINE_STAGGER },
            0,
          )
        }
      }, root)

      /*
       * Built when the heading first reaches the viewport, not on mount. These
       * sit all down the page, and a timeline that runs while its heading is
       * three screens away has finished by the time anyone can see it — the
       * reader gets the settled text and none of the movement. One shot: the
       * observer disconnects as soon as it fires.
       */
      let ctx: gsap.Context | null = null
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return
          observer.disconnect()
          ctx = build()
        },
        { rootMargin: '0px 0px -10% 0px' },
      )
      observer.observe(root)

      return () => {
        observer.disconnect()
        ctx?.revert()
        title.style.opacity = ''
      }
    },
    [grow, noMotion, randomness, reducedMotion],
  )

  return (
    <div ref={play} className={className}>
      {/*
        `sr-only`, not `hidden`: the paragraph below is `aria-hidden`, so a
        `display: none` heading would leave the page with no headline at all in
        the accessibility tree.
      */}
      <Heading className="sr-only">{children}</Heading>

      <p aria-hidden="true" className="block" style={{ fontKerning: 'none' }}>
        {children}
      </p>
    </div>
  )
}
