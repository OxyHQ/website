import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import { Link } from '../lib/navigation'
import AiBreadcrumbs from '../components/ai/platform/AiBreadcrumbs'
import { useTranslation } from '../lib/i18n'
import {
  trustDocumentLinks,
  trustIntro,
  trustStatements,
  type TrustScope,
} from '../data/ai/trust'

/**
 * `/ai/trust` — what happens to what you send.
 *
 * Every statement carries its scope as a visible chip, because the difference
 * between "Oxy does not do this" and "this route does not do this" is the whole
 * page. The claim that used to sit on `/ai` — conversations that "never train
 * anyone else" — is the first kind of sentence with the second kind's reach,
 * and the scope chip is what makes writing one again feel wrong.
 *
 * Each statement also renders its owner and review date. A trust page with no
 * date on it is a trust page nobody has to re-check.
 */
const SCOPE_LABEL_KEYS: Record<TrustScope, string> = {
  oxy: 'ai.trust.scopeOxy',
  route: 'ai.trust.scopeRoute',
  contract: 'ai.trust.scopeContract',
}

const SCOPE_CLASSES: Record<TrustScope, string> = {
  oxy: 'border-success/30 bg-success-subtle text-success-text',
  route: 'border-info/30 bg-info-subtle text-info-text',
  contract: 'border-border bg-surface text-muted-foreground',
}

export default function AITrustPage() {
  const { t } = useTranslation()

  return (
    <PageShell
      seo={{
        title: t('ai.trust.seoTitle'),
        description: t('ai.trust.seoDescription'),
        canonicalPath: '/ai/trust',
      }}
      navbar={<Navbar />}
      mainClassName="flex-1"
    >
      <AiBreadcrumbs
        crumbs={[{ label: t('ai.breadcrumbHome'), href: '/ai' }, { label: t('ai.trust.seoTitle') }]}
      />

      <section className="container pt-10 pb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t('ai.trust.heroEyebrow')}
        </p>
        <h1 className="mt-3 text-heading-responsive-lg text-balance text-foreground">
          {t('ai.trust.heroTitle')}
        </h1>
        <p className="mt-4 max-w-3xl text-pretty text-lg text-muted-foreground">{trustIntro.body}</p>
      </section>

      <section className="container pb-16">
        <div className="flex flex-col gap-8">
          {trustStatements.map((statement) => (
            <article
              key={statement.id}
              id={statement.id}
              className="scroll-mt-24 border-t border-border pt-6"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl text-foreground">{statement.heading}</h2>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${SCOPE_CLASSES[statement.scope]}`}
                >
                  {t(SCOPE_LABEL_KEYS[statement.scope])}
                </span>
              </div>
              <p className="mt-3 max-w-3xl text-pretty text-foreground/80">{statement.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('ai.trust.reviewedBy', { owner: statement.owner, date: statement.reviewBy })}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="container pb-24">
        <h2 className="text-heading-responsive-md text-foreground">
          {t('ai.trust.documentsHeading')}
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t('ai.trust.documentsLead')}</p>
        <ul className="mt-6 flex flex-col gap-2">
          {trustDocumentLinks.map((document) => (
            <li key={document.href}>
              <Link
                to={document.href}
                className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
              >
                {document.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/contact/sales?interest=enterprise_platform" variant="outline">
            {t('ai.cta.talkToSales')}
          </Button>
          <Button href="/ai/enterprise" variant="ghost">
            {t('ai.enterprise.seoTitle')}
          </Button>
        </div>
      </section>
    </PageShell>
  )
}
