import { footerColumns } from '../../data/content'

/* ─── SVG Icons ─── */
function ExternalArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-0.5 -rotate-45 text-caption-foreground transition-colors duration-200 ease-in-out-cubic group-hover:text-secondary-foreground group-hover:delay-50 group-focus:text-secondary-foreground group-focus:delay-50 group-active:text-primary-foreground group-active:duration-50">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
    </svg>
  )
}

function DribbbleIcon() {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path d="M256 8C119.252 8 8 119.252 8 256s111.252 248 248 248 248-111.252 248-248S392.748 8 256 8zm163.97 114.366c29.503 36.046 47.369 81.957 47.835 131.955-6.984-1.477-77.018-15.682-147.502-6.818-5.752-14.041-11.181-26.393-18.617-41.614 78.321-31.977 113.818-77.482 118.284-83.523zM396.421 97.87c-3.81 5.427-35.697 48.286-111.021 76.519-34.712-63.776-73.185-116.168-79.04-124.008 67.176-16.193 137.966 1.27 190.061 47.489zm-230.48-33.25c5.585 7.659 43.438 60.116 78.537 122.509-99.087 26.313-186.36 25.934-195.834 25.809C62.38 147.205 106.678 92.573 165.941 64.62zM44.17 256.323c0-2.166.043-4.322.108-6.473 9.268.19 111.92 1.513 217.706-30.146 6.064 11.868 11.857 23.915 17.174 35.949-76.599 21.575-146.194 83.527-180.531 142.306C64.794 360.405 44.17 310.73 44.17 256.323zm81.807 167.113c22.127-45.233 82.178-103.622 167.579-132.756 29.74 77.283 42.039 142.053 45.189 160.638-68.112 29.013-150.015 21.053-212.768-27.882zm248.38 8.489c-2.171-12.886-13.446-74.897-41.152-151.033 66.38-10.626 124.7 6.768 131.947 9.055-9.442 58.941-43.273 109.844-90.795 141.978z" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
    </svg>
  )
}

const socialLinks = [
  { label: 'LinkedIn', icon: LinkedInIcon, href: '#' },
  { label: 'X', icon: XIcon, href: '#' },
  { label: 'Dribbble', icon: DribbbleIcon, href: '#' },
  { label: 'YouTube', icon: YouTubeIcon, href: '#' },
]

export default function Footer() {
  return (
    <footer className="relative flex min-h-[40svh] w-full flex-col justify-between bg-primary-background dark:bg-black-0 dark">
      {/* Top border line */}
      <svg width="100%" height="1" className="text-subtle-stroke">
        <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
      </svg>

      <div className="container flex-1">
        <div className="grid grid-cols-12 gap-y-12 px-px pt-20 pb-12">
          {/* Logo column */}
          <div className="col-[1/2] max-lg:col-[1/3] max-md:col-[1/4] max-xs:col-[1/5]">
            <a className="-m-1.5 inline-block w-[calc(100%+12px)] rounded-lg p-1.5" aria-label="Oxy homepage" href="/">
              <span className="text-xl font-bold tracking-tight text-primary-foreground dark:text-white-200">Oxy</span>
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
      <div className="w-full bg-secondary-background dark:bg-primary-background">
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
                <a className="-mx-1 rounded-lg p-1 transition-colors duration-400 ease-in-out hover:text-tertiary-foreground hover:duration-150 active:text-secondary-foreground active:duration-50" href="#">LLMs</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
