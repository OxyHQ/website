import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useOxy } from '@oxy.so/services/ui/client'
import { getNormalizedUserHandle } from '@oxy.so/core'
import Navbar from '../components/layout/Navbar'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import { Link } from '../lib/navigation'
import { useTranslation } from '../lib/i18n'
import { apiFetch } from '../api/client'
import {
  BUDGET_BANDS,
  COMPANY_SIZES,
  DEPLOYMENT_PREFERENCES,
  INQUIRY_INTERESTS,
  LAUNCH_TIMELINES,
  MESSAGE_MAX_LENGTH,
  MODALITIES,
  MONTHLY_VOLUMES,
  PRIVACY_REQUIREMENTS,
  salesInquirySchema,
  type InquiryInterest,
} from '../../server/contracts/salesInquiry'

/**
 * `/contact/sales` — a real form, not a `mailto:`.
 *
 * Three things this page takes seriously.
 *
 *  1. **Nothing typed is ever lost.** The form state survives a failed
 *     submission, a validation error and a rate limit; the error state is
 *     rendered ABOVE the form, which is still there, fully populated.
 *  2. **It never asks for a secret.** No API key, no credential, no prompt, no
 *     regulated data — and the privacy notice says so before the submit button
 *     rather than in a footer nobody reads.
 *  3. **Account association is a hint, not a claim.** A signed-in visitor can
 *     attach an Oxy Account, but the server verifies access before storing it;
 *     the field is a convenience, and the page does not pretend otherwise.
 *
 * Validation runs against the SAME zod schema the endpoint uses
 * (`server/contracts/salesInquiry.ts`), so the form cannot accept something the
 * API rejects with a 400 the visitor has no way to act on.
 */
type FormState = {
  interest: InquiryInterest
  name: string
  email: string
  company: string
  role: string
  country: string
  companySize: string
  website: string
  useCase: string
  monthlyVolume: string
  budget: string
  modalities: string[]
  preferredRegion: string
  privacyRequirements: string[]
  deploymentPreference: string
  launchTimeline: string
  message: string
  marketingConsent: boolean
  accountId: string
  applicationId: string
  /** The honeypot. Hidden from people, tempting to a bot. */
  company_url: string
}

/**
 * Enum value to i18n key.
 *
 * Written out rather than derived from the value: deriving it turned
 * `under_1m_tokens` into a key that did not exist, and a missing translation
 * key renders as the key itself in a `<select>` a buyer is reading.
 */
const VOLUME_LABEL_KEYS: Record<string, string> = {
  evaluating: 'contactSales.volumeEvaluating',
  under_1m_tokens: 'contactSales.volumeUnder1m',
  '1m_50m_tokens': 'contactSales.volume1m50m',
  '50m_500m_tokens': 'contactSales.volume50m500m',
  over_500m_tokens: 'contactSales.volumeOver500m',
}

const BUDGET_LABEL_KEYS: Record<string, string> = {
  undisclosed: 'contactSales.budgetUndisclosed',
  under_1k: 'contactSales.budgetUnder1k',
  '1k_10k': 'contactSales.budget1k10k',
  '10k_50k': 'contactSales.budget10k50k',
  over_50k: 'contactSales.budgetOver50k',
}

const REQUIREMENT_LABEL_KEYS: Record<string, string> = {
  region_constraint: 'contactSales.requirementRegion',
  retention_constraint: 'contactSales.requirementRetention',
  no_upstream_training: 'contactSales.requirementNoTraining',
  dpa_required: 'contactSales.requirementDpa',
  security_review: 'contactSales.requirementSecurityReview',
  none_yet: 'contactSales.requirementNone',
}

const TIMELINE_LABEL_KEYS: Record<string, string> = {
  evaluating: 'contactSales.timelineEvaluating',
  within_1_month: 'contactSales.timelineWithin1Month',
  within_3_months: 'contactSales.timelineWithin3Months',
  within_6_months: 'contactSales.timelineWithin6Months',
  later: 'contactSales.timelineLater',
}

const DEPLOYMENT_LABEL_KEYS: Record<string, string> = {
  shared: 'contactSales.deploymentShared',
  managed: 'contactSales.deploymentManaged',
  dedicated: 'contactSales.deploymentDedicated',
  byok: 'contactSales.deploymentByok',
  unsure: 'contactSales.deploymentUnsure',
}

const INTEREST_LABEL_KEYS: Record<string, string> = {
  oxy_inference: 'contactSales.interestOxyInference',
  managed_inference: 'contactSales.interestManagedInference',
  dedicated_inference: 'contactSales.interestDedicatedInference',
  byok: 'contactSales.interestByok',
  enterprise_platform: 'contactSales.interestEnterprisePlatform',
  alia_for_teams: 'contactSales.interestAliaForTeams',
  other: 'contactSales.interestOther',
}

const EMPTY_FORM: FormState = {
  interest: 'oxy_inference',
  name: '',
  email: '',
  company: '',
  role: '',
  country: '',
  companySize: '',
  website: '',
  useCase: '',
  monthlyVolume: '',
  budget: '',
  modalities: [],
  preferredRegion: '',
  privacyRequirements: [],
  deploymentPreference: '',
  launchTimeline: '',
  message: '',
  marketingConsent: false,
  accountId: '',
  applicationId: '',
  company_url: '',
}

interface Receipt {
  id?: string
  submittedAt: string
}

export default function ContactSalesPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated, oxyServices } = useOxy()

  const presetInterest = useMemo(() => {
    const raw = searchParams.get('interest')
    return (INQUIRY_INTERESTS as readonly string[]).includes(raw ?? '')
      ? (raw as InquiryInterest)
      : undefined
  }, [searchParams])

  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY_FORM,
    interest: presetInterest ?? EMPTY_FORM.interest,
    // A model id arriving from a catalogue page is context for the sales side,
    // so it seeds the use-case field rather than being silently dropped.
    useCase: searchParams.get('model') ? `Interested in ${searchParams.get('model')}. ` : '',
  }))
  const [accounts, setAccounts] = useState<ReadonlyArray<{ id: string; label: string }>>([])
  const [applications, setApplications] = useState<ReadonlyArray<{ id: string; label: string }>>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState<string | undefined>()
  const [receipt, setReceipt] = useState<Receipt | undefined>()
  const summaryRef = useRef<HTMLDivElement>(null)
  const formId = useId()

  // Prefill from the session when there is one. Deliberately only fills BLANK
  // fields, so a visitor who typed a different address keeps it.
  useEffect(() => {
    if (!isAuthenticated || !user) return
    setForm((current) => ({
      ...current,
      // `displayName` is optional; the one sanctioned fallback is the handle.
      name: current.name || user.name?.displayName || getNormalizedUserHandle(user) || '',
      email: current.email || user.email || '',
    }))
  }, [isAuthenticated, user])

  /**
   * The accounts this visitor can actually see.
   *
   * Read from the control plane rather than typed in, and the server re-checks
   * the chosen id before storing it — the list is a convenience, not the
   * authorisation. A failure here leaves the selector out entirely: a lead form
   * is not worth blocking on an optional association.
   */
  useEffect(() => {
    if (!isAuthenticated || !oxyServices) return
    let cancelled = false
    oxyServices
      .listAccounts()
      .then((nodes) => {
        if (cancelled) return
        setAccounts(
          nodes.map((node) => ({
            id: node.accountId,
            label:
              node.account?.name?.displayName ||
              getNormalizedUserHandle(node.account) ||
              node.accountId,
          })),
        )
      })
      .catch(() => setAccounts([]))
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, oxyServices])

  useEffect(() => {
    if (!oxyServices || !form.accountId) {
      setApplications([])
      return
    }
    let cancelled = false
    oxyServices
      .listAccountApps(form.accountId)
      .then((apps) => {
        if (cancelled) return
        setApplications(apps.map((app) => ({ id: app._id, label: app.name })))
      })
      .catch(() => setApplications([]))
    return () => {
      cancelled = true
    }
  }, [oxyServices, form.accountId])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const toggleIn = (key: 'modalities' | 'privacyRequirements', value: string) =>
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((entry) => entry !== value)
        : [...current[key], value],
    }))

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFailure(undefined)

    const payload = {
      ...form,
      role: form.role || undefined,
      country: form.country || undefined,
      companySize: form.companySize || undefined,
      website: form.website || undefined,
      monthlyVolume: form.monthlyVolume || undefined,
      budget: form.budget || undefined,
      preferredRegion: form.preferredRegion || undefined,
      deploymentPreference: form.deploymentPreference || undefined,
      launchTimeline: form.launchTimeline || undefined,
      message: form.message || undefined,
      accountId: form.accountId || undefined,
      applicationId: form.applicationId || undefined,
    }

    const parsed = salesInquirySchema.safeParse(payload)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? '')
        if (field && !next[field]) next[field] = issue.message
      }
      setErrors(next)
      // Move focus to the summary so a screen-reader user is told what happened
      // instead of being left where the submit button used to be.
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      const response = await apiFetch<Receipt>('/sales-inquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      setReceipt(response)
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Unknown error')
      requestAnimationFrame(() => summaryRef.current?.focus())
    } finally {
      setSubmitting(false)
    }
  }

  const seo = {
    title: t('contactSales.seoTitle'),
    description: t('contactSales.seoDescription'),
    canonicalPath: '/contact/sales',
  }

  if (receipt) {
    return (
      <PageShell seo={seo} navbar={<Navbar />} mainClassName="flex-1">
        <section className="container flex flex-col items-start gap-4 py-24">
          <h1 className="text-heading-responsive-lg text-foreground">
            {t('contactSales.successTitle')}
          </h1>
          <p className="max-w-2xl text-pretty text-lg text-muted-foreground">
            {t('contactSales.successBody', { reference: receipt.id ?? '—' })}
          </p>
          <Button href="/ai" variant="outline">
            {t('contactSales.successBack')}
          </Button>
        </section>
      </PageShell>
    )
  }

  const errorEntries = Object.entries(errors)

  return (
    <PageShell seo={seo} navbar={<Navbar />} mainClassName="flex-1">
      <section className="container pt-24 pb-8">
        <h1 className="text-heading-responsive-lg text-balance text-foreground">
          {t('contactSales.heroTitle')}
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
          {t('contactSales.heroSubtitle')}
        </p>
      </section>

      <section className="container pb-24">
        <div
          ref={summaryRef}
          tabIndex={-1}
          role={errorEntries.length > 0 || failure ? 'alert' : undefined}
          className="outline-none"
        >
          {errorEntries.length > 0 && (
            <div className="mb-6 rounded-2xl border border-error/40 bg-error-subtle p-5">
              <h2 className="text-base text-error-text">{t('contactSales.errorSummaryTitle')}</h2>
              <ul className="mt-2 list-disc ps-5 text-sm text-error-text">
                {errorEntries.map(([field, message]) => (
                  <li key={field}>
                    <a href={`#${formId}-${field}`} className="underline underline-offset-4">
                      {message}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {failure && (
            <div className="mb-6 rounded-2xl border border-error/40 bg-error-subtle p-5">
              <h2 className="text-base text-error-text">{t('contactSales.errorTitle')}</h2>
              <p className="mt-2 text-sm text-error-text">
                {t('contactSales.errorBody', { email: 'hello@oxy.so' })}
              </p>
              <p className="mt-2 font-mono text-xs text-error-text/80">{failure}</p>
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-10" noValidate>
          {/* ── What this is about ─────────────────────────────────── */}
          <fieldset className="flex flex-col gap-4">
            <legend className="text-xl text-foreground">{t('contactSales.sectionAbout')}</legend>
            <Field id={`${formId}-interest`} label={t('contactSales.interest')} error={errors.interest}>
              <select
                id={`${formId}-interest`}
                value={form.interest}
                onChange={(event) => update('interest', event.target.value as InquiryInterest)}
                className={inputClass}
              >
                {INQUIRY_INTERESTS.map((value) => (
                  <option key={value} value={value}>
                    {t(INTEREST_LABEL_KEYS[value] ?? value)}
                  </option>
                ))}
              </select>
            </Field>
          </fieldset>

          {/* ── About you ──────────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-4">
            <legend className="text-xl text-foreground">{t('contactSales.sectionYou')}</legend>
            {isAuthenticated && (
              <p className="text-sm text-muted-foreground">{t('contactSales.accountHelp')}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`${formId}-name`} label={t('contactSales.name')} error={errors.name}>
                <input
                  id={`${formId}-name`}
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  autoComplete="name"
                  className={inputClass}
                />
              </Field>
              <Field id={`${formId}-email`} label={t('contactSales.email')} error={errors.email}>
                <input
                  id={`${formId}-email`}
                  type="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  autoComplete="email"
                  className={inputClass}
                />
              </Field>
              <Field id={`${formId}-company`} label={t('contactSales.company')} error={errors.company}>
                <input
                  id={`${formId}-company`}
                  value={form.company}
                  onChange={(event) => update('company', event.target.value)}
                  autoComplete="organization"
                  className={inputClass}
                />
              </Field>
              <Field id={`${formId}-role`} label={t('contactSales.role')} optional>
                <input
                  id={`${formId}-role`}
                  value={form.role}
                  onChange={(event) => update('role', event.target.value)}
                  autoComplete="organization-title"
                  className={inputClass}
                />
              </Field>
              <Field id={`${formId}-country`} label={t('contactSales.country')} optional>
                <input
                  id={`${formId}-country`}
                  value={form.country}
                  onChange={(event) => update('country', event.target.value)}
                  autoComplete="country-name"
                  className={inputClass}
                />
              </Field>
              <Field id={`${formId}-companySize`} label={t('contactSales.companySize')} optional>
                <select
                  id={`${formId}-companySize`}
                  value={form.companySize}
                  onChange={(event) => update('companySize', event.target.value)}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                id={`${formId}-website`}
                label={t('contactSales.website')}
                optional
                error={errors.website}
              >
                <input
                  id={`${formId}-website`}
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  value={form.website}
                  onChange={(event) => update('website', event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            {isAuthenticated && accounts.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id={`${formId}-accountId`}
                  label={t('contactSales.accountSection')}
                  optional
                >
                  <select
                    id={`${formId}-accountId`}
                    value={form.accountId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        accountId: event.target.value,
                        // An application belongs to one account; keeping the old
                        // selection after switching would submit a pair the
                        // server is about to reject.
                        applicationId: '',
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">{t('contactSales.accountNone')}</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.label}
                      </option>
                    ))}
                  </select>
                </Field>
                {applications.length > 0 && (
                  <Field id={`${formId}-applicationId`} label="Application" optional>
                    <select
                      id={`${formId}-applicationId`}
                      value={form.applicationId}
                      onChange={(event) => update('applicationId', event.target.value)}
                      className={inputClass}
                    >
                      <option value="">{t('contactSales.applicationNone')}</option>
                      {applications.map((application) => (
                        <option key={application.id} value={application.id}>
                          {application.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>
            )}
          </fieldset>

          {/* ── About the workload ─────────────────────────────────── */}
          <fieldset className="flex flex-col gap-4">
            <legend className="text-xl text-foreground">{t('contactSales.sectionWorkload')}</legend>
            <Field
              id={`${formId}-useCase`}
              label={t('contactSales.useCase')}
              hint={t('contactSales.useCaseHelp')}
              error={errors.useCase}
            >
              <textarea
                id={`${formId}-useCase`}
                value={form.useCase}
                onChange={(event) => update('useCase', event.target.value)}
                rows={4}
                className={`${inputClass} h-auto rounded-2xl py-3`}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`${formId}-monthlyVolume`} label={t('contactSales.monthlyVolume')} optional>
                <select
                  id={`${formId}-monthlyVolume`}
                  value={form.monthlyVolume}
                  onChange={(event) => update('monthlyVolume', event.target.value)}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {MONTHLY_VOLUMES.map((value) => (
                    <option key={value} value={value}>
                      {t(VOLUME_LABEL_KEYS[value] ?? value)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id={`${formId}-budget`} label={t('contactSales.budget')} optional>
                <select
                  id={`${formId}-budget`}
                  value={form.budget}
                  onChange={(event) => update('budget', event.target.value)}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {BUDGET_BANDS.map((value) => (
                    <option key={value} value={value}>
                      {t(BUDGET_LABEL_KEYS[value] ?? value)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                id={`${formId}-deploymentPreference`}
                label={t('contactSales.deploymentPreference')}
                optional
              >
                <select
                  id={`${formId}-deploymentPreference`}
                  value={form.deploymentPreference}
                  onChange={(event) => update('deploymentPreference', event.target.value)}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {DEPLOYMENT_PREFERENCES.map((value) => (
                    <option key={value} value={value}>
                      {t(DEPLOYMENT_LABEL_KEYS[value] ?? value)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id={`${formId}-launchTimeline`} label={t('contactSales.launchTimeline')} optional>
                <select
                  id={`${formId}-launchTimeline`}
                  value={form.launchTimeline}
                  onChange={(event) => update('launchTimeline', event.target.value)}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {LAUNCH_TIMELINES.map((value) => (
                    <option key={value} value={value}>
                      {t(TIMELINE_LABEL_KEYS[value] ?? value)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                id={`${formId}-preferredRegion`}
                label={t('contactSales.preferredRegion')}
                optional
              >
                <input
                  id={`${formId}-preferredRegion`}
                  value={form.preferredRegion}
                  onChange={(event) => update('preferredRegion', event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <CheckboxGroup
              legend={t('contactSales.modalities')}
              options={MODALITIES.map((value) => ({ value, label: value.replace(/_/g, ' ') }))}
              selected={form.modalities}
              onToggle={(value) => toggleIn('modalities', value)}
            />

            <CheckboxGroup
              legend={t('contactSales.privacyRequirements')}
              options={PRIVACY_REQUIREMENTS.map((value) => ({
                value,
                label: t(REQUIREMENT_LABEL_KEYS[value] ?? value),
              }))}
              selected={form.privacyRequirements}
              onToggle={(value) => toggleIn('privacyRequirements', value)}
            />
          </fieldset>

          {/* ── Anything else ──────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-4">
            <legend className="text-xl text-foreground">{t('contactSales.sectionMessage')}</legend>
            <Field id={`${formId}-message`} label={t('contactSales.message')} optional>
              <textarea
                id={`${formId}-message`}
                value={form.message}
                onChange={(event) => update('message', event.target.value)}
                maxLength={MESSAGE_MAX_LENGTH}
                rows={5}
                className={`${inputClass} h-auto rounded-2xl py-3`}
              />
            </Field>

            <label className="flex items-start gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.marketingConsent}
                onChange={(event) => update('marketingConsent', event.target.checked)}
                className="mt-0.5 size-4 rounded border-border"
              />
              {t('contactSales.marketingConsent')}
            </label>
          </fieldset>

          {/*
            The honeypot. `aria-hidden` plus `tabIndex={-1}` keeps it away from
            assistive technology and from the tab order; an off-screen position
            rather than `display: none`, because some bots skip hidden inputs.
          */}
          <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] opacity-0">
            <label htmlFor={`${formId}-company_url`}>Company URL</label>
            <input
              id={`${formId}-company_url`}
              name="company_url"
              tabIndex={-1}
              autoComplete="off"
              value={form.company_url}
              onChange={(event) => update('company_url', event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-6">
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t('contactSales.privacyNotice')}{' '}
              <Link to="/legal/privacy" className="underline underline-offset-4">
                {t('contactSales.seoTitle')}
              </Link>
            </p>
            <div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? t('contactSales.submitting') : t('contactSales.submit')}
              </button>
            </div>
          </div>
        </form>
      </section>
    </PageShell>
  )
}

const inputClass =
  'h-10 w-full rounded-full border border-border bg-background px-4 text-sm text-foreground'

function Field({
  id,
  label,
  hint,
  error,
  optional = false,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  optional?: boolean
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-foreground">
        {label}
        {optional && <span className="ms-1 text-muted-foreground">({t('contactSales.optional')})</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-error-text">{error}</p>}
    </div>
  )
}

function CheckboxGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string
  options: ReadonlyArray<{ value: string; label: string }>
  selected: readonly string[]
  onToggle: (value: string) => void
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm text-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => onToggle(option.value)}
              className="size-4 rounded border-border"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

