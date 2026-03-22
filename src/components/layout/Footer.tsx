import { footerColumns } from '../../data/content'

export default function Footer() {
  return (
    <footer className="relative flex min-h-[40svh] w-full flex-col justify-between bg-primary-background dark:bg-black-0 dark">
      {/* Top border line */}
      <svg width="100%" height="1" className="text-subtle-stroke">
        <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
      </svg>

      <div className="container flex-1">
        <div className="grid grid-cols-12 gap-y-12 px-px pt-20 pb-12">
          {footerColumns.map((column, index) => {
            const colSpans = [
              'col-[2/5] max-lg:col-[1/4] max-md:col-[1/7]',
              'col-[5/8] max-lg:col-[4/7] max-md:col-[7/13]',
              'col-[8/11] max-lg:col-[7/10] max-md:col-[1/7]',
              'col-[11/13] max-lg:col-[10/13] max-md:col-[7/13]',
            ]
            return (
              <div key={column.title} className={colSpans[index] || ''}>
                <h2 className="py-1 text-caption-foreground text-sm">{column.title}</h2>
                <ul className="mt-2 flex flex-col">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="group -mx-1 flex w-fit items-center rounded-lg p-1 font-normal text-sm text-tertiary-foreground transition-[color] duration-150 ease-out hover:text-secondary-foreground"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-subtle-stroke py-8 lg:flex-row">
          <span className="text-xl font-bold tracking-tight text-primary-foreground">
            Oxy
          </span>
          <p className="text-sm text-accent-foreground">
            &copy; {new Date().getFullYear()} Oxy. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {['X', 'LinkedIn', 'GitHub'].map((name) => (
              <a
                key={name}
                href="#"
                className="text-sm text-tertiary-foreground transition-colors hover:text-primary-foreground"
                aria-label={name}
              >
                {name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
