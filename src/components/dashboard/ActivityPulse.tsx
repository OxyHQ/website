import { useEffect, useRef, useState } from 'react'

interface ActivityPulseProps {
  path: string
  color: string
  internal: boolean
  length: number
  gap: number
  duration: number
  phase: number
}

/** A persistent animation changes playback speed without restarting on each batch. */
export default function ActivityPulse({ path, color, internal, length, gap, duration, phase }: ActivityPulseProps) {
  const node = useRef<SVGPathElement>(null)
  const animation = useRef<Animation | undefined>(undefined)
  // The phase this pulse started at, captured once: a later `phase` prop
  // changes the train's timing, never restarts it. Held in state rather than a
  // ref because the initial dash offset is rendered.
  const [initialPhase] = useState(phase)
  useEffect(() => {
    if (!node.current?.animate) return
    const current = node.current.animate([{ strokeDashoffset: '0' }, { strokeDashoffset: '-100' }], { duration: 1_000, iterations: Infinity, easing: 'linear' })
    current.currentTime = initialPhase * 1_000
    animation.current = current
    return () => { current.cancel(); animation.current = undefined }
  }, [initialPhase])
  useEffect(() => { animation.current?.updatePlaybackRate(1_000 / duration) }, [duration])
  return <path ref={node} data-traffic-pulse="true" d={path} pathLength={100} fill="none" stroke={color} strokeWidth={internal ? 1.5 : 2} strokeLinecap="round" strokeDasharray={`${length * 100} ${gap * 100}`} strokeDashoffset={-initialPhase * 100} opacity={0.95} />
}
