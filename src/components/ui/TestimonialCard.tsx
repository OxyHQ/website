import type { Testimonial } from '../../data/content'

interface TestimonialCardProps {
  testimonial: Testimonial
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="flex min-w-[300px] max-w-[400px] shrink-0 flex-col justify-between rounded-xl border border-subtle-stroke bg-secondary-background p-6">
      <blockquote className="text-base leading-relaxed text-secondary-foreground">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-sm font-semibold text-tertiary-foreground">
          {testimonial.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium text-primary-foreground">
            {testimonial.name}
          </p>
          <p className="text-sm text-accent-foreground">
            {testimonial.role}, {testimonial.company}
          </p>
        </div>
      </div>
    </div>
  )
}
