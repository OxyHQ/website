import { Link } from '../../../lib/navigation'
import StructuredData from '../../StructuredData'
import { brandConfig } from '../../../lib/seo'
import { withDocumentTrailingSlash } from '../../../lib/seoUrl'

export interface Crumb {
  label: string
  /** Omitted on the current page, which is text rather than a link. */
  href?: string
}

/**
 * Breadcrumbs for the nested AI pages, plus the `BreadcrumbList` that says the
 * same thing to a crawler.
 *
 * One component for both so the visible trail and the structured data cannot
 * disagree — a `BreadcrumbList` describing a hierarchy the page does not show
 * is the kind of mismatch that gets the markup ignored rather than trusted.
 */
export default function AiBreadcrumbs({ crumbs }: { crumbs: readonly Crumb[] }) {
  const { origin } = brandConfig(typeof window === 'undefined' ? undefined : window.location.hostname)

  return (
    <>
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: crumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.label,
            ...(crumb.href
              ? { item: `${origin}${withDocumentTrailingSlash(crumb.href)}` }
              : {}),
          })),
        }}
      />
      <nav aria-label="Breadcrumb" className="container pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {crumbs.map((crumb, index) => (
            <li key={crumb.label} className="flex items-center gap-1">
              {index > 0 && <span aria-hidden="true">/</span>}
              {crumb.href ? (
                <Link to={crumb.href} className="underline-offset-4 hover:text-foreground hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-foreground">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
