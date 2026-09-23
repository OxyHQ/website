import type { ReactNode } from 'react'
import { Smiley, MagnifyingGlass, GlobeHemisphereWest, Lock } from '@phosphor-icons/react'

interface Feature {
  title: string
  description: string
  icon: ReactNode
  /**
   * Top → bottom of the grainy gradient tile, and the ink on it: Bloom tokens,
   * read inside `.homiio-landing-accent-theme` (the landing's dark ramp, where
   * the vivid tones live).
   */
  from: string
  to: string
  ink: string
}

const FEATURES: readonly Feature[] = [
  {
    title: 'Meet Sindi',
    description: 'AI assistant gives step-by-step legal guidance, explains tenant rights, and automates defense letters.',
    icon: <Smiley weight="bold" className="h-1/3 w-1/3" />,
    from: 'var(--tertiary)',
    to: 'var(--chart-9)',
    ink: 'text-tertiary-foreground',
  },
  {
    title: 'Advanced property search',
    description: 'Find properties using a smart map, detailed filters, and search by community standards and ethical pricing.',
    icon: <MagnifyingGlass weight="bold" className="h-1/3 w-1/3" />,
    from: 'var(--error)',
    to: 'color-mix(in oklab, var(--error) 70%, var(--background))',
    ink: 'text-error-foreground',
  },
  {
    title: 'Secure Oxy integration',
    description: 'All actions linked to your Oxy account, ensuring privacy, security, and unified identity across the ecosystem.',
    icon: (
      <div className="relative grid h-1/3 w-1/3 place-items-center">
        <GlobeHemisphereWest weight="bold" className="h-full w-full" />
        <Lock weight="fill" className="absolute -bottom-1 -right-1 h-1/2 w-1/2 drop-shadow" />
      </div>
    ),
    from: 'var(--chart-1)',
    to: 'var(--success)',
    ink: 'text-success-foreground',
  },
]

/** Ribbed-scanline texture layered over each tile's colour gradient. */
function tileBackground(from: string, to: string): string {
  return [
    'repeating-linear-gradient(180deg, color-mix(in srgb, var(--background) 18%, transparent) 0px, color-mix(in srgb, var(--background) 18%, transparent) 7px, color-mix(in srgb, var(--foreground) 6%, transparent) 7px, color-mix(in srgb, var(--foreground) 6%, transparent) 14px)',
    `linear-gradient(180deg, ${from}, ${to})`,
  ].join(', ')
}

export default function HomiioFeatureCards() {
  return (
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
      {FEATURES.map((feature) => (
        <div key={feature.title} className="flex flex-col text-left">
          <div
            className={`homiio-landing-accent-theme relative grid aspect-[5/3] place-items-center overflow-hidden rounded-3xl ${feature.ink}`}
            style={{ backgroundImage: tileBackground(feature.from, feature.to) }}
          >
            <div className="absolute inset-0 opacity-[0.18] [background-image:url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22120%22%20height=%22120%22%3E%3Cfilter%20id=%22n%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.9%22%20numOctaves=%222%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23n)%22/%3E%3C/svg%3E')] [background-size:140px]" />
            {feature.icon}
          </div>
          <h3 className="mt-4 text-lg font-bold text-foreground">{feature.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
        </div>
      ))}
    </div>
  )
}
