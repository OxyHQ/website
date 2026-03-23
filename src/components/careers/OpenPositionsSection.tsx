import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { jobDepartments } from '../../data/careers'

function DashedLine() {
  return (
    <svg width="100%" height="1" className="text-border">
      <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
    </svg>
  )
}

function SolidLine() {
  return (
    <svg width="100%" height="1" className="text-border">
      <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  )
}

export default function OpenPositionsSection() {
  const [activeLocation, setActiveLocation] = useState('All locations')
  const locations = ['All locations', 'Europe', 'United Kingdom', 'United States']

  const filteredDepartments = useMemo(() => {
    if (activeLocation === 'All locations') return jobDepartments

    return jobDepartments
      .map(dept => ({
        ...dept,
        jobs: dept.jobs.filter(job => {
          const loc = job.location.toLowerCase()
          switch (activeLocation) {
            case 'Europe':
              return loc.includes('europe') || loc.includes('poland') || loc.includes('portugal') || loc.includes('ireland') || loc.includes('germany')
            case 'United Kingdom':
              return loc.includes('london') || loc.includes('united kingdom')
            case 'United States':
              return loc.includes('united states') || loc.includes('new york') || loc.includes('san francisco')
            default:
              return true
          }
        }),
      }))
      .filter(dept => dept.jobs.length > 0)
  }, [activeLocation])

  return (
    <section className="container" id="open-positions">
      <div className="flex flex-col overflow-hidden border-border border-x">
        <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center">
          <div className="flex max-w-lg flex-col gap-4 max-lg:gap-3 text-center col-[2/-2] mix-blend-multiply dark:mix-blend-screen">
            <h2 className="text-pretty text-heading-responsive-md">Open positions.</h2>
            <p className="text-pretty text-tertiary text-xl">If you want to share our mission of building the definitive CRM, we'd love to hear from you.</p>
          </div>
        </header>

        {/* Location filter tabs */}
        <div className="relative grid grid-cols-12 pb-5">
          <div className="relative col-[2/-2] flex gap-2 max-lg:grid max-lg:grid-cols-2 justify-center max-lg:gap-1.5 max-lg:flex-wrap">
            {locations.map(loc => (
              <button
                key={loc}
                onClick={() => setActiveLocation(loc)}
                data-active={activeLocation === loc ? 'true' : 'false'}
                className={`inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 disabled:pointer-events-none disabled:cursor-default h-8 gap-x-1.5 rounded-[10px] px-2.5 text-xs button-outline !border-border !text-muted-foreground !text-sm hover:!border-border hover:!bg-surface data-[active='true']:!border-strong-stroke data-[active='false']:!text-muted-foreground lg:!text-foreground lg:text-sm${
                  activeLocation === loc ? ' pointer-events-none pr-2!' : ''
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Dashed line decorations */}
        <div className="relative grid h-5 grid-cols-12 max-lg:hidden">
          <svg width="1" height="100%" className="text-border col-2">
            <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
          </svg>
          <svg width="1" height="100%" className="text-border col-[-3] justify-self-end">
            <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
          </svg>
        </div>

        {/* Job listings area */}
        <div className="relative grid grid-cols-12">
          {/* Diagonal stripe background */}
          <div
            className="size-full text-surface absolute inset-0"
            style={{ backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)' }}
          />

          {/* Top dashed line */}
          <svg width="100%" height="1" className="text-border absolute top-0 col-span-full">
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
          </svg>

          <div className="relative col-[2/-2] bg-background max-xl:col-[1/-1] xl:border-border xl:border-x">
            <div className="relative flex flex-col pb-18">
              {filteredDepartments.map((dept) => (
                <div key={dept.id}>
                  {/* Solid line above department header */}
                  <SolidLine />

                  {/* Department header */}
                  <div className="relative grid grid-cols-12 bg-surface py-5 xl:grid-cols-10">
                    <div className="col-[2/-2] flex items-baseline gap-2">
                      <h3 className="font-display text-xl xl:text-2xl" id={dept.id}>{dept.name}</h3>
                      <p className="align-super text-muted-foreground text-overline">[{String(dept.jobs.length).padStart(2, '0')}]</p>
                    </div>
                  </div>

                  {/* Solid line below department header */}
                  <SolidLine />

                  {/* Job rows */}
                  {dept.jobs.map((job, jobIndex) => (
                    <div key={`${dept.id}-${jobIndex}`}>
                      <Link
                        className="group relative grid grid-cols-12 items-baseline gap-y-1 py-4 md:gap-y-[5px] md:py-4.5 lg:py-5 xl:grid-cols-10 *:mix-blend-multiply"
                        to={job.href}
                      >
                        {/* Hover overlay */}
                        <div className="pointer-events-none absolute inset-0 bg-surface opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-80 group-hover:duration-50 group-active:opacity-100 group-active:duration-50" />
                        {/* Row number */}
                        <p className="relative col-[2/-2] row-1 mb-0.5 text-muted-foreground text-xs tabular-nums tracking-tight! md:col-1 md:row-1 md:mb-0 md:justify-self-center xl:text-sm">
                          {String(jobIndex + 1).padStart(2, '0')}
                        </p>
                        {/* Job title */}
                        <h4 className="relative col-[2/-2] row-2 overflow-hidden text-ellipsis whitespace-nowrap pr-6 text-sm md:row-1 lg:col-[2/6] lg:text-base">
                          {job.title}
                        </h4>
                        {/* Location */}
                        <p className="relative col-[2/-3] row-3 text-muted-foreground text-sm max-md:line-clamp-2 md:truncate md:col-[2/-2] md:row-2 lg:col-[7/-2] lg:row-1 lg:text-base xl:col-[7/-2]">
                          {job.location}
                        </p>
                        {/* Arrow */}
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          className="col-11 row-3 self-center justify-self-end text-muted-foreground transition-[translate,color] duration-400 ease-in-out group-hover:translate-x-0.5 group-hover:duration-150 group-active:translate-x-0.5 group-active:duration-50 md:row-2 lg:col-12 lg:row-1 lg:justify-self-center xl:col-[-2/-1]"
                        >
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5" />
                        </svg>
                      </Link>
                      {/* Dashed separator between rows (and after last row) */}
                      <DashedLine />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-20" />
      </div>
    </section>
  )
}
