import { footerColumns } from '../../data/content'
import Container from './Container'

export default function Footer() {
  return (
    <footer className="relative bg-black-0">
      {/* Top border line */}
      <svg width="100%" height="1" className="text-subtle-stroke">
        <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
      </svg>

      <Container>
        <div className="py-16 lg:py-20">
          {/* Footer columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h2 className="py-1 text-sm text-caption-foreground">{column.title}</h2>
                <ul className="mt-2 flex flex-col">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="group inline-flex py-1 text-sm text-tertiary-foreground transition-colors duration-150 hover:text-secondary-foreground"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom */}
          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-subtle-stroke pt-8 lg:flex-row">
            <span className="text-xl font-bold tracking-tight text-primary-foreground">
              Oxy
            </span>
            <p className="text-sm text-accent-foreground">
              &copy; {new Date().getFullYear()} Oxy. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {/* Social icons */}
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
      </Container>
    </footer>
  )
}
