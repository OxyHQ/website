import { testimonials } from '../../data/content'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import TestimonialCard from '../ui/TestimonialCard'

export default function TestimonialsSection() {
  const ref = useScrollReveal()

  return (
    <section className="py-16 lg:py-24" ref={ref}>
      <div className="relative overflow-hidden scroll-reveal">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--color-primary-bg)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--color-primary-bg)] to-transparent" />

        {/* Scrollable track */}
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="snap-start">
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
