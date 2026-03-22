import Button from '../ui/Button'
import { finalCTA } from '../../data/homepage'

export default function HomeFinalCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="container">
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <h2 className="text-center text-heading-md">
            <span className="block overflow-hidden">
              <span
                className="block animate-fade-in-up"
                style={{ animationDelay: '600ms' }}
              >
                {finalCTA.line1}
              </span>
            </span>
            <span className="block overflow-hidden">
              <span
                className="block pb-0.5 animate-fade-in-up"
                style={{ animationDelay: '750ms', fontFamily: 'serif' }}
              >
                {finalCTA.line2}
              </span>
            </span>
          </h2>
          <div
            className="mt-6 flex items-center gap-2 animate-fade-in-up"
            style={{ animationDelay: '1000ms' }}
          >
            <Button variant="primary" size="md" href="#">
              Start for free
            </Button>
            <Button variant="outline" size="md" href="#">
              Talk to sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
