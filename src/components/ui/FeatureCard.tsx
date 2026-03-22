import type { Capability } from '../../data/content'

interface FeatureCardProps {
  capability: Capability
}

export default function FeatureCard({ capability }: FeatureCardProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-[var(--color-subtle-stroke)] p-6 last:border-b-0 lg:border-b-0 lg:border-r lg:p-8 lg:last:border-r-0">
      <div>
        <h3 className="text-heading-responsive-sm text-[var(--color-primary-fg)]">
          {capability.title}
        </h3>
        <p className="mt-2 text-base text-[var(--color-tertiary-fg)]">
          {capability.description}
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {capability.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--color-secondary-fg)]">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-blue-400)]"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M13.5 4.5L6.5 11.5L3 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
