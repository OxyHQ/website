import { useCallback, useRef, useState } from 'react'
import {
  ChatCircleDots,
  Coins,
  EnvelopeSimple,
  Fingerprint,
  Flask,
  GitFork,
  GlobeHemisphereWest,
  Handshake,
  House,
  Key,
  Leaf,
  Prohibit,
  ShieldCheck,
  Sparkle,
  UsersThree,
  type Icon,
} from '@phosphor-icons/react'
import { useTranslation } from '../../lib/i18n'
import { useMediaQuery } from '../../hooks/useMediaQuery'

/* ──────────────────────────────────────────────
 * HomeTagPhysics
 *
 * The pieces of the Oxy ecosystem, dropped into a
 * card as pastel pills that fall, bounce and pile
 * up, and can be picked up with a click.
 *
 * The simulation is matter-js; the pills are real
 * DOM buttons whose `transform` the frame loop
 * writes directly, so the labels get real font
 * rendering and each pill stays focusable,
 * keyboard-operable and readable to a screen
 * reader. React state holds only the selection —
 * never a per-frame position — so a settled pile
 * costs no renders.
 *
 * Three states, in order of preference:
 *   1. `prefers-reduced-motion: reduce` → a plain
 *      wrapped row that never moves, still clickable.
 *   2. before matter-js and the webfonts have
 *      loaded (and in the prerendered HTML) → the
 *      same wrapped row, so the card is never empty.
 *   3. everything ready → the physics pile.
 * ──────────────────────────────────────────── */

/**
 * The pastel fills are the point of this design, so they are literal rather
 * than theme tokens — they read the same in light and dark, which is why the
 * ink on top of them is a fixed dark neutral too. Everything around the pills
 * (card, heading, body copy, border) uses the site's Bloom tokens.
 */
const TAG_INK = '#1f2430'

interface PhysicsTag {
  id: string
  /** Key into the `home.*` locale block. Brand names carry the brand itself as their translation in every locale. */
  labelKey: string
  fill: string
  Glyph: Icon
}

const TAGS: readonly PhysicsTag[] = [
  { id: 'privacy', labelKey: 'home.tagPrivacy', fill: '#e0f2fe', Glyph: ShieldCheck },
  { id: 'open-source', labelKey: 'home.tagOpenSource', fill: '#dcfce7', Glyph: GitFork },
  { id: 'identity', labelKey: 'home.tagIdentity', fill: '#fae8ff', Glyph: Fingerprint },
  { id: 'ai', labelKey: 'home.tagAi', fill: '#fef9c3', Glyph: Sparkle },
  { id: 'faircoin', labelKey: 'home.tagFairCoin', fill: '#ffedd5', Glyph: Coins },
  { id: 'community', labelKey: 'home.tagCommunity', fill: '#ffe4e6', Glyph: UsersThree },
  { id: 'research', labelKey: 'home.tagResearch', fill: '#e0e7ff', Glyph: Flask },
  { id: 'mention', labelKey: 'home.tagMention', fill: '#ccfbf1', Glyph: ChatCircleDots },
  { id: 'inbox', labelKey: 'home.tagInbox', fill: '#ede9fe', Glyph: EnvelopeSimple },
  { id: 'homiio', labelKey: 'home.tagHomiio', fill: '#d9f99d', Glyph: House },
  { id: 'no-ads', labelKey: 'home.tagNoAds', fill: '#fecdd3', Glyph: Prohibit },
  { id: 'sustainability', labelKey: 'home.tagSustainability', fill: '#bbf7d0', Glyph: Leaf },
  { id: 'collaboration', labelKey: 'home.tagCollaboration', fill: '#fde68a', Glyph: Handshake },
  { id: 'self-custody', labelKey: 'home.tagSelfCustody', fill: '#cffafe', Glyph: Key },
  { id: 'open-web', labelKey: 'home.tagOpenWeb', fill: '#bfdbfe', Glyph: GlobeHemisphereWest },
]

/* ── Simulation constants ─────────────────────────────────────────── */

/** Downward acceleration. Gentler than matter's default 1, so the pills float down rather than slam. */
const GRAVITY_Y = 0.5
/** matter-js asks to be stepped by a fixed delta no larger than this, so the loop catches up in whole steps rather than one long one. */
const FIXED_STEP_MS = 1000 / 60
/** Ceiling on catch-up steps in a single frame; beyond it the backlog is dropped, so a throttled tab resumes instead of fast-forwarding. */
const MAX_CATCHUP_STEPS = 3
const TAG_RESTITUTION = 0.55
const TAG_FRICTION = 0.5
const TAG_FRICTION_AIR = 0.02
/** Grown around the measured pill so the chamfer radius stays under half the body height. */
const BODY_PADDING_PX = 2
/** How far above the card the first pill starts. */
const SPAWN_OFFSET_PX = 90
/** Extra height per pill, so they arrive one after another instead of as a block. */
const SPAWN_STAGGER_PX = 80
/** Peak absolute tilt a pill can be given at spawn. */
const SPAWN_TILT_RAD = 0.5
/**
 * Golden-ratio conjugate. Stepping the spawn column by it walks the card's
 * width in a low-discrepancy sequence, so consecutive pills land far apart and
 * the pile comes out balanced — where 15 independent `Math.random()` draws
 * cluster to one side often enough to look broken.
 */
const SPAWN_COLUMN_STEP = 0.618033988749895
/** The static walls are far thicker than any pill, so a fast body cannot tunnel through one. */
const WALL_THICKNESS_PX = 200
/** Floor and side walls sit this far inside the card, so a pill never lands under a rounded corner. */
const WORLD_INSET_PX = 10
/** Upward force per unit of body mass when a pill is picked up — mass-scaled so every pill jumps alike. */
const SELECT_IMPULSE_PER_MASS = 0.01
/** Below these deltas a pill has not visibly moved, so the frame skips its style write. */
const POSITION_EPSILON_PX = 0.05
const ANGLE_EPSILON_RAD = 0.0005
/** A container resize under this is layout noise (scrollbars, sub-pixel rounding) and does not rebuild the world. */
const RESIZE_EPSILON_PX = 2
/** Trailing edge for a burst of resize events. */
const REBUILD_DEBOUNCE_MS = 160
/** A body this far below the floor has escaped the walls; it gets dropped in again from the top. */
const FALLOUT_MARGIN_PX = 400

type MatterApi = typeof import('matter-js')
type MatterBody = ReturnType<MatterApi['Bodies']['rectangle']>

/** A pill's placement, carried across a rebuild so a resize never re-drops a settled pile. */
interface TagPose {
  x: number
  y: number
  angle: number
}

interface TagEntry {
  el: HTMLElement
  body: MatterBody
  /** Measured once at build time: reading `offsetWidth` inside the frame loop would force a layout every frame. */
  halfWidth: number
  halfHeight: number
  paintedX: number
  paintedY: number
  paintedAngle: number
}

interface TagWorld {
  /** Wake a pill and shove it upward. */
  nudge: (id: string) => void
  /** Current placement of every pill, for handing to the next build. */
  poses: () => Map<string, TagPose>
  builtWidth: number
  builtHeight: number
  destroy: () => void
}

/**
 * Builds the world, wires the visibility observer and runs the frame loop.
 *
 * `previous` carries the poses of a world being replaced (a resize), so the
 * pile survives it; on the first build it is absent and the pills fall in.
 */
function startTagWorld(
  Matter: MatterApi,
  container: HTMLElement,
  previous?: ReadonlyMap<string, TagPose>,
): TagWorld {
  const width = container.clientWidth
  const height = container.clientHeight
  const floorY = height - WORLD_INSET_PX

  const engine = Matter.Engine.create({ enableSleeping: true })
  engine.gravity.y = GRAVITY_Y

  const floor = Matter.Bodies.rectangle(
    width / 2,
    floorY + WALL_THICKNESS_PX / 2,
    width + WALL_THICKNESS_PX * 2,
    WALL_THICKNESS_PX,
    { isStatic: true },
  )
  const leftWall = Matter.Bodies.rectangle(
    WORLD_INSET_PX - WALL_THICKNESS_PX / 2,
    height / 2,
    WALL_THICKNESS_PX,
    height * 4,
    { isStatic: true },
  )
  const rightWall = Matter.Bodies.rectangle(
    width - WORLD_INSET_PX + WALL_THICKNESS_PX / 2,
    height / 2,
    WALL_THICKNESS_PX,
    height * 4,
    { isStatic: true },
  )
  Matter.Composite.add(engine.world, [floor, leftWall, rightWall])

  const entries = new Map<string, TagEntry>()
  // Rotates the whole sequence, so the arrangement differs between loads while
  // staying evenly spread within one.
  const spawnPhase = Math.random()

  container.querySelectorAll<HTMLElement>('[data-tag-id]').forEach((el, index) => {
    const id = el.dataset.tagId
    if (!id) return
    const pillWidth = el.offsetWidth
    const pillHeight = el.offsetHeight
    if (pillWidth === 0 || pillHeight === 0) return

    const halfWidth = pillWidth / 2
    const minX = WORLD_INSET_PX + halfWidth
    const maxX = Math.max(minX, width - WORLD_INSET_PX - halfWidth)
    const pose = previous?.get(id)
    const column = (spawnPhase + index * SPAWN_COLUMN_STEP) % 1
    const x = pose ? Math.min(Math.max(pose.x, minX), maxX) : minX + column * (maxX - minX)
    const y = pose ? pose.y : -SPAWN_OFFSET_PX - index * SPAWN_STAGGER_PX

    const body = Matter.Bodies.rectangle(
      x,
      y,
      pillWidth + BODY_PADDING_PX,
      pillHeight + BODY_PADDING_PX,
      {
        chamfer: { radius: pillHeight / 2 },
        restitution: TAG_RESTITUTION,
        friction: TAG_FRICTION,
        frictionAir: TAG_FRICTION_AIR,
        angle: pose ? pose.angle : (Math.random() - 0.5) * SPAWN_TILT_RAD,
      },
    )

    entries.set(id, {
      el,
      body,
      halfWidth,
      halfHeight: pillHeight / 2,
      paintedX: Number.NaN,
      paintedY: Number.NaN,
      paintedAngle: Number.NaN,
    })
  })

  Matter.Composite.add(
    engine.world,
    Array.from(entries.values(), (entry) => entry.body),
  )

  const paint = () => {
    for (const entry of entries.values()) {
      const { x, y } = entry.body.position
      const { angle } = entry.body
      if (
        Math.abs(x - entry.paintedX) < POSITION_EPSILON_PX &&
        Math.abs(y - entry.paintedY) < POSITION_EPSILON_PX &&
        Math.abs(angle - entry.paintedAngle) < ANGLE_EPSILON_RAD
      ) {
        continue
      }
      entry.paintedX = x
      entry.paintedY = y
      entry.paintedAngle = angle
      const left = (x - entry.halfWidth).toFixed(2)
      const top = (y - entry.halfHeight).toFixed(2)
      entry.el.style.transform = `translate3d(${left}px, ${top}px, 0) rotate(${angle.toFixed(4)}rad)`
      entry.el.style.opacity = '1'
    }
  }

  /** A pill that has escaped the walls is dropped in again rather than lost. */
  const recoverFallouts = () => {
    for (const entry of entries.values()) {
      if (entry.body.position.y < height + FALLOUT_MARGIN_PX) continue
      Matter.Body.setVelocity(entry.body, { x: 0, y: 0 })
      Matter.Body.setPosition(entry.body, { x: width / 2, y: -SPAWN_OFFSET_PX })
    }
  }

  let frameHandle = 0
  let running = false
  let lastFrameTime = 0
  let backlogMs = 0

  const step = (now: number) => {
    backlogMs += lastFrameTime === 0 ? FIXED_STEP_MS : now - lastFrameTime
    lastFrameTime = now
    const steps = Math.min(Math.floor(backlogMs / FIXED_STEP_MS), MAX_CATCHUP_STEPS)
    backlogMs = steps === MAX_CATCHUP_STEPS ? 0 : backlogMs - steps * FIXED_STEP_MS
    for (let i = 0; i < steps; i++) Matter.Engine.update(engine, FIXED_STEP_MS)
    recoverFallouts()
    paint()
    frameHandle = requestAnimationFrame(step)
  }

  const startLoop = () => {
    if (running) return
    running = true
    lastFrameTime = 0
    backlogMs = 0
    frameHandle = requestAnimationFrame(step)
  }

  const stopLoop = () => {
    if (!running) return
    running = false
    cancelAnimationFrame(frameHandle)
  }

  // The pills wait above the card until it is actually on screen, so the drop
  // plays for whoever scrolls to it rather than finishing unseen — and an
  // off-screen section costs nothing.
  const visibility = new IntersectionObserver((records) => {
    if (records.some((record) => record.isIntersecting)) startLoop()
    else stopLoop()
  })
  visibility.observe(container)

  return {
    nudge: (id: string) => {
      const entry = entries.get(id)
      if (!entry) return
      Matter.Sleeping.set(entry.body, false)
      Matter.Body.applyForce(entry.body, entry.body.position, {
        x: 0,
        y: -SELECT_IMPULSE_PER_MASS * entry.body.mass,
      })
    },
    poses: () => {
      const snapshot = new Map<string, TagPose>()
      for (const [id, entry] of entries) {
        snapshot.set(id, {
          x: entry.body.position.x,
          y: entry.body.position.y,
          angle: entry.body.angle,
        })
      }
      return snapshot
    },
    builtWidth: width,
    builtHeight: height,
    destroy: () => {
      stopLoop()
      visibility.disconnect()
      Matter.Composite.clear(engine.world, false)
      Matter.Engine.clear(engine)
      for (const entry of entries.values()) {
        entry.el.style.transform = ''
        entry.el.style.opacity = ''
      }
    },
  }
}

export default function HomeTagPhysics() {
  const { t } = useTranslation()
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [physicsOn, setPhysicsOn] = useState(false)
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set<string>())
  const worldRef = useRef<TagWorld | null>(null)

  // React 19 callback ref: it owns the engine, the frame loop and both
  // observers for exactly as long as the card is mounted, and re-runs when the
  // reduced-motion preference flips.
  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || reducedMotion) return
      let cancelled = false
      let matterApi: MatterApi | null = null
      let rebuildTimer = 0

      // matter-js is needed by this one section alone, and a pill can only be
      // measured once the display webfont is in — so the world is built off
      // both, and the wrapped row stands in until then.
      void Promise.all([import('matter-js'), document.fonts.ready]).then(([matter]) => {
        if (cancelled) return
        matterApi = matter.default
        worldRef.current = startTagWorld(matterApi, node)
        setPhysicsOn(true)
      })

      const resize = new ResizeObserver(() => {
        window.clearTimeout(rebuildTimer)
        rebuildTimer = window.setTimeout(() => {
          const world = worldRef.current
          if (cancelled || !matterApi || !world) return
          if (
            Math.abs(node.clientWidth - world.builtWidth) < RESIZE_EPSILON_PX &&
            Math.abs(node.clientHeight - world.builtHeight) < RESIZE_EPSILON_PX
          ) {
            return
          }
          // Carry the pile across the rebuild: a window resize should move the
          // walls, not start the drop over.
          const carried = world.poses()
          world.destroy()
          worldRef.current = startTagWorld(matterApi, node, carried)
        }, REBUILD_DEBOUNCE_MS)
      })
      resize.observe(node)

      return () => {
        cancelled = true
        window.clearTimeout(rebuildTimer)
        resize.disconnect()
        worldRef.current?.destroy()
        worldRef.current = null
      }
    },
    [reducedMotion],
  )

  const toggle = useCallback((id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    worldRef.current?.nudge(id)
  }, [])

  const simulating = physicsOn && !reducedMotion

  return (
    <section className="bg-[color-mix(in_srgb,var(--primary)_4%,var(--background))] text-foreground">
      <div className="container">
        <div className="grid grid-cols-1 items-start gap-8 py-14 min-[951px]:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] min-[951px]:gap-12 min-[951px]:py-20">
          <div>
            <h2 className="text-heading-responsive-lg text-primary-text">{t('home.tagsHeading')}</h2>
            <p className="mt-4 max-w-[460px] text-foreground/70">{t('home.tagsBody')}</p>
          </div>

          <div
            ref={containerRef}
            role="group"
            aria-label={t('home.tagsRegionLabel')}
            className={`rounded-[2rem] border border-border bg-card ${
              simulating
                ? 'relative h-[26rem] overflow-hidden sm:h-[24rem] lg:h-[22rem]'
                : 'flex flex-wrap content-start gap-2 p-5 sm:p-6'
            }`}
          >
            {TAGS.map((tag) => {
              const isSelected = selected.has(tag.id)
              const Glyph = tag.Glyph
              return (
                <button
                  key={tag.id}
                  type="button"
                  data-tag-id={tag.id}
                  aria-pressed={isSelected}
                  onClick={() => toggle(tag.id)}
                  className={`flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[0.9375rem] font-medium ${
                    simulating ? 'absolute left-0 top-0 opacity-0 will-change-transform' : ''
                  }`}
                  style={{
                    backgroundColor: tag.fill,
                    color: TAG_INK,
                    boxShadow: isSelected ? `inset 0 0 0 2px ${TAG_INK}` : undefined,
                  }}
                >
                  <Glyph size={18} weight="regular" aria-hidden />
                  {t(tag.labelKey)}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
