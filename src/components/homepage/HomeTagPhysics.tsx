import { useCallback, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import type { BloomIconComponent } from '@oxy.so/bloom/icons'
import { RiAccountCircleLine } from '@oxy.so/bloom/icons/RiAccountCircleLine'
import { RiBankCardLine } from '@oxy.so/bloom/icons/RiBankCardLine'
import { RiBuilding2Line } from '@oxy.so/bloom/icons/RiBuilding2Line'
import { RiCodeSSlashLine } from '@oxy.so/bloom/icons/RiCodeSSlashLine'
import { RiEarthLine } from '@oxy.so/bloom/icons/RiEarthLine'
import { RiEyeLine } from '@oxy.so/bloom/icons/RiEyeLine'
import { RiFlaskLine } from '@oxy.so/bloom/icons/RiFlaskLine'
import { RiForbidLine } from '@oxy.so/bloom/icons/RiForbidLine'
import { RiGitMergeLine } from '@oxy.so/bloom/icons/RiGitMergeLine'
import { RiKey2Line } from '@oxy.so/bloom/icons/RiKey2Line'
import { RiLeafLine } from '@oxy.so/bloom/icons/RiLeafLine'
import { RiLockLine } from '@oxy.so/bloom/icons/RiLockLine'
import { RiMessage2Line } from '@oxy.so/bloom/icons/RiMessage2Line'
import { RiSchoolLine } from '@oxy.so/bloom/icons/RiSchoolLine'
import { RiShakeHandsLine } from '@oxy.so/bloom/icons/RiShakeHandsLine'
import { RiShieldCheckLine } from '@oxy.so/bloom/icons/RiShieldCheckLine'
import { RiTeamLine } from '@oxy.so/bloom/icons/RiTeamLine'
import { RiTranslate2 } from '@oxy.so/bloom/icons/RiTranslate2'
import { RiUserHeartLine } from '@oxy.so/bloom/icons/RiUserHeartLine'
import { RiWheelchairLine } from '@oxy.so/bloom/icons/RiWheelchairLine'
import { useTheme } from '@oxy.so/bloom/theme'
import { useTranslation } from '../../lib/i18n'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { BrandScope } from '../../theme/BrandScope'
import { Chip, resolveChipHueColors, type ChipHue } from '@oxy.so/bloom/chip'

/* ──────────────────────────────────────────────
 * HomeTagPhysics
 *
 * The pieces of the Oxy ecosystem, dropped into a
 * section as pastel pills that fall, bounce and pile
 * up around the heading, and jump when clicked.
 *
 * The simulation is matter-js; the pills are real
 * DOM buttons whose `transform` the frame loop
 * writes directly, so the labels get real font
 * rendering and each pill stays focusable,
 * keyboard-operable and readable to a screen
 * reader. React state never holds a per-frame
 * position, and the frame loop stops once every
 * pill is asleep, so a settled pile costs nothing.
 *
 * Three states, in order of preference:
 *   1. `prefers-reduced-motion: reduce` → a plain
 *      wrapped row that never moves, still clickable.
 *   2. before matter-js and the webfonts have
 *      loaded (and in the prerendered HTML) → the
 *      same wrapped row, so the section is never empty.
 *   3. everything ready → the physics pile.
 * ──────────────────────────────────────────── */

type PhysicsTag = {
  id: string
  /** Key into the `home.*` locale block. Brand names carry the brand itself as their translation in every locale. */
  labelKey: string
  /** Bloom's data hues, cycled so no two neighbours in the drop share one. */
  hue: ChipHue
} & (
  /**
   * A product wears its own logo. A one-colour mark (`mono`) is inked like
   * the label, since its black artwork would vanish on a dark chip.
   */
  | { logo: string; mono?: boolean; Glyph?: never }
  /** An idea wears a Bloom glyph, inked like the label. */
  | { Glyph: BloomIconComponent; logo?: never }
)

/**
 * Products and ideas interleaved, because a narrow section shows only the
 * first few (`tagCountFor`) and those should still be a mix of both.
 */
const TAGS: readonly PhysicsTag[] = [
  { id: 'privacy', labelKey: 'home.tagPrivacy', hue: 'cyan', Glyph: RiShieldCheckLine },
  { id: 'mention', labelKey: 'home.tagMention', hue: 'blue', logo: '/images/apps/mention.svg', mono: true },
  { id: 'open-source', labelKey: 'home.tagOpenSource', hue: 'purple', Glyph: RiGitMergeLine },
  { id: 'faircoin', labelKey: 'home.tagFairCoin', hue: 'lime', logo: '/images/apps/faircoin.svg' },
  { id: 'identity', labelKey: 'home.tagIdentity', hue: 'yellow', Glyph: RiAccountCircleLine },
  { id: 'ai', labelKey: 'home.tagAi', hue: 'rose', logo: '/images/apps/oxy-ai.svg' },
  { id: 'community', labelKey: 'home.tagCommunity', hue: 'cyan', Glyph: RiTeamLine },
  { id: 'inbox', labelKey: 'home.tagInbox', hue: 'blue', logo: '/images/apps/inbox.svg', mono: true },
  { id: 'research', labelKey: 'home.tagResearch', hue: 'purple', Glyph: RiFlaskLine },
  { id: 'homiio', labelKey: 'home.tagHomiio', hue: 'lime', logo: '/images/apps/homiio.png' },
  { id: 'no-ads', labelKey: 'home.tagNoAds', hue: 'yellow', Glyph: RiForbidLine },
  { id: 'alia', labelKey: 'home.tagAlia', hue: 'rose', logo: '/images/apps/alia-mark.svg' },
  { id: 'sustainability', labelKey: 'home.tagSustainability', hue: 'cyan', Glyph: RiLeafLine },
  { id: 'astro', labelKey: 'home.tagAstro', hue: 'blue', logo: '/images/apps/astro.svg', mono: true },
  { id: 'self-custody', labelKey: 'home.tagSelfCustody', hue: 'purple', Glyph: RiKey2Line },
  { id: 'payments', labelKey: 'home.tagPayments', hue: 'lime', Glyph: RiBankCardLine },
  { id: 'oxyos', labelKey: 'home.tagOxyOS', hue: 'yellow', logo: '/images/apps/oxyos.png' },
  { id: 'open-web', labelKey: 'home.tagOpenWeb', hue: 'rose', Glyph: RiEarthLine },
  { id: 'mercaria', labelKey: 'home.tagMercaria', hue: 'cyan', logo: '/images/apps/mercaria.svg', mono: true },
  { id: 'encryption', labelKey: 'home.tagEncryption', hue: 'blue', Glyph: RiLockLine },
  { id: 'collaboration', labelKey: 'home.tagCollaboration', hue: 'purple', Glyph: RiShakeHandsLine },
  { id: 'codea', labelKey: 'home.tagCodea', hue: 'lime', logo: '/images/apps/codea.png' },
  { id: 'accessibility', labelKey: 'home.tagAccessibility', hue: 'yellow', Glyph: RiWheelchairLine },
  { id: 'tnp', labelKey: 'home.tagTnp', hue: 'rose', logo: '/images/apps/tnp.png' },
  { id: 'developers', labelKey: 'home.tagDevelopers', hue: 'cyan', Glyph: RiCodeSSlashLine },
  { id: 'bloom', labelKey: 'home.tagBloom', hue: 'blue', logo: '/images/apps/bloom.png' },
  { id: 'transparency', labelKey: 'home.tagTransparency', hue: 'purple', Glyph: RiEyeLine },
  { id: 'housing', labelKey: 'home.tagHousing', hue: 'lime', Glyph: RiBuilding2Line },
  { id: 'academy', labelKey: 'home.tagAcademy', hue: 'yellow', logo: '/images/apps/academy.svg' },
  { id: 'education', labelKey: 'home.tagEducation', hue: 'rose', Glyph: RiSchoolLine },
  { id: 'messaging', labelKey: 'home.tagMessaging', hue: 'cyan', Glyph: RiMessage2Line },
  { id: 'wellbeing', labelKey: 'home.tagWellbeing', hue: 'blue', Glyph: RiUserHeartLine },
  { id: 'translation', labelKey: 'home.tagTranslation', hue: 'purple', Glyph: RiTranslate2 },
]

/** Section width, in px, each pill is given: a wider section holds a bigger pile. */
const WIDTH_PER_TAG_PX = 50
const MIN_TAGS = 12
const tagCountFor = (width: number) =>
  Math.min(TAGS.length, Math.max(MIN_TAGS, Math.round(width / WIDTH_PER_TAG_PX)))

const TAG_ICON_PX = 18

/* ── Simulation constants ─────────────────────────────────────────── */

/** Downward acceleration, above matter's default 1: at pill scale that default reads as a fall on the moon. */
const GRAVITY_Y = 1.6
/**
 * The simulation advances in fixed steps of this size. At 120 a second a 60 Hz
 * screen gets two per frame and a 120 Hz one gets one, every frame — at 60 a
 * second the fast screen got a step on alternate frames and the fall stuttered.
 */
const FIXED_STEP_MS = 1000 / 120
/** Ceiling on catch-up steps in a single frame; beyond it the backlog is dropped, so a throttled tab resumes instead of fast-forwarding. */
const MAX_CATCHUP_STEPS = 6
/** Pills are rubbery, not springy: a landing hop, not a trampoline. */
const TAG_RESTITUTION = 0.25
const TAG_FRICTION = 0.4
const TAG_FRICTION_AIR = 0.01
/** Grown around the measured pill so the chamfer radius stays under half the body height. */
const BODY_PADDING_PX = 2
/** How far above the section every pill starts. */
const SPAWN_OFFSET_PX = 60
/**
 * Pills are released one after another in TIME, all from the same height. They
 * used to be stacked in height instead, so the last of 33 fell 2,700px and hit
 * the pile at a speed nothing else on the page moves at.
 */
const RELEASE_EVERY_MS = 90
/** Width of the strip around the centre line the pills are dropped from. */
const SPAWN_SPREAD_PX = 160
/** Peak absolute tilt a pill can be given at spawn. */
const SPAWN_TILT_RAD = 0.5
/**
 * Golden-ratio conjugate. Stepping the spawn column by it walks the range of
 * throws in a low-discrepancy sequence, so consecutive pills land far apart and
 * the pile comes out balanced — where 15 independent `Math.random()` draws
 * cluster to one side often enough to look broken.
 */
const SPAWN_COLUMN_STEP = 0.618033988749895
/** The static walls are far thicker than any pill, so a fast body cannot tunnel through one. */
const WALL_THICKNESS_PX = 200
/** Floor and side walls sit this far inside the section, so a pill never touches its edge. */
const WORLD_INSET_PX = 10
/** Breathing room around each line of heading and body copy, so a pill never grazes the glyphs. */
const OBSTACLE_PADDING_PX = 6
/** How long a pill keeps bouncing off the copy after first touching it, before it drops through in front of it. */
const OBSTACLE_BOUNCE_MS = 140
/** Collision categories: the copy is its own, so a pill can stop meeting it without leaving the rest of the world. */
const OBSTACLE_CATEGORY = 0x0002
/** matter's default mask: a pill meets everything, the copy included. */
const PILL_MASK_ALL = 0xffffffff
const PILL_MASK_THROUGH_COPY = PILL_MASK_ALL & ~OBSTACLE_CATEGORY
/** Upward force per unit of body mass when a pill is nudged — mass-scaled so every pill jumps alike. */
const NUDGE_IMPULSE_PER_MASS = 0.01
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
  /** Carried too, or a pill still falling when the window is resized would stop dead mid-air. */
  vx: number
  vy: number
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
  /** In the world yet, or still waiting its turn to drop. */
  live: boolean
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

  // Every line of the heading and body copy is a solid body, measured per line
  // so a pill glances off the words rather than off the empty ends of a box.
  const origin = container.getBoundingClientRect()
  const obstacles: MatterBody[] = []
  container.querySelectorAll<HTMLElement>('[data-tag-obstacle]').forEach((el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    for (const line of Array.from(range.getClientRects())) {
      if (line.width === 0 || line.height === 0) continue
      const lineWidth = line.width + OBSTACLE_PADDING_PX * 2
      const lineHeight = line.height + OBSTACLE_PADDING_PX * 2
      obstacles.push(
        Matter.Bodies.rectangle(
          line.left - origin.left + line.width / 2,
          line.top - origin.top + line.height / 2,
          lineWidth,
          lineHeight,
          { isStatic: true, chamfer: { radius: lineHeight / 2 }, collisionFilter: { category: OBSTACLE_CATEGORY } },
        ),
      )
    }
    range.detach()
  })
  Matter.Composite.add(engine.world, obstacles)
  const obstacleBottom = obstacles.reduce((bottom, body) => Math.max(bottom, body.bounds.max.y), -Infinity)

  const entries = new Map<string, TagEntry>()
  /** Pills yet to be dropped, in drop order; `nextRelease` indexes the next one. */
  const pending: TagEntry[] = []
  let nextRelease = 0
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
    const x = pose ? Math.min(Math.max(pose.x, minX), maxX) : width / 2 + (column - 0.5) * SPAWN_SPREAD_PX
    const y = pose ? pose.y : -SPAWN_OFFSET_PX

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

    if (pose) Matter.Body.setVelocity(body, { x: pose.vx, y: pose.vy })

    const entry: TagEntry = {
      el,
      body,
      halfWidth,
      halfHeight: pillHeight / 2,
      paintedX: Number.NaN,
      paintedY: Number.NaN,
      paintedAngle: Number.NaN,
      live: false,
    }
    entries.set(id, entry)
    // A pill carried over from a previous world is in play at once.
    if (pose) release(entry)
    else pending.push(entry)
  })

  function release(entry: TagEntry) {
    entry.live = true
    Matter.Composite.add(engine.world, entry.body)
  }
  const releasePending = () => {
    while (nextRelease < pending.length && engine.timing.timestamp >= nextRelease * RELEASE_EVERY_MS) {
      release(pending[nextRelease++])
    }
  }

  const paint = () => {
    for (const entry of entries.values()) {
      if (!entry.live) continue
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

  // The copy is something to hit on the way down, never somewhere to stay: a
  // pill that touches it bounces off, then falls through in front of it to the
  // floor. Back below the copy, it meets the copy again on its next jump.
  const obstacleSet = new Set(obstacles)
  const passingAt = new Map<MatterBody, number>()
  const hitsCopy = (a: MatterBody, b: MatterBody) => (obstacleSet.has(a) ? b : obstacleSet.has(b) ? a : null)
  Matter.Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
      const pill = hitsCopy(pair.bodyA, pair.bodyB)
      if (pill && !passingAt.has(pill)) passingAt.set(pill, engine.timing.timestamp)
    }
  })
  const updatePassThrough = () => {
    for (const [body, since] of passingAt) {
      const falling = body.collisionFilter.mask === PILL_MASK_THROUGH_COPY
      if (!falling && engine.timing.timestamp - since >= OBSTACLE_BOUNCE_MS) {
        body.collisionFilter.mask = PILL_MASK_THROUGH_COPY
        Matter.Sleeping.set(body, false)
      } else if (falling && body.bounds.min.y > obstacleBottom) {
        body.collisionFilter.mask = PILL_MASK_ALL
        passingAt.delete(body)
      }
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
    for (let i = 0; i < steps; i++) {
      releasePending()
      Matter.Engine.update(engine, FIXED_STEP_MS)
    }
    updatePassThrough()
    recoverFallouts()
    paint()
    // A settled pile stops the loop; a nudge starts it again.
    if (settled()) running = false
    else frameHandle = requestAnimationFrame(step)
  }

  const settled = () => {
    if (nextRelease < pending.length || passingAt.size > 0) return false
    for (const entry of entries.values()) if (entry.live && !entry.body.isSleeping) return false
    return true
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

  // The pills wait above the section until it is actually on screen, so the drop
  // plays for whoever scrolls to it rather than finishing unseen — and an
  // off-screen section costs nothing.
  let visible = false
  const visibility = new IntersectionObserver((records) => {
    visible = records.some((record) => record.isIntersecting)
    if (visible) startLoop()
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
        y: -NUDGE_IMPULSE_PER_MASS * entry.body.mass,
      })
      if (visible) startLoop()
    },
    poses: () => {
      const snapshot = new Map<string, TagPose>()
      for (const [id, entry] of entries) {
        if (!entry.live) continue
        snapshot.set(id, {
          x: entry.body.position.x,
          y: entry.body.position.y,
          angle: entry.body.angle,
          vx: entry.body.velocity.x,
          vy: entry.body.velocity.y,
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
  // The prerendered row carries every tag; the live section keeps as many as its width holds.
  const [tagCount, setTagCount] = useState(TAGS.length)
  const worldRef = useRef<TagWorld | null>(null)

  // React 19 callback ref: it owns the engine, the frame loop and both
  // observers for exactly as long as the section is mounted, and re-runs when the
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
        // Commit the simulating layout first, so the one world is measured in
        // the walls and heading positions it will actually run in.
        flushSync(() => setPhysicsOn(true))
        worldRef.current = startTagWorld(matterApi, node)
      })

      const resize = new ResizeObserver(() => {
        setTagCount(tagCountFor(node.clientWidth))
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

  const nudge = useCallback((id: string) => {
    worldRef.current?.nudge(id)
  }, [])

  const simulating = physicsOn && !reducedMotion

  return (
    <BrandScope className="tags-theme">
      <section className="tags-theme bg-[color-mix(in_srgb,var(--primary)_10%,var(--background))] text-foreground">
        {/* The whole section is the world: the pills fall through all of it
            and the heading lines are solid bodies they land on and glance off. */}
        <div
          ref={containerRef}
          className={
            simulating
              ? 'relative h-[38rem] overflow-hidden sm:h-[34rem] lg:h-[36rem]'
              : 'flex flex-col gap-8 pb-14 min-[951px]:gap-10 min-[951px]:pb-20'
          }
        >
          <div className="container pt-14 min-[951px]:pt-20">
            <div className="mx-auto max-w-[760px] text-center">
              <h2 data-tag-obstacle className="text-heading-responsive-lg text-balance text-primary-text">
                {t('home.tagsHeading')}
              </h2>
              <p data-tag-obstacle className="mx-auto mt-4 max-w-[460px] text-foreground/70">
                {t('home.tagsBody')}
              </p>
            </div>
          </div>

          <div
            role="group"
            aria-label={t('home.tagsRegionLabel')}
            className={simulating ? undefined : 'container flex flex-wrap content-start justify-center gap-2'}
          >
            {(simulating ? TAGS.slice(0, tagCount) : TAGS).map((tag) => (
              <div
                key={tag.id}
                data-tag-id={tag.id}
                className={simulating ? 'absolute left-0 top-0 z-10 opacity-0 will-change-transform' : undefined}
              >
                <TagChip tag={tag} label={t(tag.labelKey)} onNudge={nudge} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </BrandScope>
  )
}

/**
 * One pill. Rendered inside the section's `BrandScope`, so `useTheme` reads
 * the scoped theme the Chip paints its label from — the icon's ink is that
 * label colour, which the Chip does not pass on to a custom `leading` node.
 */
function TagChip({ tag, label, onNudge }: { tag: PhysicsTag; label: string; onNudge: (id: string) => void }) {
  const theme = useTheme()
  const ink = resolveChipHueColors(theme, tag.hue).foreground
  const { Glyph } = tag
  let leading: ReactNode
  if (Glyph) {
    leading = <Glyph width={TAG_ICON_PX} height={TAG_ICON_PX} fill={ink} aria-hidden />
  } else if (tag.mono) {
    const mask = `url(${tag.logo}) center / contain no-repeat`
    leading = (
      <span
        aria-hidden
        className="block"
        style={{ width: TAG_ICON_PX, height: TAG_ICON_PX, backgroundColor: ink, mask, WebkitMask: mask }}
      />
    )
  } else {
    leading = (
      <img
        src={tag.logo}
        alt=""
        width={TAG_ICON_PX}
        height={TAG_ICON_PX}
        className="rounded-[5px] object-contain"
        style={{ width: TAG_ICON_PX, height: TAG_ICON_PX }}
      />
    )
  }
  return (
    <Chip hue={tag.hue} size="2xl" leading={leading} onPress={() => onNudge(tag.id)}>
      {label}
    </Chip>
  )
}
