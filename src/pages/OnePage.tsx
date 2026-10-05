import { useQuery } from '@tanstack/react-query'
import { useOxy } from '@oxy.so/services/ui/client'
import PageShell from '../components/layout/PageShell'
import { useTranslation } from '../lib/i18n'

/** Public catalogue only; account-specific sources belong to Accounts. */
export default function OnePage() {
  const { t, locale } = useTranslation()
  const { oxyServices } = useOxy()
  const catalogue = useQuery({ queryKey: ['personal-plan-catalogue'],
    queryFn: () => oxyServices.billing.personalPlans(), staleTime: 0 })
  return <PageShell seo={{ title: t('one.title'), description: t('one.lead'), canonicalPath: '/one' }}>
    <section className="container py-20 sm:py-28">
      <div className="max-w-3xl">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">Oxy · Personal</p>
        <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-7xl">{t('one.title')}</h1>
        <p className="mt-6 text-xl text-muted-foreground">{t('one.lead')}</p>
      </div>
      <div className="mt-12 max-w-3xl rounded-3xl border border-border bg-card p-8 sm:p-10" aria-live="polite">
        {catalogue.isPending ? <p>{t('one.loading')}</p> : catalogue.isError ? <p role="alert">{t('one.error')}</p>
          : catalogue.data?.state === 'unconfigured' ? <p className="text-lg text-muted-foreground">{t('one.unavailable')}</p>
          : catalogue.data?.plans.map(plan => <article key={`${plan.offerId}:${plan.offerVersion}`} className="mb-6 last:mb-0">
            <h2 className="text-heading-responsive-md">{plan.displayName}</h2>
            {plan.price && <div className="mt-4">
              <p className="text-3xl font-semibold text-foreground"><span data-testid="one-price">{(() => {
                const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: plan.price.currency, currencyDisplay: 'code' })
                const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2
                return formatter.format(plan.price.amountMinorUnits / 10 ** digits)
              })()}</span> <span className="text-base font-normal text-muted-foreground">{t('one.monthly')}</span></p>
              <p className="mt-2 text-sm text-muted-foreground">{t('one.billingTerms')}</p>
              {plan.price.taxTreatment === 'inclusive' && plan.price.merchantTotal === 'final' && <p data-testid="one-tax-terms" className="mt-2 text-sm text-muted-foreground">{t('one.taxInclusive')}</p>}
            </div>}
            <p className="mt-2 text-sm text-muted-foreground">{t('one.version')} {plan.offerVersion}</p>
            <ul className="mt-5 space-y-3">{plan.benefits.map((entry, index) => <li key={index}>
              <span className="font-medium">{entry.displayName}</span>
              {entry.benefit.kind === 'quota' && <span className="ml-2 text-muted-foreground">{entry.benefit.unit === 'byte' ? `${entry.benefit.included / 1_000_000_000} GB` : `${entry.benefit.included.toLocaleString()} ${entry.benefit.unit === 'alia_credit' ? t('one.credits') : entry.benefit.unit}`}</span>}
            </li>)}</ul>
            <p className="mt-6 text-sm text-muted-foreground">{t('one.status')}</p>
          </article>)}
      </div>
      <a className="mt-8 inline-flex rounded-full border border-border px-6 py-3 font-medium text-foreground hover:bg-accent" href="https://accounts.oxy.so/payments">{t('one.manage')}</a>
    </section>
  </PageShell>
}
