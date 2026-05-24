import { Link } from 'react-router-dom'
import type { SyncedPackage } from '../../../scripts/types'

interface BreadcrumbsProps {
  pkg: SyncedPackage
  version: string
  pageTitle?: string
}

export default function Breadcrumbs({ pkg, version, pageTitle }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
      <ol className="flex items-center gap-1.5">
        <li>
          <Link to="/docs" className="hover:text-foreground">
            Docs
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link to={`/docs/${pkg.shortName}/${version}`} className="hover:text-foreground">
            {pkg.displayName}
          </Link>
        </li>
        {pageTitle ? (
          <>
            <li aria-hidden>/</li>
            <li className="text-foreground">{pageTitle}</li>
          </>
        ) : null}
      </ol>
    </nav>
  )
}
