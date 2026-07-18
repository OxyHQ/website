import type { ReactNode } from 'react'

export interface PartnerProgramCardProps {
  number: string
  label: string
  title: string
  description: string
  benefits: readonly string[]
  ctaText: string
  ctaHref: string
  icon: ReactNode
}

function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="size-4 transition-transform duration-300 group-hover:translate-x-1"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="mt-0.5 size-3.5 shrink-0 text-foreground/70"
      aria-hidden="true"
    >
      <path
        d="M3 7.5l2.5 2.5L11 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function PartnerProgramCard({
  number,
  label,
  title,
  description,
  benefits,
  ctaText,
  ctaHref,
  icon,
}: PartnerProgramCardProps) {
  return (
    <a
      href={ctaHref}
      className="group relative flex h-full flex-col gap-6 bg-background p-8 transition-colors duration-300 hover:bg-surface lg:p-10"
      aria-label={`${title}: ${ctaText}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface text-foreground/70"
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="text-overline text-muted-foreground">
          {number} / {label}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-pretty text-2xl font-medium text-foreground">{title}</h3>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>

      <ul className="flex flex-col gap-2 text-sm text-foreground/80">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <CheckIcon />
            <span className="text-pretty">{benefit}</span>
          </li>
        ))}
      </ul>

      <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-foreground">
        {ctaText}
        <ArrowRightIcon />
      </span>
    </a>
  )
}
