import { useQuery } from '@tanstack/react-query'
import { useAuth, useOxy } from '@oxy.so/services/ui/client'
import { useTranslation } from '../../lib/i18n'
import { BrandScope } from '../../theme/BrandScope'
import { AnimatedTitle } from '../ui/AnimatedTitle'
import Button from '../ui/Button'
import { Card, CardTitle, CardDescription } from '@oxy.so/bloom/card'
import { RiCheckLine } from '@oxy.so/bloom/icons/RiCheckLine'
import { getOnePlans, onePlanQuote, OXY_ONE_APP_SUBSCRIPTIONS, OXY_ONE_FAMILY_MEMBERS, OXY_ONE_AUDIENCE_THEMES, type PersonalPlanMode } from '../../data/pricing'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@oxy.so/bloom/table'
import { Muted, Text } from '@oxy.so/bloom/typography'
import { useTheme } from '@oxy.so/bloom/theme'
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '@oxy.so/bloom/segmented-control'
import { Stepper } from '@oxy.so/bloom/stepper'
import { getBrandMark } from '../../data/brand-assets'

import { organizationSeatCount, pricingOrganizationId } from '../../lib/pricingSeats'

/** Plan comparison; account and subscription changes remain in Accounts. */
export type PlanAudience = 'personal' | 'creator' | 'business'

// Proposed bundle composition. Checkout and entitlement activation live in Accounts.
const BUNDLE_APPS = {
  personal: ['Alia', 'Mention', 'Inbox'],
  creator: ['Alia', 'Mention', 'Mercaria'],
  business: ['Alia', 'Mention', 'Inbox'],
} as const

export default function OnePlansSection({ headingLevel = 'h2', headerOverlay = false, audience, personalMode, onPersonalModeChange }: { headingLevel?: 'h1' | 'h2'; headerOverlay?: boolean; audience?: PlanAudience; personalMode?: PersonalPlanMode; onPersonalModeChange?: (mode: PersonalPlanMode) => void }) {
  const scope = OXY_ONE_AUDIENCE_THEMES[audience ?? 'personal']
  const PlanHeading = headingLevel === 'h1' ? 'h2' : 'h3'
  const { t, locale } = useTranslation()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [localPersonalMode, setLocalPersonalMode] = useState<PersonalPlanMode>('individual')
  const mode = personalMode ?? localPersonalMode
  const family = (audience ?? 'personal') === 'personal' && mode === 'family'
  const changePersonalMode = onPersonalModeChange ?? setLocalPersonalMode
  const [estimatedSeats, setEstimatedSeats] = useState(1)
  const [businessApp, setBusinessApp] = useState<'mercaria' | 'homiio'>('mercaria')
  const seatsControl = useRef<HTMLDivElement>(null)
  const { oxyServices, activeSessionId } = useOxy()
  const { user, isAuthenticated, isAuthResolved } = useAuth()
  const organizationSeats = useQuery({
    queryKey: ['pricing-organization-seats', activeSessionId, user?.id],
    enabled: audience === 'business' && isAuthResolved && isAuthenticated && !!user?.id,
    queryFn: async () => {
      const organizationId = user!.kind === 'organization' ? user!.id
        : pricingOrganizationId(user!.id, await oxyServices.accounts.list())
      if (!organizationId) return null
      return organizationSeatCount(await oxyServices.accounts.members.list(organizationId))
    },
    staleTime: 0,
    retry: 1,
  })
  const seats = !isAuthResolved ? undefined : isAuthenticated
    ? organizationSeats.isError ? undefined : organizationSeats.data ?? undefined
    : estimatedSeats
  const seatsMessage = !isAuthResolved || organizationSeats.isFetching ? t('one.loading')
    : organizationSeats.isError ? t('one.seatsUnavailable') : t('one.chooseOrganization')

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const value = seatsControl.current?.querySelector('[data-bloom-stepper-value]')?.firstElementChild
    const animation = value?.animate([
      { opacity: 0, transform: 'translateY(4px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 200, easing: 'ease-out' })
    return () => animation?.cancel()
  }, [estimatedSeats])
  const catalogue = useQuery({
    queryKey: ['personal-plan-catalogue'],
    queryFn: () => oxyServices.billing.personalPlans(),
    staleTime: 0,
  })
  const tiers = getOnePlans(audience ?? 'personal', mode).map((tier) => {
    const { name, creditDiscount } = tier
    const free = name === 'Free'
    const quote = onePlanQuote(tier, billingPeriod, seats)
    const formatPrice = (amount: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', minimumFractionDigits: amount % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(amount / 100)
    const creditLabel = quote.monthlyCredits === undefined ? '—' : t('one.monthlyCreditAmount', { count: quote.monthlyCredits.toLocaleString(locale) })
    return {
      ...tier,
      price: quote.totalMonthly === undefined ? undefined : formatPrice(quote.totalMonthly),
      annualTotal: !free && billingPeriod === 'annual' && quote.totalAnnual !== undefined ? `${formatPrice(quote.totalAnnual)} ${t('pricing.billedAnnually')}` : undefined,
      basePrice: tier.monthlySeatPrice !== undefined ? formatPrice(quote.baseMonthly) : undefined,
      seatPrice: quote.seatMonthly === undefined ? undefined : formatPrice(quote.seatMonthly),
      description: creditDiscount ? `${creditDiscount}% off credit packs` : 'Standard credit pricing',
      creditLabel: free ? t('one.freeUsage') : creditLabel,
      features: free ? ['Top up credits when you need them'] : [
        'App subscriptions in one bundle',
        family ? t('one.familyMembers', { count: OXY_ONE_FAMILY_MEMBERS }) : 'Credits for Alia and the Oxy API',
      ],
      featureGroups: [
        ...(audience === 'business' ? [{
          title: 'Team billing',
          items: [
            { label: 'Team base fee', detail: `${formatPrice(quote.baseMonthly)} ${t('one.baseMonthly')}` },
            { label: 'Seats for your team', detail: `${formatPrice(quote.seatMonthly ?? 0)} ${t('one.perSeatMonthly')}` },
          ],
        }] : []),
        {
          title: 'App subscriptions',
          items: [...BUNDLE_APPS[audience ?? 'personal'], ...(audience === 'business' ? [businessApp === 'mercaria' ? 'Mercaria' : 'Homiio'] : [])].map(app => {
            const productId = app.toLowerCase()
            const subscription = OXY_ONE_APP_SUBSCRIPTIONS[productId as keyof typeof OXY_ONE_APP_SUBSCRIPTIONS]
            const appTier = subscription?.tiers[name as keyof typeof subscription.tiers]
            return {
              app: productId,
              label: appTier ? `${app} ${appTier}` : app,
              detail: free || appTier === null ? 'Free access' : 'Included subscription',
            }
          }),
        },
        {
          title: 'Credits',
          items: [
            { label: 'Monthly allowance', detail: free ? t('one.freeUsage') : creditLabel, confirmed: !free },
            ...(family ? [{ label: 'Shared allowance', detail: t('one.familyPool', { count: OXY_ONE_FAMILY_MEMBERS }) }] : []),
            ...(audience === 'business' ? [{ label: 'Allowance breakdown', detail: `${tier.monthlyCredits.toLocaleString(locale)} + ${(tier.creditsPerSeat ?? 0).toLocaleString(locale)} ${t('one.perSeatMonthly')}` }] : []),
            { label: 'Extra credit discount', detail: creditDiscount ? `${creditDiscount}% off credit packs` : '0% · Standard pricing', confirmed: creditDiscount > 0 },
          ],
        },
      ],
      href: free ? 'https://accounts.oxy.so/' : 'https://accounts.oxy.so/payments',
      cta: free ? 'Create an account' : t('one.getStarted'),
    }
  })

  // All audiences share the same cards, comparison and CSS-only sticky.
  const renderPlanGrid = (plans: typeof tiers, id: string) => {
    const CardHeading = id === 'pricing-plans' ? PlanHeading : 'h3'
    return (
          <div className="relative left-1/2 mt-10 grid w-screen -translate-x-1/2 grid-cols-1 grid-rows-[auto_auto] [timeline-scope:--plan-scroll] lg:left-auto lg:mt-20 lg:w-full lg:translate-x-0">
          {['-top-[3px] -left-[3px]', '-top-[3px] -right-[3px]', '-bottom-[3px] -left-[3px]', '-bottom-[3px] -right-[3px]'].map((corner) => (
            <span key={corner} aria-hidden="true" className={`pointer-events-none absolute z-30 hidden h-[7px] w-[7px] lg:block ${corner}`}>
              <span className="absolute top-[3px] left-0 h-px w-full bg-border" />
              <span className="absolute top-0 left-[3px] h-full w-px bg-border" />
            </span>
          ))}
          <div data-plan-scroll role="region" aria-label="Compare Oxy One plans" tabIndex={0} className="col-start-1 row-span-2 row-start-1 grid min-w-0 grid-rows-subgrid overflow-x-auto overflow-y-hidden px-3 [scroll-timeline:--plan-scroll_inline]">
          <div id={id} data-one-tiers className={`relative row-span-2 grid grid-cols-12 grid-rows-subgrid gap-x-6 scroll-mt-(--site-header-height) ${plans.length === 1 ? 'min-w-0' : plans.length === 2 ? 'min-w-[600px]' : plans.length === 5 ? 'min-w-[1200px]' : 'min-w-[960px]'}`}>
            <div className={`relative isolate col-span-12 row-span-2 grid grid-rows-subgrid gap-x-6 ${plans.length === 1 ? 'grid-cols-1' : plans.length === 2 ? 'grid-cols-2' : plans.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
              {/* One continuous frame; inset dividers align with the table cells. */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 -inset-x-3 border-x border-t border-border" />
              {plans.slice(1).map((_, index) => (
                <div
                  key={index}
                  aria-hidden="true"
                  style={{ gridColumn: index + 2 }}
                  className="pointer-events-none absolute inset-y-0 -left-3 w-px -translate-x-px bg-border"
                />
              ))}

              {plans.map((plan) => (
                <article
                  key={plan.name}
                  id={`one-plan-${plan.name.toLowerCase()}`}
                  className="my-3 flex scroll-mt-[var(--plans-anchor-offset,var(--site-header-occlusion-bottom))]"
                >
                  <Card appearance="solid" tone="support" radius="radius-24" border="none" className={`flex-1 justify-between px-[23px] pt-[21px] pb-[23px] ${plans.length === 1 ? 'md:grid md:grid-cols-2 md:items-end md:gap-16' : ''}`}>
                  <div className="flex flex-col">
                    <CardHeading data-plan-name><CardTitle style={{ fontSize: 20, lineHeight: 28, fontWeight: '400' }}>{plan.name}</CardTitle></CardHeading>
                    <CardDescription>
                    <PlanPrice
                      price={plan.price}
                      visible={!!plan.price}
                      billingPeriod={billingPeriod}
                      periodLabel={t(audience === 'business' ? 'one.teamTotalMonthly' : family ? 'one.familyTotalMonthly' : 'one.monthly')}
                      annualTotal={plan.annualTotal}
                      unavailable="—"
                    />
                    </CardDescription>
                    {plan.seatPrice && <CardDescription>
                      <div data-team-breakdown className="mt-2 min-h-20">
                        <p className="text-sm">{plan.basePrice} {t('one.baseMonthly')}</p>
                        <p data-seat-price className="mt-1 text-sm font-semibold">+ {plan.seatPrice} {t('one.perSeatMonthly')}</p>
                      </div>
                    </CardDescription>}
                    <div data-monthly-credits className="mt-5"><CardDescription style={{ fontWeight: '600' }}>{plan.creditLabel}</CardDescription></div>
                    <div className="mt-3"><CardDescription style={{ fontWeight: '600' }}>{plan.description}</CardDescription></div>
                    <ul className="mt-2.5 flex flex-col gap-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature}><CardDescription><span className="flex items-start gap-2">
                          <span aria-hidden="true" className="mt-px h-[18px] w-[18px] shrink-0 p-0.5">
                            <RiCheckLine width={14} height={14} fill="currentColor" />
                          </span>
                          <span>{feature}</span>
                        </span></CardDescription></li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-5 flex flex-col items-stretch lg:mt-8">
                    {plan.href ? (
                      <Button variant="primary" responsive href={plan.href}>
                        {plan.cta}
                      </Button>
                    ) : (
                      <Button variant="primary" responsive disabled>
                        {plan.cta}
                      </Button>
                    )}
                  </div>
                  </Card>
                </article>
              ))}
              <div data-plan-comparison className="col-span-full -mx-3 [&_[data-testid=one-comparison-body]_[role=row]:hover]:bg-primary/5">
                <Table accessibilityLabel="Compare Oxy One plans">
                  <TableBody testID="one-comparison-body" style={{ borderTopWidth: 1, borderTopColor: 'var(--border)' }}>
                    {plans[0].featureGroups.flatMap((group, groupIndex) => [
                      <TableRow key={`category-${group.title}`} style={{ borderBottomColor: 'var(--border)' }}>
                        {plans.map((plan) => (
                          <TableCell key={plan.name}>
                            <Text variant="caption-1-semibold">{group.title}</Text>
                          </TableCell>
                        ))}
                      </TableRow>,
                      ...group.items.map((item, itemIndex) => (
                        <TableRow key={`${group.title}-${item.label}`} style={{ borderBottomColor: 'var(--border)' }}>
                          {plans.map((plan) => (
                            <TableCell key={plan.name}>
                              <PlanFeature {...plan.featureGroups[groupIndex].items[itemIndex]} />
                            </TableCell>
                          ))}
                        </TableRow>
                      )),
                    ])}
                  </TableBody>
                  <div data-plan-title-placeholder className="pointer-events-none border-y border-transparent opacity-0">
                    <TableHeader style={{ borderTopWidth: 0, borderBottomWidth: 0, backgroundColor: 'var(--surface)' }}>
                      {plans.map((plan) => (
                        <TableColumn key={plan.name} accessibilityLabel={plan.name}>
                          <Text variant="title-3-bold">{plan.name}</Text>
                        </TableColumn>
                      ))}
                    </TableHeader>
                  </div>
                </Table>
              </div>
            </div>
          </div>

          </div>

          <div aria-hidden="true" className="pointer-events-none z-20 col-start-1 row-start-2 flex min-w-0 flex-col justify-end">
            <div className="sticky bottom-0 shrink-0 overflow-clip [container-type:inline-size]">
              <div className={`grid grid-cols-12 gap-x-6 px-3 supports-[animation-timeline:scroll()]:animate-plan-columns supports-[animation-timeline:scroll()]:[animation-timeline:--plan-scroll] ${plans.length === 1 ? 'min-w-0' : plans.length === 2 ? 'min-w-[624px]' : plans.length === 5 ? 'min-w-[1224px]' : 'min-w-[984px]'}`}>
                <div data-plan-sticky-titles className="relative col-span-12 -mx-3 border-y border-border bg-surface after:pointer-events-none after:absolute after:inset-0 after:border-x after:border-border [&_[role=columnheader]:not(:last-child)]:shadow-[inset_-1px_0_var(--border)]">
            <Table accessibilityLabel="Plan names">
              <TableHeader style={{ borderTopWidth: 0, borderBottomWidth: 0, backgroundColor: 'var(--surface)' }}>
                {plans.map((plan) => (
                  <TableColumn key={plan.name}>
                    <Text variant="title-3-bold">{plan.name}</Text>
                  </TableColumn>
                ))}
              </TableHeader>
            </Table>
                </div>
              </div>
            </div>
          </div>
          </div>
    )
  }

  return (
    <BrandScope className={scope}>
      <section id="oxy-one" style={headerOverlay ? { paddingTop: 'var(--site-header-occlusion-bottom)' } : undefined} className={`${scope} scroll-mt-[var(--plans-anchor-offset,var(--site-header-occlusion-bottom))] bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))] text-foreground`}>
        <div className="container pb-16 lg:pb-24">
          <div className={`relative flex flex-col items-center ${audience ? 'pt-16 lg:pt-24' : 'pt-[116px]'}`}>
            <AnimatedTitle as={headingLevel} className="text-center text-heading-responsive-lg">{t(audience ? `one.${audience}PlansTitle` : 'one.heroTitle')}</AnimatedTitle>
            <p className="mt-4 max-w-2xl text-balance text-center text-muted-foreground text-xl">
              {t(audience ? `one.${audience}PlansDescription` : 'one.lead')}
            </p>
            {family && <p className="mt-4 max-w-2xl text-center text-sm text-muted-foreground">{t('one.familyPool', { count: OXY_ONE_FAMILY_MEMBERS })}</p>}
            {audience === 'business' && <p className="mt-4 max-w-2xl text-center text-sm text-muted-foreground">{t('one.teamBillingNote')}</p>}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
              {(audience ?? 'personal') === 'personal' && <SegmentedControl type="radio" label={t('one.planMembership')} value={mode} onValueChange={changePersonalMode}>
                <SegmentedControlItem value="individual"><SegmentedControlItemText>{t('one.individual')}</SegmentedControlItemText></SegmentedControlItem>
                <SegmentedControlItem value="family"><SegmentedControlItemText>{t('one.family')}</SegmentedControlItemText></SegmentedControlItem>
              </SegmentedControl>}
              <BillingPeriodToggle value={billingPeriod} onValueChange={setBillingPeriod} />
              {audience === 'business' && <div ref={seatsControl} data-seats-chip className="flex items-center gap-3 rounded-full border border-border bg-surface py-1.5 ps-4 pe-1.5">
                <span className="text-sm">{t('one.seats')}</span>
                {isAuthResolved && !isAuthenticated ? <Stepper
                  testID="business-seats"
                  value={estimatedSeats}
                  onValueChange={setEstimatedSeats}
                  min={1}
                  size="sm"
                  accessibilityLabel={t('one.seats')}
                  decrementLabel={t('one.removeSeat')}
                  incrementLabel={t('one.addSeat')}
                  formatValue={value => value.toLocaleString(locale)}
                /> : <span data-organization-seats role="status" title={t('one.organizationSeats')} className="px-3 py-1 text-sm font-semibold tabular-nums">
                  {seats === undefined ? '—' : seats.toLocaleString(locale)}
                </span>}
              </div>}
            </div>
            {audience === 'business' && <div data-business-app-choice className="mt-6 flex max-w-2xl flex-col items-center gap-3">
              <span className="text-sm font-medium">{t('one.businessAppChoice')}</span>
              <div className="flex justify-center"><SegmentedControl type="radio" label={t('one.businessAppChoice')} value={businessApp} onValueChange={setBusinessApp}>
                <SegmentedControlItem value="mercaria"><SegmentedControlItemText>Mercaria</SegmentedControlItemText></SegmentedControlItem>
                <SegmentedControlItem value="homiio"><SegmentedControlItemText>Homiio</SegmentedControlItemText></SegmentedControlItem>
              </SegmentedControl></div>
              <p className="text-balance text-center text-sm text-muted-foreground">{t('one.businessAppNote')}</p>
            </div>}
            {audience === 'business' && isAuthenticated && <div className="mt-3 max-w-lg text-center text-sm text-muted-foreground" role="status">
              {seats === undefined ? seatsMessage : t('one.organizationSeats')}
              {organizationSeats.isError && <Button variant="ghost" className="ms-2" onClick={() => void organizationSeats.refetch()}>{t('one.retrySeats')}</Button>}
            </div>}
            {billingPeriod === 'annual' && <p role="status" className="absolute top-full mt-3 max-w-md animate-price-copy text-center text-sm text-muted-foreground motion-reduce:animate-none">{t('one.annualSavings')}</p>}
          </div>

          {renderPlanGrid(tiers, 'pricing-plans')}

          {(!audience || audience === 'personal') && !family && <div data-one-offers aria-live="polite" className={catalogue.data?.state === 'configured' ? 'mt-20' : undefined}>
            {catalogue.data?.state === 'configured' && billingPeriod === 'monthly' && (
              <div className="mt-6 space-y-6">
                {catalogue.data.plans.map((plan) => (
                  <article key={`${plan.offerId}:${plan.offerVersion}`} className="grid gap-8 rounded-[2rem] bg-[color-mix(in_srgb,var(--background)_84%,var(--primary))] p-7 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
                    <div>
                      <PlanHeading className="mb-5 text-lg font-medium text-primary-text">{plan.displayName}</PlanHeading>
                      {plan.price && (
                        <div className="pb-6">
                          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-foreground">
                            <span data-testid="one-price" className="text-4xl font-bold tracking-tight">
                              {(() => {
                                const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: plan.price.currency, currencyDisplay: 'code' })
                                const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2
                                return formatter.format(plan.price.amountMinorUnits / 10 ** digits)
                              })()}
                            </span>
                            <span className="text-base text-muted-foreground">{t('one.monthly')}</span>
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('one.billingTerms')}</p>
                          {plan.price.taxTreatment === 'inclusive' && plan.price.merchantTotal === 'final' && (
                            <p data-testid="one-tax-terms" className="mt-1 text-sm leading-relaxed text-muted-foreground">{t('one.taxInclusive')}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <ul className="divide-y divide-border">
                      {plan.benefits.map((entry, index) => (
                        <li key={index} className="flex flex-col gap-2 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                          <span className="text-lg font-medium leading-snug text-primary-text">{entry.displayName}</span>
                          {entry.benefit.kind === 'quota' && (
                            <span className="shrink-0 text-base text-muted-foreground">
                              {entry.benefit.unit === 'byte'
                                ? `${entry.benefit.included / 1_000_000_000} GB`
                                : `${entry.benefit.included.toLocaleString(locale)} ${entry.benefit.unit === 'alia_credit' ? t('one.credits') : entry.benefit.unit}`}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </div>}
          <div className="mt-16 flex flex-wrap items-center justify-end gap-5">
            {catalogue.data?.state === 'configured' && catalogue.data.purchase === 'unavailable' && <p role="status" className="max-w-xl text-sm text-muted-foreground">{t('one.status')}</p>}
            <Button href="https://accounts.oxy.so/payments" variant="primary" responsive>{t('one.manage')}</Button>
          </div>
        </div>
      </section>
    </BrandScope>
  )
}

function PlanFeature({ label, detail, app, confirmed = true }: { label: string; detail: string; app?: string; confirmed?: boolean }) {
  const { colors } = useTheme()
  return (
    <div className="flex items-start gap-2 text-start">
      {app ? <img data-subscription-app={app} src={getBrandMark(app)} alt="" aria-hidden="true" width={28} height={28} className="size-7 shrink-0 rounded-md object-contain" /> : <span aria-hidden="true" className="shrink-0">
        {confirmed ? <RiCheckLine width={16} height={16} fill={colors.primary} /> : <span className="inline-block w-4 text-center text-muted-foreground">—</span>}
      </span>}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Text variant="body-regular">{label}</Text>
        <Muted>{detail}</Muted>
      </div>
    </div>
  )
}


/** Alia's 350 ms digit roll and 300 ms supporting-copy fade, using CSS motion.
 * Both price states share a grid cell so changing periods cannot resize a card. */
function PlanPrice({ price, visible, billingPeriod, periodLabel, annualTotal, unavailable }: {
  price?: string
  visible: boolean
  billingPeriod: 'monthly' | 'annual'
  periodLabel: string
  annualTotal?: string
  unavailable: string
}) {
  return (
    <div className="mt-4 grid min-h-[6.25rem] lg:mt-8">
      <div aria-hidden={!visible} className={`col-start-1 row-start-1 transition-opacity duration-300 motion-reduce:transition-none ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div data-testid={visible ? 'one-tier-price' : undefined} className="text-title-md font-bold">
          <span className="sr-only">{price}</span>
          <span key={`${billingPeriod}:${price}`} aria-hidden="true" className="inline-flex h-[1.2em] select-none items-start overflow-hidden leading-[1.2] tabular-nums">
            {Array.from(price ?? '').map((char, index, chars) => /[0-9]/.test(char) ? (
              <span key={`${chars.length - index}-digit`} className="inline-block h-[1.2em] w-[1ch] overflow-hidden">
                <span
                  className="flex animate-price-digit flex-col motion-reduce:animate-none"
                  style={{ '--digit-offset': `${Number(char) * -1.2}em`, transform: 'translateY(var(--digit-offset))' } as CSSProperties}
                >
                  {'0123456789'.split('').map((digit) => <span key={digit} className="h-[1.2em] shrink-0 text-center">{digit}</span>)}
                </span>
              </span>
            ) : <span key={`${chars.length - index}-${char}`}>{char}</span>)}
          </span>
        </div>
        <p key={billingPeriod} className="mt-0.5 animate-price-copy text-xs  motion-reduce:animate-none">{periodLabel}</p>
        {annualTotal && <p key={`total-${billingPeriod}-${annualTotal}`} className="mt-1 animate-price-copy text-xs  motion-reduce:animate-none">{annualTotal}</p>}
      </div>
      <p aria-hidden={visible} key={`${billingPeriod}-${unavailable}`} className={`col-start-1 row-start-1 animate-price-copy text-xl  motion-reduce:animate-none ${visible ? 'invisible' : ''}`}>{unavailable}</p>
    </div>
  )
}

function BillingPeriodToggle({ value, onValueChange }: {
  value: 'monthly' | 'annual'
  onValueChange: (value: 'monthly' | 'annual') => void
}) {
  const { t } = useTranslation()
  return (
    <SegmentedControl type="radio" label={t('one.billingPeriod')} value={value} onValueChange={onValueChange}>
      <SegmentedControlItem value="monthly"><SegmentedControlItemText>{t('pricing.monthly')}</SegmentedControlItemText></SegmentedControlItem>
      <SegmentedControlItem value="annual"><SegmentedControlItemText>{t('pricing.annual')}</SegmentedControlItemText></SegmentedControlItem>
    </SegmentedControl>
  )
}
