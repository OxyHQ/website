/**
 * The platform visual: what happens between a request and an answer.
 *
 * Inline SVG rather than canvas or Three.js, for three reasons that all matter
 * on this page. It paints with the first frame instead of after a canvas
 * initialises. It costs nothing on a phone, and nothing at all on a route that
 * does not render it. And it says something true — request, route, model,
 * deployment, stream, receipt are the six objects the rest of the site names —
 * where the giant Alia mark it replaced said "Oxy AI is Alia".
 *
 * Colours are Bloom tokens via `var(--color-…)`, so the diagram follows the
 * theme instead of carrying a palette of its own. The one animation is a dash
 * offset on the connecting path — `.ai-routing-flow` in `src/index.css`, which
 * is where its `prefers-reduced-motion` opt-out lives too.
 */
import { useId } from 'react'

const STAGES: ReadonlyArray<{ key: string; label: string; caption: string }> = [
  { key: 'request', label: 'Request', caption: 'Your application' },
  { key: 'route', label: 'Route', caption: 'Policy and constraints' },
  { key: 'model', label: 'Model', caption: 'Catalogue id' },
  { key: 'deployment', label: 'Deployment', caption: 'Provider and region' },
  { key: 'stream', label: 'Stream', caption: 'Tokens back' },
  { key: 'receipt', label: 'Receipt', caption: 'Usage and cost' },
]

export default function RoutingDiagram({ className = '' }: { className?: string }) {
  const gradientId = useId()

  return (
    <div className={className}>
      <svg
        viewBox="0 0 960 180"
        className="h-auto w-full max-w-full"
        role="img"
        aria-label="A request passes through routing policy to a model, is served by a deployment in a region, streams back, and produces a usage receipt."
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-border)" />
            <stop offset="50%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-border)" />
          </linearGradient>
        </defs>

        {/* The spine every stage sits on. */}
        <line x1="40" y1="70" x2="920" y2="70" stroke="var(--color-border)" strokeWidth="1" />
        <line
          x1="40"
          y1="70"
          x2="920"
          y2="70"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          strokeDasharray="6 10"
          className="ai-routing-flow"
        />

        {STAGES.map((stage, index) => {
          const x = 40 + index * ((920 - 40) / (STAGES.length - 1))
          return (
            <g key={stage.key}>
              <circle cx={x} cy="70" r="9" fill="var(--color-background)" stroke="var(--color-border)" />
              <circle cx={x} cy="70" r="3.5" fill="var(--color-primary)" />
              <text
                x={x}
                y="108"
                textAnchor="middle"
                className="fill-foreground"
                style={{ fontSize: '15px' }}
              >
                {stage.label}
              </text>
              <text
                x={x}
                y="130"
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: '12px' }}
              >
                {stage.caption}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
