import type { Testimonial } from '../../data/content'

interface TestimonialCardProps {
  testimonial: Testimonial
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="flex min-w-[300px] max-w-[400px] shrink-0 flex-col justify-between rounded-xl border border-[var(--color-subtle-stroke)] bg-[var(--color-secondary-bg)] p-6">
      <blockquote className="text-base leading-relaxed text-[var(--color-secondary-fg)]">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-tertiary-fg)]">
          {testimonial.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-primary-fg)]">
            {testimonial.name}
          </p>
          <p className="text-sm text-[var(--color-accent-fg)]">
            {testimonial.role}, {testimonial.company}
          </p>
        </div>
      </div>
    </div>
  )
}
