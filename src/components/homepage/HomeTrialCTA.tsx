import Button from '../ui/Button'
import { useScrollReveal } from '../../hooks/useScrollReveal'

export default function HomeTrialCTA() {
  const sectionRef = useScrollReveal()

  return (
    <section ref={sectionRef} className="bg-primary-background">
      <div className="container">
        <div className="border-subtle-stroke border-x">
          <div className="grid grid-cols-12 py-20 lg:py-32">
            <div className="scroll-reveal col-[2/-2] flex flex-col items-center justify-between gap-8 lg:col-[2/7] lg:flex-col lg:items-start">
              <h2 className="text-center text-heading-responsive-md lg:text-left">
                Start with a 14-day
                <br />
                <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  free trial of Pro.
                </span>
              </h2>
              <div className="flex items-center gap-2.5">
                <Button variant="primary" size="md" href="#">
                  Start for free
                </Button>
                <Button variant="outline" size="md" href="#">
                  Talk to sales
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
