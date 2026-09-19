import type { ReactNode } from 'react'
import { Link } from '../../../lib/navigation'
import { ctaIntentFor } from '../../../lib/ai/availability'
import { useTranslation } from '../../../lib/i18n'
import AvailabilityBadge from './AvailabilityBadge'
import type { AiService } from '../../../data/ai/taxonomy'

/**
 * One member of the Oxy AI umbrella.
 *
 * The call to action is derived from the service's availability rather than
 * written per card: a `coming_soon` service cannot end up with a `Start
 * building` button because there is no code path that produces one. Where the
 * intent is `none` the card renders no action at all, which is the only honest
 * treatment of something that should not have reached a public page.
 */
export default function ServiceCard({ service }: { service: AiService }) {
  const { t } = useTranslation()
  const intent = ctaIntentFor(service.availability)
  const ctaLabel = t(`ai.cta.${camel(intent)}`)
  // `request_access` is a conversation, and it goes to the form with the right
  // option preselected — `salesInterest`, never `key`, because the form's
  // options are a server contract with their own spelling.
  //
  // `join_waitlist` deliberately does NOT open the form: nothing is for sale
  // yet, and a sales conversation about an unreleased model wastes both sides'
  // time. It goes to the section that explains the state instead.
  const href =
    intent === 'request_access' && service.salesInterest
      ? `/contact/sales?interest=${service.salesInterest}`
      : service.href

  return (
    <article className="group relative flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-accent/40">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xl text-foreground">{service.name}</h3>
        <AvailabilityBadge availability={service.availability} />
      </div>
      <p className="text-sm text-muted-foreground">{service.audienceLabel}</p>
      <p className="text-pretty text-foreground/80">{service.summary}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
        {intent !== 'none' && (
          <ServiceLink href={href} external={intent === 'start_building' && service.external}>
            <span className="absolute inset-0" aria-hidden="true" />
            <span className="relative">
              {ctaLabel}
              <span className="sr-only"> — {service.name}</span>
            </span>
          </ServiceLink>
        )}
        {service.docs && (
          <DocsLink href={service.docs.href} external={service.docs.external}>
            {service.docs.label}
          </DocsLink>
        )}
      </div>
    </article>
  )
}

function ServiceLink({
  href,
  external,
  children,
}: {
  href: string
  external?: boolean
  children: ReactNode
}) {
  const className =
    'text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline'
  if (external || !href.startsWith('/')) {
    return (
      <a className={className} href={href} rel="noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link className={className} to={href}>
      {children}
    </Link>
  )
}

/**
 * The documentation link sits ABOVE the card's full-bleed overlay so it stays
 * clickable. A card whose secondary link is swallowed by the primary one is a
 * card with one link and a decoration.
 */
function DocsLink({
  href,
  external,
  children,
}: {
  href: string
  external?: boolean
  children: ReactNode
}) {
  const className =
    'relative z-10 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
  if (external || !href.startsWith('/')) {
    return (
      <a className={className} href={href} rel="noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link className={className} to={href}>
      {children}
    </Link>
  )
}

function camel(value: string): string {
  return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
}
