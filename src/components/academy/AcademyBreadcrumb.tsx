import { Breadcrumb, BreadcrumbItem } from '@oxy.so/bloom/breadcrumb'
import { useNavigate } from '../../lib/navigation'
import { canonicalHref } from '../../lib/canonicalPath'

/**
 * Bloom's breadcrumb, routed. An `href` item is a real anchor (middle-click and
 * "open in new tab" keep working); `onPress` hands the plain click to the
 * router instead of reloading the page.
 */
export function AcademyBreadcrumb({ items }: { items: Array<{ label: string; to?: string }> }) {
  const navigate = useNavigate()
  return (
    <Breadcrumb>
      {items.map((item, index) =>
        item.to && index < items.length - 1 ? (
          <BreadcrumbItem key={item.to} href={canonicalHref(item.to)} onPress={() => navigate(item.to!)}>
            {item.label}
          </BreadcrumbItem>
        ) : (
          <BreadcrumbItem key={`current-${index}`} current>
            {item.label}
          </BreadcrumbItem>
        ),
      )}
    </Breadcrumb>
  )
}
