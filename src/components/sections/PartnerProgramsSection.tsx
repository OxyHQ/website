import { Link } from 'react-router-dom'
import { partnerPrograms } from '../../data/content'
import { HorizontalLine, VerticalLine } from '../ui/GridDecoration'

function ProgramIllustration({ index }: { index: number }) {
  const shapes = [
    // App: interconnected nodes
    <>
      <circle cx="200" cy="160" r="40" fill="currentColor" opacity="0.15" />
      <circle cx="200" cy="160" r="24" fill="currentColor" opacity="0.3" />
      <circle cx="280" cy="220" r="30" fill="currentColor" opacity="0.15" />
      <circle cx="280" cy="220" r="16" fill="currentColor" opacity="0.3" />
      <circle cx="120" cy="220" r="30" fill="currentColor" opacity="0.15" />
      <circle cx="120" cy="220" r="16" fill="currentColor" opacity="0.3" />
      <line x1="200" y1="184" x2="270" y2="208" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="200" y1="184" x2="130" y2="208" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="136" y1="220" x2="264" y2="220" stroke="currentColor" strokeWidth="2" opacity="0.15" />
      <rect x="172" y="132" width="56" height="56" rx="12" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    </>,
    // Creator: pen/content
    <>
      <rect x="140" y="120" width="120" height="160" rx="12" fill="currentColor" opacity="0.1" />
      <rect x="140" y="120" width="120" height="160" rx="12" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="165" y1="170" x2="235" y2="170" stroke="currentColor" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
      <line x1="165" y1="190" x2="220" y2="190" stroke="currentColor" strokeWidth="3" opacity="0.3" strokeLinecap="round" />
      <line x1="165" y1="210" x2="230" y2="210" stroke="currentColor" strokeWidth="3" opacity="0.2" strokeLinecap="round" />
      <line x1="165" y1="230" x2="200" y2="230" stroke="currentColor" strokeWidth="3" opacity="0.15" strokeLinecap="round" />
      <circle cx="200" cy="145" r="10" fill="currentColor" opacity="0.3" />
    </>,
    // Expert: shield/growth
    <>
      <path d="M200 120 L260 150 L260 220 L200 260 L140 220 L140 150 Z" fill="currentColor" opacity="0.1" />
      <path d="M200 120 L260 150 L260 220 L200 260 L140 220 L140 150 Z" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <polyline points="175,195 195,215 230,175" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.5" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  ]

  return (
    <svg viewBox="0 0 400 400" width="400" height="400" className="object-contain text-primary">
      {shapes[index]}
    </svg>
  )
}


export default function PartnerProgramsSection() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6">
      <div className="isolate border-x border-border">
        {partnerPrograms.map((program, index) => (
          <div key={program.number}>
            {/* Separator line between rows */}
            {index > 0 && (
              <HorizontalLine className="w-full text-border" />
            )}

            <div className="relative grid h-100 grid-cols-12 overflow-hidden max-xl:h-96 max-lg:h-84">
              {/* Right side background */}
              <div className="absolute col-[7/-1] size-full bg-surface max-lg:hidden" />

              {/* Dot pattern in col 1 */}
              <svg
                width="100%"
                height="100%"
                className="absolute inset-0 col-[1/2] text-muted max-lg:hidden"
              >
                <defs>
                  <pattern
                    id={`partner-dots-${index}`}
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#partner-dots-${index})`} />
              </svg>

              {/* Vertical separator at col 2 */}
              <VerticalLine className="absolute inset-y-0 col-2 text-border max-lg:hidden" />

              {/* Vertical separator at col 7 */}
              <VerticalLine className="absolute inset-y-0 col-7 -translate-x-1/2 text-border max-lg:hidden" />

              {/* Left content */}
              <div className="relative col-[2/7] grid grid-cols-10 grid-rows-9 max-lg:col-[2/-2]">
                <h2 className="absolute left-0 top-0 col-[2/-2] row-2 text-overline max-lg:col-[1/-1]">
                  {program.number} / {program.label}
                </h2>
                <p className="absolute inset-x-0 bottom-0 col-[2/-2] row-[3/7] text-balance text-heading-responsive-sm max-lg:col-[1/-1]">
                  <span>{program.title}</span>{' '}
                  <span className="font-medium text-input">
                    {program.description}
                  </span>
                </p>
                {program.ctaHref.startsWith('/') ? (
                  <Link
                    className="relative col-[2/-2] row-8 inline-flex w-fit cursor-pointer items-center justify-center text-nowrap rounded-[10px] border px-3 text-sm transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 disabled:pointer-events-none disabled:cursor-default button-outline h-9 gap-x-1.5 max-lg:absolute max-lg:bottom-0 max-lg:col-[1/-1] max-lg:row-[8/9] max-lg:h-11.5 max-lg:gap-x-2 max-lg:rounded-xl max-lg:px-3.5 max-lg:text-base"
                    to={program.ctaHref}
                  >
                    {program.ctaText}
                  </Link>
                ) : (
                  <a
                    className="relative col-[2/-2] row-8 inline-flex w-fit cursor-pointer items-center justify-center text-nowrap rounded-[10px] border px-3 text-sm transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 disabled:pointer-events-none disabled:cursor-default button-outline h-9 gap-x-1.5 max-lg:absolute max-lg:bottom-0 max-lg:col-[1/-1] max-lg:row-[8/9] max-lg:h-11.5 max-lg:gap-x-2 max-lg:rounded-xl max-lg:px-3.5 max-lg:text-base"
                    href={program.ctaHref}
                  >
                    {program.ctaText}
                  </a>
                )}
              </div>

              {/* Right illustration area */}
              <div className="relative col-[7/-1] flex size-full max-lg:hidden">
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-9 justify-between">
                  {/* Dashed vertical lines */}
                  <div className="absolute inset-0 col-[2/-2] row-[1/-1] flex justify-between">
                    <VerticalLine className="text-border" dashed />
                    <VerticalLine className="text-border" dashed />
                    <VerticalLine className="text-border" dashed />
                  </div>
                  {/* Solid vertical lines */}
                  <div className="absolute inset-0 col-[2/-2] row-[2/-2] flex justify-between">
                    <VerticalLine className="text-border" />
                    <VerticalLine className="text-border" />
                    <VerticalLine className="text-border" />
                    <VerticalLine className="text-border" />
                    <VerticalLine className="text-border" />
                  </div>
                  {/* Horizontal lines */}
                  <div className="absolute inset-0 col-[1/-1] row-[2/-2] flex flex-col justify-between">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <HorizontalLine key={i} className="text-border" />
                    ))}
                  </div>
                  {/* Centered illustration */}
                  <div className="absolute inset-0 col-[2/-2] row-[1/-1] flex items-center justify-center">
                    <ProgramIllustration index={index} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Bottom separator */}
        <HorizontalLine className="text-border w-full" />

        {/* Bottom spacer */}
        <div
          aria-hidden="true"
          className="grid h-40 w-full grid-cols-12 overflow-hidden max-xl:h-30 max-lg:h-25"
        >
          <div className="col-[2/-2] flex justify-between" />
        </div>
      </div>
    </div>
  )
}
