import Fingerprint from './OriginalFingerprint'
import CommonsIcon from './CommonsIcon'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import { COMMONS_APPS } from './commonsData'

export function CommonsMark({ className = '' }: { className?: string }) {
  return <span className={`commons-mark ${className}`} aria-hidden="true" />
}

export { default as Fingerprint } from './OriginalFingerprint'

export function FingerprintChip() {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'checked'>('idle')
  useEffect(() => {
    if (phase === 'idle') return
    const timer = window.setTimeout(() => setPhase(phase === 'scanning' ? 'checked' : 'idle'), phase === 'scanning' ? 1100 : 1600)
    return () => window.clearTimeout(timer)
  }, [phase])
  return <button type="button" className="commons-fingerprint commons-manifesto-chip" aria-label="Animate the fingerprint" onClick={() => setPhase('scanning')} data-phase={phase} data-checked={phase === 'checked'}>
    <Fingerprint className="commons-fingerprint-lines" />
    <svg className="commons-fingerprint-check" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M2.7 9.7 7.95 14.6 17.3 4.7" pathLength="100" stroke="currentColor" strokeWidth="2" /></svg>
  </button>
}

export function AppChips() {
  const [offset, setOffset] = useState(0)
  const names = Array.from({ length: 3 }, (_, i) => COMMONS_APPS[(i + offset) % COMMONS_APPS.length])
  return <button type="button" className="commons-app-chips" aria-label={`Show more Oxy apps. Currently ${names.map((app) => app.name).join(', ')}`} onClick={() => setOffset((value) => (value + 1) % COMMONS_APPS.length)}>
    {names.map((app, i) => <img key={app.name} src={app.image} alt="" style={{ '--chip-index': i } as CSSProperties} />)}
  </button>
}

export { default as AppOrbit } from './AppOrbit'

export function PrivacySky() {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { amount: 0.3 })
  const [shooting, setShooting] = useState(0)
  return <div ref={ref} className="commons-bento commons-sky" data-playing={visible}>
    <svg viewBox="0 0 400 400" className="absolute inset-0 size-full" aria-hidden="true">
      {Array.from({ length: 6 }, (_, group) => <g key={group} className="commons-stars" style={{ animationDelay: `${group * -1.7}s` }}>
        {Array.from({ length: 20 }, (_, i) => <circle key={i} cx={(i * 79.3 + group * 31.7) % 400} cy={(i * i * 13.7 + group * 73.3) % 400} r={i % 7 === 0 ? 1.1 : 0.5} />)}
      </g>)}
    </svg>
    <button type="button" className="commons-star-trigger" aria-label="Make a shooting star" onClick={() => setShooting((value) => value + 1)}>✦</button>
    {shooting > 0 && <span key={shooting} className="commons-shooting-star" aria-hidden="true" />}
    <div className="commons-lock-disc" aria-hidden="true">
      <CommonsIcon name="lock" size={44} />
    </div>
  </div>
}

export function AppBadges() {
  return <div className="commons-bento commons-badges" aria-hidden="true"><div className="commons-badge-grid">
    {COMMONS_APPS.filter((app) => app.name !== 'Accounts').map((app, i) => <div key={i} className="commons-badge"><img src={app.image} alt="" loading="lazy" /></div>)}
  </div></div>
}

export function CommonsPhoneFilm() {
  const root = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const visible = useInView(root, { amount: 0.2 })
  const reduced = useReducedMotion()

  useEffect(() => {
    const element = video.current
    if (!element) return
    const update = () => {
      if (visible && !reduced && document.visibilityState === 'visible') void element.play().catch(() => {})
      else element.pause()
    }
    update()
    document.addEventListener('visibilitychange', update)
    return () => { document.removeEventListener('visibilitychange', update); element.pause() }
  }, [visible, reduced])

  return <div ref={root} className="commons-bento commons-phone-film" aria-hidden="true">
    <video ref={video} src={visible && !reduced ? '/images/commons/floral.mp4' : undefined} poster="/images/commons/floral-poster.webp" muted loop playsInline preload="none" />
    <CommonsMark />
  </div>
}
