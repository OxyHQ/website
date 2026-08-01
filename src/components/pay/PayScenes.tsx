import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { PAY_ACTIVITY, PAY_TRANSFERS, type PayActivityRow } from './data'
import { RecipientTick, VerifiedBadge } from './PayIcons'

/* ------------------------------------------------------------------ */
/* Shared frame                                                        */
/* ------------------------------------------------------------------ */

/**
 * Every feature mock is drawn at a fixed aspect ratio and sized in container
 * query units, so one set of numbers holds at every breakpoint without a media
 * query. `Stage` establishes that container; children use `cqw` throughout.
 */
function Stage({
  ratio,
  children,
  className = '',
  scale,
}: {
  /** width / height of the inner scene, e.g. 268 / 240. */
  ratio: [number, number]
  children: ReactNode
  className?: string
  scale?: number
}) {
  const [w, h] = ratio
  return (
    <div className={`relative size-full max-h-full max-w-full ${className}`} aria-hidden="true" style={{ containerType: 'size' }}>
      <div
        className="absolute inset-0 m-auto"
        style={{
          width: `min(100cqw, calc(100cqh * ${w} / ${h}))`,
          height: `min(100cqh, calc(100cqw * ${h} / ${w}))`,
          containerType: 'inline-size',
          background: 'var(--pay-bg-secondary)',
          scale: scale ? String(scale) : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}

/** Amount text whose glyphs stagger in — the source animates each character. */
function Amount({ value, className = '', style }: { value: string; className?: string; style?: CSSProperties }) {
  const reduced = useReducedMotion()
  return (
    <span className={`whitespace-nowrap ${className}`} style={style}>
      {value.split('').map((char, i) => (
        <span
          key={`${char}-${i}`}
          className={reduced ? 'inline-block' : 'pay-char-in inline-block'}
          style={reduced ? undefined : { animationDelay: `${i * 40}ms` }}
        >
          {char}
        </span>
      ))}
    </span>
  )
}

/** Steps a scene through `length` states on an interval. Pauses when reduced. */
function useCycle(length: number, ms: number) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (reduced) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % length), ms)
    return () => clearInterval(timer)
  }, [length, ms, reduced])
  return reduced ? 0 : index
}

/* ------------------------------------------------------------------ */
/* 01 — Activity                                                       */
/* ------------------------------------------------------------------ */

function ActivityGlyph({ glyph }: { glyph: PayActivityRow['glyph'] }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{
        width: '10.4478cqw',
        height: '10.4478cqw',
        borderRadius: '1.4925cqw',
        background: 'var(--pay-bg-secondary)',
        border: '0.1866cqw solid var(--pay-border-normal)',
      }}
    >
      {glyph === 'home' && (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="absolute top-1/2 left-1/2 block -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
          style={{ width: '5.9701cqw', height: '5.9701cqw' }}
        >
          <path
            d="M2 11.333v-4.24c0-.52 0-.782.072-1.019.064-.21.168-.404.307-.574.157-.19.374-.335.808-.625l3.334-2.222c.534-.357.802-.535 1.09-.604.256-.061.522-.061.777 0 .29.07.557.247 1.091.604l3.334 2.222c.434.29.65.434.808.625.139.17.243.365.307.574.072.237.072.498.072 1.02v4.24c0 .933 0 1.4-.182 1.756-.16.314-.414.569-.728.728-.357.182-.823.182-1.757.182H9.667v-3a1.667 1.667 0 1 0-3.334 0v3H4.667c-.934 0-1.4 0-1.757-.182a1.67 1.67 0 0 1-.728-.728C2 12.733 2 12.267 2 11.333Z"
            stroke="var(--pay-fg-primary)"
          />
        </svg>
      )}
      {glyph === 'app' && (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="absolute top-1/2 left-1/2 block -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
          style={{ width: '5.597cqw', height: '5.597cqw' }}
        >
          <rect x="2" y="3" width="12" height="10" rx="2" stroke="var(--pay-fg-primary)" />
          <path d="M2 6.5h12" stroke="var(--pay-fg-primary)" />
        </svg>
      )}
      {glyph === 'incoming' && (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="absolute top-1/2 left-1/2 block -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
          style={{ width: '5.597cqw', height: '5.597cqw' }}
        >
          <path d="M8 3v10m0 0 3.5-3.5M8 13l-3.5-3.5" stroke="var(--pay-fg-primary)" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

function ActivityRow({ row, id, elevated }: { row: PayActivityRow; id: string; elevated: boolean }) {
  return (
    <div
      className="relative flex items-center"
      style={{
        width: '100%',
        gap: '2.9851cqw',
        padding: '4.4776cqw',
        background: elevated ? 'var(--pay-bg-primary)' : 'transparent',
      }}
    >
      <ActivityGlyph glyph={row.glyph} />
      <div className="flex min-w-0 flex-1 flex-col" style={{ gap: '1.4925cqw' }}>
        <div className="flex w-full items-center justify-between" style={{ height: '4.1045cqw' }}>
          <span className="flex items-center" style={{ gap: '0.7463cqw' }}>
            <span
              className="whitespace-nowrap text-fg-primary"
              style={{ fontSize: '3.3582cqw', fontWeight: 500, letterSpacing: '0.0336cqw', lineHeight: 'normal' }}
            >
              {row.merchant}
            </span>
            {row.verified && (
              <VerifiedBadge id={id} className="block shrink-0" style={{ width: '4.1045cqw', height: '4.1045cqw', transform: 'translateY(-0.1866cqw)' }} />
            )}
          </span>
          <Amount
            value={row.amount}
            className={row.incoming ? 'text-fg-success' : 'text-fg-primary'}
            style={{ fontSize: '3.3582cqw', fontWeight: 500, letterSpacing: '0.0336cqw', lineHeight: 'normal' }}
          />
        </div>
        <div className="flex w-full items-center" style={{ gap: '2.2388cqw' }}>
          <span
            className="whitespace-nowrap text-fg-secondary"
            style={{ fontSize: '2.9851cqw', fontWeight: 500, letterSpacing: '0.0299cqw', lineHeight: 'normal' }}
          >
            {row.date}
          </span>
          <span
            className="min-w-0 flex-1 whitespace-nowrap text-right"
            style={{
              fontSize: '2.9851cqw',
              fontWeight: 500,
              letterSpacing: '0.0299cqw',
              lineHeight: 'normal',
              color: row.incoming ? 'var(--pay-fg-primary)' : 'var(--pay-fg-tertiary)',
            }}
          >
            {row.method}
          </span>
        </div>
      </div>
    </div>
  )
}

export function ActivityScene() {
  const active = useCycle(PAY_ACTIVITY.length, 3200)
  return (
    <Stage ratio={[268, 240]}>
      <div className="absolute inset-0" style={{ scale: '1.1' }}>
        <span
          className="absolute whitespace-nowrap text-fg-secondary"
          style={{ left: '16.4179cqw', top: '13.0597cqw', fontSize: '3.3582cqw', fontWeight: 500, letterSpacing: '0.0336cqw' }}
        >
          Activity
        </span>
        {PAY_ACTIVITY.map((row, i) => (
          <motion.div
            key={row.merchant}
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: `${57.0896 - i * 19.403}cqw`, width: '74.6269cqw', zIndex: 2 + i }}
            animate={{ opacity: i === active ? 1 : 0.55 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <ActivityRow row={row} id={`activity-${i}`} elevated={i === active} />
          </motion.div>
        ))}
      </div>
    </Stage>
  )
}

/* ------------------------------------------------------------------ */
/* 02 — Send money instantly                                           */
/* ------------------------------------------------------------------ */

/** Recipient avatar pair. Drawn rather than photographed — no asset needed. */
function AvatarPair({ seed }: { seed: number }) {
  const hues = [(seed * 67) % 360, (seed * 67 + 140) % 360]
  return (
    <div className="relative shrink-0" style={{ width: '9.7015cqw', height: '5.9701cqw' }}>
      {hues.map((hue, i) => (
        <span
          key={hue}
          className="absolute top-0 rounded-full"
          style={{
            width: '5.9701cqw',
            height: '5.9701cqw',
            left: `${i * 3.7313}cqw`,
            background: `linear-gradient(140deg, hsl(${hue} 62% 62%), hsl(${(hue + 40) % 360} 58% 46%))`,
            boxShadow: i === 1 ? '0 0 0 0.3731cqw var(--pay-bg-primary)' : undefined,
          }}
        />
      ))}
    </div>
  )
}

export function TransfersScene() {
  const active = useCycle(PAY_TRANSFERS.length, 2600)
  return (
    <Stage ratio={[268, 240]}>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: '100cqw', height: 'calc(100cqw * 104 / 268)', containerType: 'inline-size' }}
      >
        {PAY_TRANSFERS.map((transfer, i) => {
          const offset = (i - active + PAY_TRANSFERS.length) % PAY_TRANSFERS.length
          return (
            <div
              key={transfer.recipient}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ width: '76.1194cqw', zIndex: 1000 - offset * 100 }}
            >
              <motion.div
                animate={{
                  opacity: offset === 0 ? 1 : offset === 1 ? 0.64 : 0.32,
                  y: `${-offset * 3.3582}cqw`,
                  scale: 1 - offset * 0.04,
                }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformOrigin: 'center center', boxShadow: offset === 0 ? '0 4px 14px rgba(0,0,0,0.05)' : 'none' }}
              >
                <div
                  className="relative flex flex-col items-start justify-center"
                  style={{
                    width: '100%',
                    gap: '2.2388cqw',
                    padding: '4.4776cqw',
                    background: 'var(--pay-bg-primary)',
                    border: '0.1866cqw solid var(--pay-border-normal)',
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className="whitespace-nowrap font-display font-medium text-fg-primary"
                      style={{ fontSize: '5.2239cqw', letterSpacing: '0.194cqw', lineHeight: '7.4627cqw' }}
                    >
                      {transfer.amount}
                    </span>
                    <AvatarPair seed={i + 3} />
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center" style={{ gap: '0.7463cqw' }}>
                      <span className="whitespace-nowrap" style={{ fontSize: '3.3582cqw', letterSpacing: '0.0336cqw', lineHeight: 1, color: 'var(--pay-fg-secondary)' }}>
                        sent to
                      </span>
                      <div className="flex items-center" style={{ gap: '0.3731cqw' }}>
                        <span className="whitespace-nowrap font-medium text-fg-primary" style={{ fontSize: '3.3582cqw', letterSpacing: '0.0336cqw', lineHeight: 1 }}>
                          {transfer.recipient}
                        </span>
                        <RecipientTick style={{ width: '2.9851cqw', height: '2.9851cqw' }} />
                      </div>
                    </div>
                    <span className="whitespace-nowrap" style={{ fontSize: '3.3582cqw', letterSpacing: '0.0336cqw', lineHeight: 1, color: 'var(--pay-fg-secondary)' }}>
                      {transfer.age}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          )
        })}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[60]"
          style={{ height: '9.7015cqw', background: 'linear-gradient(to top, var(--pay-bg-secondary) 0%, transparent 100%)' }}
        />
      </div>
    </Stage>
  )
}

/* ------------------------------------------------------------------ */
/* 03 — The Card                                                       */
/* ------------------------------------------------------------------ */

/**
 * The card artwork. Rendered rather than shipped as an image so it inherits the
 * page theme and stays sharp at any size the scene scales it to.
 */
export function CardArt({ face }: { face: 'front' | 'back' }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        borderRadius: '5% / 8%',
        background:
          face === 'front'
            ? 'linear-gradient(150deg, #24252a 0%, #101115 55%, #2b2d34 100%)'
            : 'linear-gradient(150deg, #16171b 0%, #0b0c0f 60%, #1d1f24 100%)',
      }}
    >
      {face === 'front' ? (
        <>
          <img
            src="/favicon.svg"
            alt=""
            aria-hidden="true"
            className="absolute"
            style={{ width: '16%', left: '8%', top: '11%', filter: 'brightness(0) invert(1)' }}
          />
          <div
            className="absolute"
            style={{
              left: '8%',
              top: '40%',
              width: '12%',
              height: '15%',
              borderRadius: '10%',
              background: 'linear-gradient(135deg, #e0cd97, #8d7433)',
            }}
          />
          <span className="absolute font-display text-white/85" style={{ left: '8%', bottom: '10%', fontSize: '6.5%', letterSpacing: '0.14em' }}>
            OXY PAY
          </span>

        </>
      ) : (
        <>
          <div className="absolute inset-x-0 bg-black/80" style={{ top: '14%', height: '22%' }} />
          <div className="absolute bg-white/85" style={{ left: '8%', right: '26%', top: '48%', height: '14%', borderRadius: '2%' }} />
          <span className="absolute text-white/60" style={{ right: '8%', top: '49%', fontSize: '7%', letterSpacing: '0.2em' }}>
            123
          </span>
        </>
      )}
    </div>
  )
}

function CardNavIcon({ face }: { face: 'front' | 'back' }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-[2.9cqw] w-[2.9cqw] shrink-0" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.332 2.667c.456 0 .838-.001 1.15.024.318.026.621.083.91.23.438.224.795.58 1.019 1.02.146.287.204.59.23.91.025.311.024.693.024 1.149v4c0 .456.001.838-.024 1.149-.027.319-.084.622-.23.91-.224.44-.58.796-1.02 1.02-.288.146-.59.203-.91.23-.311.025-.693.024-1.149.024H4.665c-.455 0-.837 0-1.149-.025-.319-.026-.622-.083-.91-.23a2.33 2.33 0 0 1-1.02-1.019c-.146-.288-.203-.591-.23-.91a8 8 0 0 1-.021-.52l-.003-.63V6c0-.455 0-.837.025-1.148.026-.32.083-.623.23-.91.223-.44.58-.796 1.02-1.02.287-.147.59-.204.91-.23.31-.025.693-.024 1.148-.024zM4.665 4c-.477 0-.796 0-1.04.02-.236.02-.345.054-.413.089-.189.095-.342.249-.438.437-.035.069-.07.177-.088.413-.02.245-.02.563-.02 1.04v4l.002.608c.003.17.008.31.018.433.019.237.053.345.088.414.096.188.25.341.438.437.068.035.177.07.413.089.244.02.563.02 1.04.02h6.667c.478 0 .796 0 1.04-.02.237-.02.345-.054.414-.089.188-.096.341-.25.437-.437.035-.069.07-.177.089-.414.02-.244.02-.562.02-1.04V6c0-.478 0-.796-.02-1.04-.02-.237-.054-.345-.089-.414a1 1 0 0 0-.437-.437c-.069-.035-.177-.07-.414-.089a14 14 0 0 0-1.04-.02z"
      />
      {face === 'front' ? (
        <path fill="currentColor" d="M6.665 8H4V6h2.666z" />
      ) : (
        <path
          fill="currentColor"
          d="M5.71 9.207a2.594 2.594 0 0 0 0-3.664l.293-.293a3.006 3.006 0 0 1 0 4.25zM3.883 8.37a1.413 1.413 0 0 0 0-2l.293-.293a1.834 1.834 0 0 1 0 2.586z"
        />
      )}
    </svg>
  )
}

export function CardScene() {
  const face = useCycle(2, 3600) === 0 ? 'front' : 'back'
  return (
    <Stage ratio={[552, 240]}>
      <div className="pointer-events-none absolute inset-0" style={{ transform: 'scale(1.1)' }}>
        <div className="absolute top-1/2 left-[18.66%] z-10 flex -translate-y-1/2 flex-col gap-[1.45cqw]">
          {(['front', 'back'] as const).map((item) => (
            <span key={item} className="flex items-center gap-[1.09cqw] text-fg-primary transition-opacity duration-500" style={{ opacity: face === item ? 1 : 0.3 }}>
              <CardNavIcon face={item} />
              <span className="whitespace-nowrap font-medium text-[2.36cqw] leading-[2.9cqw] tracking-[0.04em] capitalize">{item}</span>
            </span>
          ))}
        </div>
        <div className="absolute top-1/2 left-[60.87%] w-[41.3%] -translate-x-1/2 -translate-y-1/2" style={{ perspective: '1000px', perspectiveOrigin: '50% 15%' }}>
          <div className="relative w-full" style={{ aspectRatio: '1.5833333333333333' }}>
            <motion.div
              className="absolute inset-0"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ rotateY: face === 'front' ? 0 : 180 }}
              transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}>
                <CardArt face="front" />
              </div>
              <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <CardArt face="back" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Stage>
  )
}

/* ------------------------------------------------------------------ */
/* 04 — Fees stated up front (tap to pay)                              */
/* ------------------------------------------------------------------ */

export function CashbackScene() {
  const reduced = useReducedMotion()
  const tapped = useCycle(2, 2400) === 1
  /** Reduced motion keeps the receipt on screen rather than blinking it. */
  const paid = Boolean(reduced) || tapped

  return (
    <div className="relative size-full max-h-full max-w-full overflow-hidden" aria-hidden="true" style={{ containerType: 'size', background: 'var(--pay-bg-secondary)' }}>
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 overflow-hidden"
        style={{ width: 'min(100cqw, calc(100cqh * 268 / 240))', height: 'min(100cqh, calc(100cqw * 240 / 268))', containerType: 'inline-size' }}
      >
        <div className="absolute inset-0">
          {/* NFC field */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '14.3284cqw', width: '47.2836cqw', height: '29.5522cqw' }}>
            <svg viewBox="0 0 144 90" fill="none" className="absolute inset-0 block size-full overflow-visible" aria-hidden="true">
              <ellipse cx="72" cy="45.18" rx="31" ry="19" stroke="var(--pay-fg-primary)" strokeWidth="0.75" vectorEffect="non-scaling-stroke" className="pay-nfc-ripple" style={{ animationDelay: '0.5s' }} />
              <ellipse cx="72" cy="45.18" rx="31" ry="19" stroke="var(--pay-fg-primary)" strokeWidth="0.75" vectorEffect="non-scaling-stroke" className="pay-nfc-ripple" style={{ animationDelay: '0.9s' }} />
              <ellipse cx="72" cy="45.18" rx="31" ry="19" stroke="var(--pay-border-normal)" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
              <g fill="var(--pay-fg-primary)" transform="translate(64.79 36)" className="pay-nfc-glyph">
                <path d="M11.0352 18.2048C10.7439 18.1189 10.445 17.7714 10.3815 17.4389C10.3404 17.2222 10.3889 17.0728 10.699 16.4713C11.9543 14.043 12.4997 11.8089 12.4997 9.10032C12.4997 6.4814 12.0178 4.44158 10.8186 1.99827C10.5608 1.47525 10.3516 0.98584 10.3516 0.914856C10.3516 0.653336 10.5683 0.27601 10.8036 0.130308C11.1249 -0.0714327 11.6666 -0.0340728 11.9281 0.208762C12.029 0.302161 12.2868 0.728056 12.5035 1.15395C13.3628 2.83886 13.9492 4.68815 14.2407 6.61215C14.42 7.80392 14.4574 10.0604 14.3116 11.1513C14.0464 13.1613 13.5159 14.9582 12.6641 16.7142C12.1485 17.7751 11.8272 18.2122 11.5583 18.2122C11.506 18.2122 11.4163 18.2272 11.364 18.2422C11.3117 18.257 11.1623 18.2422 11.0352 18.2048Z" />
                <path d="M7.54675 16.3744C7.09843 16.2436 6.77347 15.6907 6.90419 15.2797C6.93411 15.1788 7.14699 14.7193 7.37491 14.2561C8.33507 12.2948 8.73483 10.1952 8.54051 8.13293C8.37987 6.43679 8.07731 5.36831 7.31139 3.80669C6.79955 2.7569 6.77347 2.59625 7.07227 2.17035C7.35627 1.76687 8.06603 1.70336 8.43595 2.04333C8.69371 2.2787 9.49691 3.95613 9.80699 4.90506C10.8307 8.04325 10.6737 11.4168 9.36243 14.4989C8.68627 16.0792 8.21179 16.5686 7.54675 16.3744Z" />
                <path d="M3.94099 14.5238C3.66453 14.4005 3.42543 14.1053 3.35819 13.8102C3.31709 13.6309 3.38807 13.4291 3.71684 12.7642C4.92728 10.3134 4.93849 7.956 3.75793 5.56124C3.23864 4.51144 3.22743 4.30222 3.66454 3.88753C3.88122 3.68206 3.97461 3.64844 4.27722 3.64844C4.78905 3.64844 5.0543 3.90621 5.51009 4.84393C6.21244 6.28601 6.50014 7.53754 6.49638 9.14024C6.49262 10.7878 6.22365 11.9198 5.47646 13.4403C5.04683 14.3108 4.83388 14.5424 4.40425 14.5985C4.27349 14.6097 4.06428 14.5798 3.94099 14.5238Z" />
                <path d="M0.581297 12.7961C0.360881 12.7065 0.110569 12.4076 0.0358491 12.1461C-0.0463429 11.8546 0.020905 11.623 0.349673 11.0813C0.775569 10.3827 0.872697 10.0091 0.872697 9.09752C0.872697 8.18592 0.775569 7.80864 0.349673 7.11374C0.203969 6.87838 0.0620011 6.59445 0.0283771 6.48238C-0.109847 6.02286 0.274953 5.45873 0.790513 5.36159C1.22762 5.2794 1.52649 5.47367 1.92997 6.1013C3.09185 7.91696 3.09185 10.3378 1.92997 12.1386C1.51902 12.7699 1.06323 12.9941 0.581297 12.7961Z" />
              </g>
            </svg>
          </div>

          {/* Phone holding the card */}
          <div className="absolute -translate-x-1/2" style={{ left: '49.6269cqw', top: '45.5224cqw', width: '78.3582cqw' }}>
            <div className="relative" style={{ width: '100%', aspectRatio: '210 / 430', filter: 'drop-shadow(0 1.4925cqw 3.3582cqw rgba(0,0,0,0.12))' }}>
              <div
                className="absolute overflow-hidden bg-black"
                style={{ inset: 0, borderRadius: '11.194cqw', border: '1.1cqw solid #2a2b30' }}
              >
                <div className="absolute overflow-hidden" style={{ top: '11.5cqw', left: '5.5cqw', width: '61.227cqw', height: '38.68cqw', borderRadius: '2.2388cqw' }}>
                  <div className="relative size-full">
                    <CardArt face="front" />
                  </div>
                </div>
                <div className="absolute inset-x-0 flex items-center justify-between" style={{ top: '4cqw', paddingInline: '5.9701cqw' }}>
                  <span className="font-semibold text-white" style={{ fontSize: '2.8806cqw', lineHeight: 1 }}>
                    4:20
                  </span>
                  <span className="rounded-full bg-white/70" style={{ width: '7cqw', height: '1.6cqw' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Receipt: the fee is part of the confirmation, not a surprise */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: '30.597cqw', width: '66.0448cqw', zIndex: 3 }}
            animate={{ opacity: paid ? 1 : 0, y: paid ? 0 : 8 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >
            <div
              className="relative flex items-center"
              style={{
                width: '100%',
                gap: '2.9851cqw',
                padding: '4.4776cqw',
                background: 'var(--pay-bg-primary)',
                border: '0.1866cqw solid var(--pay-border-normal)',
                boxShadow: '0 1.4925cqw 5.2239cqw rgba(0,0,0,0.06)',
              }}
            >
              <div
                className="relative flex shrink-0 items-center justify-center overflow-hidden"
                style={{
                  width: '10.4478cqw',
                  height: '10.4478cqw',
                  borderRadius: '1.4925cqw',
                  background: 'var(--pay-bg-secondary)',
                  border: '0.1866cqw solid var(--pay-border-normal)',
                }}
              >
                <svg viewBox="175.2 61.04 11.6 13.92" fill="none" className="block" aria-hidden="true" style={{ width: '4.9739cqw', height: '5.9701cqw' }}>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M183.912 62.6301H186.684L185.388 66.7073C186.252 67.4009 186.801 68.4341 186.801 69.5886C186.801 71.6769 185.007 73.3699 182.795 73.3699H182.646L182.31 74.9585H177.975L178.312 73.3699H175.203L176.572 69.0605C175.862 68.3782 175.423 67.4434 175.423 66.4113C175.423 64.323 177.216 62.6301 179.429 62.6301H179.577L179.914 61.0414H184.248L183.912 62.6301ZM180.627 63.8377H179.429C177.923 63.8377 176.702 64.9899 176.702 66.4113C176.702 67.8327 177.923 68.9848 179.429 68.9848H182.795C183.148 68.9848 183.435 69.2552 183.435 69.5886C183.435 69.9221 183.148 70.1925 182.795 70.1925H177.548L176.922 72.1622H179.872L179.536 73.7509H181.26L181.597 72.1622H182.795C184.301 72.1622 185.521 71.0101 185.521 69.5886C185.521 68.1672 184.301 67.0151 182.795 67.0151H179.429C179.075 67.0151 178.789 66.7447 178.789 66.4113C178.789 66.0779 179.075 65.8074 179.429 65.8074H184.339L184.964 63.8377H182.351L182.688 62.249H180.963L180.627 63.8377Z"
                    fill="var(--pay-fg-primary)"
                  />
                </svg>
              </div>
              <div className="flex min-w-0 flex-1 flex-col" style={{ gap: '1.4925cqw' }}>
                <div className="flex w-full items-center justify-between">
                  <span className="whitespace-nowrap text-fg-primary" style={{ fontSize: '3.3582cqw', fontWeight: 500, letterSpacing: '0.0336cqw', lineHeight: 1 }}>
                    Network fee
                  </span>
                  <span className="whitespace-nowrap text-fg-secondary" style={{ fontSize: '3.3582cqw', fontWeight: 500, letterSpacing: '0.0336cqw', lineHeight: 1 }}>
                    $0.02
                  </span>
                </div>
                <span className="whitespace-nowrap" style={{ fontSize: '2.9851cqw', fontWeight: 500, letterSpacing: '0.0299cqw', lineHeight: 1, color: 'var(--pay-fg-secondary)' }}>
                  16 Jul 2026
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 05 — Security (Face ID)                                             */
/* ------------------------------------------------------------------ */

export function SecurityScene() {
  const verified = useCycle(2, 2600) === 1
  return (
    <svg viewBox="92 78 84 84" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full max-h-full max-w-full" aria-hidden="true">
      <path
        d="M104.49 107.58L104 106.75V99.9L104.02 98.92L104.17 97.96L104.38 97L104.7 96.08L105.1 95.19L105.6 94.35L106.18 93.56L106.83 92.83L107.56 92.18L108.35 91.6L109.19 91.11L110.08 90.71L111.01 90.39L111.96 90.17L112.93 90.01L120.75 90L121.62 90.54L122 91.48L121.7 92.45L120.86 93.02L113.63 93.1L112.6 93.19L111.6 93.43L110.65 93.82L109.77 94.36L108.99 95.03L108.32 95.82L107.79 96.71L107.41 97.66L107.18 98.67L107.1 99.7L107.09 105.9L107.01 106.92L106.4 107.73L105.42 107.99L104.49 107.58Z"
        fill="var(--pay-border-normal)"
      />
      <path
        d="M154.96 90L155.7 90.11L157.15 90.44L158.54 90.98L159.83 91.73L160.98 92.67L161.98 93.78L162.79 95.03L163.4 96.38L163.79 97.82L163.96 99.3L163.99 106.01L163.95 106.75L163.64 107.42L163.05 107.87L161.82 107.87L161 106.96L160.9 105.7L160.88 99.38L160.7 98.12L160.3 96.93L159.66 95.84L158.82 94.89L157.83 94.1L156.71 93.52L155.49 93.19L154.23 93.11L147.91 93.1L146.69 92.84L146.01 91.81L146.31 90.62L147.37 90H154.96Z"
        fill="var(--pay-border-normal)"
      />
      <path
        d="M121.62 149.45L120.79 149.95L119.82 149.99H112.96L111.99 149.82L111.03 149.61L110.1 149.3L109.21 148.89L108.36 148.4L107.57 147.82L106.84 147.17L106.19 146.44L105.61 145.65L105.11 144.81L104.7 143.92L104.39 142.99L104.17 142.04L104.02 141.07L104 133.23L104.54 132.37L105.47 131.99L106.44 132.28L107.02 133.12L107.09 134.14L107.08 139.3L107.09 140.33L107.18 141.36L107.42 142.36L107.81 143.31L108.34 144.19L109.01 144.98L109.79 145.64L110.67 146.18L111.63 146.57L112.63 146.8L113.65 146.89L120.87 146.97L121.7 147.54L121.99 148.51L121.62 149.45Z"
        fill="var(--pay-border-normal)"
      />
      <path
        d="M163.41 132.33L163.97 133.4L164.01 137.14L163.93 140.87L163.51 143.32L163.06 144.49L162.46 145.58L161.72 146.58L160.85 147.47L159.87 148.24L158.81 148.88L157.66 149.37L156.47 149.72L155.24 149.92L153.99 149.98L147.76 149.99L146.59 149.66L146 148.6L146.37 147.45L147.46 146.92L151.19 146.9L154.25 146.9L155.01 146.85L155.76 146.73L156.5 146.52L157.2 146.23L157.87 145.86L158.49 145.41L159.05 144.89L159.55 144.31L159.98 143.68L160.33 143L160.59 142.28L160.77 141.54L160.87 140.78L160.9 133.9L160.96 133.14L161.33 132.48L161.96 132.07L162.72 132.02L163.41 132.33Z"
        fill="var(--pay-border-normal)"
      />
      <motion.g fill="var(--pay-fg-primary)" animate={{ opacity: verified ? 0 : 1 }} transition={{ duration: 0.4 }}>
        <g className="pay-face-bob">
          <path d="M120.305 114.79C120.305 114.106 120.305 113.425 120.305 112.74C120.305 112.158 120.503 111.666 120.983 111.321C121.853 110.7 123.053 111.216 123.266 112.296C123.275 112.344 123.287 112.392 123.287 112.44C123.287 114.019 123.323 115.6 123.269 117.178C123.242 117.988 122.54 118.552 121.784 118.543C121.034 118.534 120.38 117.937 120.335 117.13C120.29 116.353 120.326 115.57 120.326 114.79H120.308H120.305Z" />
          <path d="M145.051 114.781C145.051 114.031 145.033 113.277 145.057 112.527C145.078 111.834 145.594 111.225 146.227 111.087C147.133 110.892 148.009 111.573 148.033 112.563C148.066 114.055 148.063 115.549 148.033 117.043C148.015 117.913 147.316 118.555 146.509 118.543C145.708 118.528 145.072 117.856 145.051 116.977C145.036 116.245 145.048 115.513 145.048 114.781H145.054H145.051Z" />
          <path d="M134.491 138.406C130.002 138.409 126.51 137.104 123.545 134.404C122.828 133.75 122.732 132.796 123.329 132.111C123.917 131.433 124.913 131.385 125.628 132.033C127.035 133.315 128.613 134.317 130.467 134.776C134.812 135.859 138.791 135.184 142.217 132.138C142.703 131.706 143.219 131.457 143.867 131.631C145.058 131.949 145.452 133.435 144.551 134.284C142.904 135.841 141.008 136.99 138.842 137.68C137.266 138.181 135.652 138.412 134.491 138.406Z" />
          <path d="M137.151 118.267C137.151 120.044 137.157 121.82 137.151 123.596C137.145 125.045 136.65 126.266 135.438 127.134C134.733 127.638 133.931 127.86 133.073 127.881C132.587 127.893 132.092 127.911 131.612 127.848C130.814 127.74 130.244 126.981 130.31 126.194C130.376 125.393 131.036 124.757 131.837 124.736C132.179 124.727 132.521 124.736 132.863 124.733C133.676 124.724 133.991 124.409 133.991 123.587C133.991 119.966 133.991 116.344 133.991 112.722C133.991 112.107 134.225 111.618 134.745 111.291C135.255 110.97 135.795 110.952 136.329 111.252C136.878 111.561 137.151 112.044 137.151 112.671C137.157 114.535 137.151 116.401 137.151 118.264V118.267Z" />
        </g>
      </motion.g>
      <motion.path
        d="M123 120.5L130.5 130.5L143 111.5"
        fill="none"
        stroke="var(--pay-fg-success)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
        animate={{ opacity: verified ? 1 : 0, scale: verified ? 1 : 0.5 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* 06 — Support                                                        */
/* ------------------------------------------------------------------ */

export function SupportScene() {
  return (
    <Stage ratio={[268, 240]} scale={1.1}>
      <div className="absolute flex flex-col items-end" style={{ left: '8.9552cqw', top: '19.0299cqw', width: '82.0896cqw', gap: '1.4925cqw' }}>
        <motion.div
          className="flex w-full justify-start"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="flex flex-col items-start justify-center"
            style={{
              background: 'var(--pay-bg-primary)',
              border: '0.1866cqw solid var(--pay-border-normal)',
              borderTopRightRadius: '1.4925cqw',
              padding: '2.9851cqw 4.4776cqw',
            }}
          >
            <p className="m-0 whitespace-nowrap" style={{ fontSize: '4.4776cqw', lineHeight: '6.7164cqw', letterSpacing: '0.041cqw', color: 'var(--pay-fg-primary)' }}>
              Has my mailed check gone out yet?
            </p>
          </div>
        </motion.div>
        <motion.div
          className="flex items-center"
          style={{ gap: '0.7463cqw' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <svg viewBox="0 0 12 12" fill="none" className="block shrink-0" style={{ width: '4.4776cqw', height: '4.4776cqw' }} aria-hidden="true">
            <path d="M2.4 6.3 L4.7 8.6 L9.6 3.4" stroke="var(--pay-fg-tertiary)" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="whitespace-nowrap" style={{ fontSize: '3.7313cqw', lineHeight: 1, letterSpacing: '0.0336cqw', fontWeight: 500, color: 'var(--pay-fg-tertiary)' }}>
            Read
          </span>
        </motion.div>
      </div>
      <div className="absolute flex flex-col items-start" style={{ left: '8.9552cqw', top: '43.2836cqw', width: '82.0896cqw', gap: '2.2388cqw' }}>
        <motion.div
          className="flex w-full justify-start"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div
            className="flex flex-col items-start justify-center"
            style={{
              background: 'var(--pay-bg-tertiary)',
              borderTopLeftRadius: '1.4925cqw',
              padding: '2.9851cqw 4.4776cqw',
              height: '19.403cqw',
            }}
          >
            <p className="m-0 whitespace-nowrap" style={{ fontSize: '4.4776cqw', lineHeight: '6.7164cqw', letterSpacing: '0.041cqw', color: 'var(--pay-fg-primary)' }}>
              Your check has shipped and should
            </p>
            <p className="m-0 whitespace-nowrap" style={{ fontSize: '4.4776cqw', lineHeight: '6.7164cqw', letterSpacing: '0.041cqw', color: 'var(--pay-fg-primary)' }}>
              arrive in about 2 business days.
            </p>
          </div>
        </motion.div>
        <motion.div
          className="flex items-center"
          style={{ gap: '2.2388cqw' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <span
            className="relative block shrink-0 overflow-hidden rounded-full"
            style={{
              width: '5.2239cqw',
              height: '5.2239cqw',
              background: 'linear-gradient(140deg, hsl(24 62% 62%), hsl(348 58% 46%))',
              border: '0.1866cqw solid var(--pay-border-normal)',
            }}
          />
          <span className="whitespace-nowrap" style={{ fontSize: '3.7313cqw', lineHeight: 1, letterSpacing: '0.0336cqw', fontWeight: 500, color: 'var(--pay-fg-tertiary)' }}>
            John
          </span>
        </motion.div>
      </div>
    </Stage>
  )
}
