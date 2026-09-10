import type { ReactNode } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import SEO, { type SEOProps } from '../SEO'

interface PageShellProps {
  /**
   * Per-page meta. Required, so a page can't ship without declaring its own
   * title/description/canonical — the CMS still overrides these at runtime.
   */
  seo: SEOProps
  /**
   * Appended to the shell's layout classes on the page root. Carries the
   * page's background and theme classes (e.g. `bg-[#0a0a0b]`, or
   * `cursor-theme astro-theme bg-background`). Defaults to `bg-background`.
   */
  className?: string
  /** Replaces the default `<Navbar />` — pass `<Navbar transparent />` for hero pages. */
  navbar?: ReactNode
  /** Classes for the `<main>` element. Omitted entirely when not supplied. */
  mainClassName?: string
  /**
   * Render the content frame as a div when the child owns the page's main
   * landmark, as the documentation shell does.
   */
  mainAsDiv?: boolean
  /**
   * Drops the footer's top rule, for a page whose last section already ends on
   * a boundary of its own — a rule between two surfaces of the same colour
   * reads as leftover, not as structure.
   */
  hideFooterDivider?: boolean
  children: ReactNode
}

/**
 * The standard marketing-page frame: SEO meta, navbar, `<main>`, footer.
 *
 * Every page in `src/pages/` that isn't a bespoke layout (admin, docs shells,
 * thumbnail renderers) shares this exact structure, so it lives here once
 * rather than being retyped per page.
 */
export default function PageShell({
  seo,
  className = 'bg-background',
  navbar,
  mainClassName,
  mainAsDiv = false,
  hideFooterDivider = false,
  children,
}: PageShellProps) {
  return (
    <div className={`flex min-h-screen max-w-screen flex-col overflow-x-clip ${className}`}>
      <SEO {...seo} />
      {navbar ?? <Navbar />}
      {mainAsDiv ? (
        <div className={mainClassName}>{children}</div>
      ) : (
        <main className={mainClassName}>{children}</main>
      )}
      <Footer hideTopDivider={hideFooterDivider} />
    </div>
  )
}
