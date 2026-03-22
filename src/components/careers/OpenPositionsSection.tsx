import { useState } from 'react'
import { jobListings } from '../../data/careers'
import { useScrollReveal } from '../../hooks/useScrollReveal'

export default function OpenPositionsSection() {
  const [activeLocation, setActiveLocation] = useState('All locations')
  const ref = useScrollReveal()
  const locations = ['All locations', 'Europe', 'United Kingdom', 'United States']

  const filteredJobs = activeLocation === 'All locations'
    ? jobListings
    : jobListings.filter(j => j.location.includes(activeLocation === 'United Kingdom' ? 'UK' : activeLocation === 'United States' ? 'US' : activeLocation))

  return (
    <section className="container" id="open-positions">
      <div className="flex flex-col overflow-hidden border-subtle-stroke border-x">
        {/* Header */}
        <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center">
          <div className="flex max-w-lg flex-col gap-4 max-lg:gap-3 text-center col-[2/-2] mix-blend-multiply dark:mix-blend-screen">
            <h2 className="text-pretty text-heading-responsive-md">Open positions.</h2>
            <p className="text-pretty text-tertiary text-xl">If you want to share our mission of building the definitive CRM, we'd love to hear from you.</p>
          </div>
        </header>

        {/* Location filter tabs */}
        <div ref={ref} className="relative grid grid-cols-12 pb-5">
          <div className="relative col-[2/-2] flex gap-2 max-lg:grid max-lg:grid-cols-2 justify-center max-lg:gap-1.5">
            {locations.map(loc => (
              <button
                key={loc}
                onClick={() => setActiveLocation(loc)}
                className={`inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 h-8 gap-x-1.5 rounded-[10px] px-2.5 text-xs button-outline !border-subtle-stroke !text-tertiary-foreground !text-sm hover:!border-subtle-stroke hover:!bg-secondary-background ${
                  activeLocation === loc ? '!bg-surface-subtle pointer-events-none' : ''
                }`}
                data-active={activeLocation === loc ? 'true' : 'false'}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Dashed line decorations */}
        <div className="relative grid h-5 grid-cols-12 max-lg:hidden">
          <svg width="1" height="100%" className="text-subtle-stroke col-2">
            <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
          </svg>
          <svg width="1" height="100%" className="text-subtle-stroke col-[-3] justify-self-end">
            <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
          </svg>
        </div>

        {/* Job listings */}
        <div className="relative grid grid-cols-12">
          {/* Diagonal stripe background */}
          <div className="size-full text-surface-subtle absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)' }} />

          {/* Top dashed line */}
          <svg width="100%" height="1" className="text-subtle-stroke absolute top-0 col-span-full">
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
          </svg>

          <div className="relative col-[2/-2] bg-white-100 max-xl:col-[1/-1] xl:border-subtle-stroke xl:border-x">
            <div className="relative flex flex-col pb-18">
              {/* Solid top line */}
              <svg width="100%" height="1" className="text-subtle-stroke relative">
                <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
              </svg>

              {/* Column headers */}
              <div className="relative grid grid-cols-12 bg-surface-subtle py-5 xl:grid-cols-10">
                <div className="col-[2/-2] flex gap-1">
                  <span className="flex-1 text-overline text-caption-foreground">Role</span>
                  <span className="w-32 text-overline text-caption-foreground max-lg:hidden">Department</span>
                  <span className="w-32 text-overline text-caption-foreground max-lg:hidden">Location</span>
                  <span className="w-24 text-overline text-caption-foreground max-lg:hidden">Type</span>
                </div>
              </div>

              {/* Job rows */}
              {filteredJobs.map((job, i) => (
                <a
                  key={i}
                  href="#"
                  className="group relative grid grid-cols-12 border-t border-subtle-stroke py-5 transition-colors hover:bg-secondary-background xl:grid-cols-10"
                >
                  <div className="col-[2/-2] flex gap-1 items-center">
                    <span className="flex-1 font-medium text-sm text-primary-foreground group-hover:text-blue-500 transition-colors">{job.title}</span>
                    <span className="w-32 text-sm text-accent-foreground max-lg:hidden">{job.department}</span>
                    <span className="w-32 text-sm text-accent-foreground max-lg:hidden">{job.location}</span>
                    <span className="w-24 text-sm text-accent-foreground max-lg:hidden">{job.type}</span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                      className="shrink-0 text-accent-foreground transition-[translate,opacity] duration-300 group-hover:translate-x-0.5 group-hover:text-primary-foreground">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="h-20" />
      </div>
    </section>
  )
}
