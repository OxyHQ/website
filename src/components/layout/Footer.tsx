import { footerColumns } from '../../data/content'

/* ─── SVG Icons ─── */
function ExternalArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-0.5 -rotate-45 text-caption-foreground transition-colors duration-200 ease-in-out group-hover:text-secondary-foreground group-hover:delay-50 group-focus:text-secondary-foreground group-focus:delay-50 group-active:text-primary-foreground group-active:duration-50">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em">
      <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em">
      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 496 512" height="1em" width="1em">
      <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" />
    </svg>
  )
}

const socialLinks = [
  { label: 'LinkedIn', icon: LinkedInIcon, href: '#' },
  { label: 'X', icon: XIcon, href: '#' },
  { label: 'GitHub', icon: GitHubIcon, href: '#' },
]

export default function Footer() {
  return (
    <footer className="relative flex min-h-[40svh] w-full flex-col justify-between bg-primary-background">
      {/* Top border line */}
      <svg width="100%" height="1" className="text-subtle-stroke">
        <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
      </svg>

      <div className="container flex-1">
        <div className="grid grid-cols-12 gap-y-12 px-px pt-20 pb-12">
          {/* Logo column */}
          <div className="col-[1/2] max-lg:col-[1/3] max-md:col-[1/4] max-xs:col-[1/5]">
            <a className="-m-1.5 inline-block rounded-lg p-1.5" aria-label="Oxy homepage" href="/">
              <span className="text-xl font-bold tracking-tight text-primary-foreground">Oxy</span>
            </a>
          </div>

          {/* Footer columns using CSS multi-column layout */}
          <div className="col-[5/-1] columns-4 gap-0 max-xl:col-[4/-1] max-xl:columns-3 max-lg:col-[1/-1] max-lg:columns-2 max-xs:columns-1">
            {footerColumns.map((column) => (
              <div key={column.title} className="break-inside-avoid pb-7">
                <span className="text-caption-foreground text-sm">
                  <h2 className="py-1 text-caption-foreground text-sm">{column.title}</h2>
                </span>
                <ul className="flex flex-col">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        {...(link.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="group -mx-1 flex w-fit items-center rounded-lg p-1 font-normal text-sm text-tertiary-foreground transition-[color] duration-150 ease-out hover:text-secondary-foreground focus-visible:text-secondary-foreground active:text-primary-foreground active:duration-50"
                      >
                        <span className="attio-group-hover-underline group-hover:duration-150">{link.label}</span>
                        {link.isNew && (
                          <div className="ml-1.5 rounded-[10px] bg-blue-450 px-1.5 py-1 font-normal text-[10px] text-white-100 leading-[7px] tracking-normal">New</div>
                        )}
                        {link.isExternal && <ExternalArrow />}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="w-full bg-secondary-background">
        <div className="container">
          <div className="flex flex-wrap items-center justify-between gap-6 px-px py-10">
            {/* Social icons */}
            <div className="-ml-1 flex items-center gap-1">
              {socialLinks.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex size-7 shrink-0 items-center justify-center rounded-lg text-caption-foreground transition-colors duration-400 ease-in-out hover:text-tertiary-foreground hover:duration-150 active:text-secondary-foreground active:duration-50"
                  aria-label={`Oxy on ${label}`}
                >
                  <Icon />
                </a>
              ))}
            </div>

            {/* Copyright & legal links */}
            <div className="flex flex-wrap items-center gap-4 font-normal text-caption-foreground text-xs">
              <p>&copy; {new Date().getFullYear()} Oxy. All rights reserved.</p>
              <div className="flex flex-wrap items-center gap-x-6">
                <a className="-mx-1 rounded-lg p-1 transition-colors duration-400 ease-in-out hover:text-tertiary-foreground hover:duration-150 active:text-secondary-foreground active:duration-50" href="#">Terms &amp; Conditions</a>
                <a className="-mx-1 rounded-lg p-1 transition-colors duration-400 ease-in-out hover:text-tertiary-foreground hover:duration-150 active:text-secondary-foreground active:duration-50" href="#">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
