import { closingSection } from '../../data/initiative'
import Button from '../ui/Button'

export default function ClosingSection() {
  return (
    <section className="w-full bg-surface">
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <div className="flex flex-col border-x border-border">
          {/* Top decoration */}
          <div className="relative grid grid-cols-12 overflow-hidden border-b border-border max-lg:hidden">
            <svg width="1" height="100%" className="relative col-2 h-8 text-border max-xl:hidden">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
            <div className="col-[8/-2] flex h-8 justify-between max-lg:*:hidden">
              <svg width="1" height="100%" className="text-border">
                <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeLinecap="round" />
              </svg>
              <svg width="1" height="100%" className="text-border">
                <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-12">
            <div className="col-[2/8] flex flex-col justify-center gap-y-7 py-24 max-lg:col-[2/-2]">
              <div className="col-[1/-2] max-w-[20em] text-pretty text-heading-responsive-sm text-start">
                <h2 className="inline text-pretty">{closingSection.heading}</h2>
              </div>
              <p className="max-w-xl text-pretty text-lg text-muted-foreground">
                {closingSection.body}
              </p>
              <div className="flex gap-3">
                <Button variant="primary" size="md" responsive href="#get-involved">
                  Get involved
                </Button>
                <Button variant="outline" size="md" responsive href="/initiative">
                  Learn more
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
