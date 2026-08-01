import type { ReactNode } from 'react'
import PillButton from './PillButton'
import UnderlineLink from './UnderlineLink'

interface CtaBlockProps {
  /** Optional heading. Omit for a standalone statement paragraph. */
  title?: string
  body: ReactNode
  action?: { label: string; href: string; external?: boolean }
  /** `button` is the page's primary ask; `link` is a quieter, inline read-on. */
  actionStyle?: 'button' | 'link'
  /** Statement copy is set large; supporting copy is set at reading size. */
  emphasis?: 'statement' | 'supporting'
  className?: string
}

/** A block of statement copy with one call to action. */
export default function CtaBlock({
  title,
  body,
  action,
  actionStyle = 'button',
  emphasis = 'statement',
  className = 'layout-padding-top',
}: CtaBlockProps) {
  return (
    <section className={`text-gray-a1 layout-px-large ${className}`}>
      {title && <h2 className="text-h4 max-w-[10em] mb-4">{title}</h2>}
      <p className={emphasis === 'statement' ? 'text-h3 max-w-320' : 'text-h7 max-w-[20em]'}>{body}</p>
      {action && (
        <div className="mt-10 lg:mt-12">
          {actionStyle === 'button' ? (
            <PillButton href={action.href} external={action.external} size="lg">
              {action.label}
            </PillButton>
          ) : (
            <UnderlineLink href={action.href} external={action.external} className="text-b1">
              {action.label}
            </UnderlineLink>
          )}
        </div>
      )}
    </section>
  )
}
