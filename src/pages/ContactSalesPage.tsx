import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOxy } from '@oxy.so/services/ui/client';
import { getNormalizedUserHandle } from '@oxy.so/core';
import { Checkbox } from '@oxy.so/bloom/checkbox';
import { Field } from '@oxy.so/bloom/field';
import { TextFieldInput } from '@oxy.so/bloom/text-field';
import { Textarea } from '@oxy.so/bloom/textarea';
import Navbar from '../components/layout/Navbar';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import OptionSelect, { type SelectOption } from '../components/ui/OptionSelect';
import { Link } from '../lib/navigation';
import { useTranslation } from '../lib/i18n';
import { apiFetch } from '../api/client';
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
} from '../../server/contracts/salesInquiry';

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
  interest: InquiryInterest;
  name: string;
  email: string;
  company: string;
  role: string;
  country: string;
  companySize: string;
  website: string;
  useCase: string;
  monthlyVolume: string;
  budget: string;
  modalities: string[];
  preferredRegion: string;
  privacyRequirements: string[];
  deploymentPreference: string;
  launchTimeline: string;
  message: string;
  marketingConsent: boolean;
  accountId: string;
  applicationId: string;
  /** The honeypot. Hidden from people, tempting to a bot. */
  company_url: string;
};

/**
 * Enum value to i18n key.
 *
 * Written out rather than derived from the value: deriving it turned
 * `under_1m_tokens` into a key that did not exist, and a missing translation
 * key renders as the key itself in a select a buyer is reading.
 */
const VOLUME_LABEL_KEYS: Record<string, string> = {
  evaluating: 'contactSales.volumeEvaluating',
  under_1m_tokens: 'contactSales.volumeUnder1m',
  '1m_50m_tokens': 'contactSales.volume1m50m',
  '50m_500m_tokens': 'contactSales.volume50m500m',
  over_500m_tokens: 'contactSales.volumeOver500m',
};

const BUDGET_LABEL_KEYS: Record<string, string> = {
  undisclosed: 'contactSales.budgetUndisclosed',
  under_1k: 'contactSales.budgetUnder1k',
  '1k_10k': 'contactSales.budget1k10k',
  '10k_50k': 'contactSales.budget10k50k',
  over_50k: 'contactSales.budgetOver50k',
};

const REQUIREMENT_LABEL_KEYS: Record<string, string> = {
  region_constraint: 'contactSales.requirementRegion',
  retention_constraint: 'contactSales.requirementRetention',
  no_upstream_training: 'contactSales.requirementNoTraining',
  dpa_required: 'contactSales.requirementDpa',
  security_review: 'contactSales.requirementSecurityReview',
  none_yet: 'contactSales.requirementNone',
};

const TIMELINE_LABEL_KEYS: Record<string, string> = {
  evaluating: 'contactSales.timelineEvaluating',
  within_1_month: 'contactSales.timelineWithin1Month',
  within_3_months: 'contactSales.timelineWithin3Months',
  within_6_months: 'contactSales.timelineWithin6Months',
  later: 'contactSales.timelineLater',
};

const DEPLOYMENT_LABEL_KEYS: Record<string, string> = {
  shared: 'contactSales.deploymentShared',
  managed: 'contactSales.deploymentManaged',
  dedicated: 'contactSales.deploymentDedicated',
  byok: 'contactSales.deploymentByok',
  unsure: 'contactSales.deploymentUnsure',
};

const INTEREST_LABEL_KEYS: Record<string, string> = {
  oxy_inference: 'contactSales.interestOxyInference',
  managed_inference: 'contactSales.interestManagedInference',
  dedicated_inference: 'contactSales.interestDedicatedInference',
  byok: 'contactSales.interestByok',
  enterprise_platform: 'contactSales.interestEnterprisePlatform',
  alia_for_teams: 'contactSales.interestAliaForTeams',
  other: 'contactSales.interestOther',
};

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
};

interface Receipt {
  id?: string;
  submittedAt: string;
}

export default function ContactSalesPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, oxyServices } = useOxy();

  const presetInterest = useMemo(() => {
    const raw = searchParams.get('interest');
    return (INQUIRY_INTERESTS as readonly string[]).includes(raw ?? '')
      ? (raw as InquiryInterest)
      : undefined;
  }, [searchParams]);

  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY_FORM,
    interest: presetInterest ?? EMPTY_FORM.interest,
    // A model id arriving from a catalogue page is context for the sales side,
    // so it seeds the use-case field rather than being silently dropped.
    useCase: searchParams.get('model') ? `Interested in ${searchParams.get('model')}. ` : '',
  }));
  const [accounts, setAccounts] = useState<ReadonlyArray<{ id: string; label: string }>>([]);
  const [applications, setApplications] = useState<ReadonlyArray<{ id: string; label: string }>>(
    [],
  );
  /** Fields the visitor has edited. Until then the session prefill is shown. */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | undefined>();
  const [receipt, setReceipt] = useState<Receipt | undefined>();
  const summaryRef = useRef<HTMLDivElement>(null);
  const formId = useId();

  /**
   * Prefill from the session, DERIVED during render rather than written into
   * state by an effect.
   *
   * An effect that copies props into state re-renders the page twice and
   * fights the user for the field: the session resolves late, and a visitor who
   * had already typed would see their text replaced. Deriving it means the
   * prefill is what the field shows until the visitor touches it, and after
   * that it is theirs — including when they clear it, which a
   * `form.name || sessionName` fallback would silently undo.
   */
  const sessionName =
    isAuthenticated && user
      ? // `displayName` is optional; the one sanctioned fallback is the handle.
        user.name?.displayName || getNormalizedUserHandle(user) || ''
      : '';
  const sessionEmail = isAuthenticated && user ? user.email || '' : '';
  const nameValue = touched.name ? form.name : form.name || sessionName;
  const emailValue = touched.email ? form.email : form.email || sessionEmail;

  /**
   * The accounts this visitor can actually see.
   *
   * Read from the control plane rather than typed in, and the server re-checks
   * the chosen id before storing it — the list is a convenience, not the
   * authorisation. A failure here leaves the selector out entirely: a lead form
   * is not worth blocking on an optional association.
   */
  useEffect(() => {
    if (!isAuthenticated || !oxyServices) return;
    let cancelled = false;
    oxyServices.accounts
      .list()
      .then((nodes) => {
        if (cancelled) return;
        setAccounts(
          nodes.map((node) => ({
            id: node.accountId,
            label:
              node.account?.name?.displayName ||
              getNormalizedUserHandle(node.account) ||
              node.accountId,
          })),
        );
      })
      .catch(() => setAccounts([]));
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, oxyServices]);

  useEffect(() => {
    // No synchronous setState in the effect body: clearing the list when the
    // account changes is the CHANGE HANDLER's job (it resets `applicationId` in
    // the same breath), and rendering reads `form.accountId` anyway, so a stale
    // list cannot be shown while a new one loads.
    if (!oxyServices || !form.accountId) return;
    let cancelled = false;
    oxyServices.apps
      .list(form.accountId)
      .then((apps) => {
        if (cancelled) return;
        setApplications(apps.map((app) => ({ id: app._id, label: app.name })));
      })
      .catch(() => {
        if (!cancelled) setApplications([]);
      });
    return () => {
      cancelled = true;
    };
  }, [oxyServices, form.accountId]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setTouched((current) => (current[key as string] ? current : { ...current, [key]: true }));
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleIn = (key: 'modalities' | 'privacyRequirements', value: string) =>
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((entry) => entry !== value)
        : [...current[key], value],
    }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFailure(undefined);

    const payload = {
      ...form,
      name: nameValue,
      email: emailValue,
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
    };

    const parsed = salesInquirySchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? '');
        if (field && !next[field]) next[field] = issue.message;
      }
      setErrors(next);
      // Move focus to the summary so a screen-reader user is told what happened
      // instead of being left where the submit button used to be.
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const response = await apiFetch<Receipt>('/sales-inquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      setReceipt(response);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Unknown error');
      requestAnimationFrame(() => summaryRef.current?.focus());
    } finally {
      setSubmitting(false);
    }
  }

  const seo = {
    title: t('contactSales.seoTitle'),
    description: t('contactSales.seoDescription'),
    canonicalPath: '/contact/sales',
  };

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
    );
  }

  const errorEntries = Object.entries(errors);
  const optionalName = (label: string) => `${label} (${t('contactSales.optional')})`;
  const optionalCaption = (label: string) => (
    <>
      {label}
      <span className="ms-1 text-muted-foreground">({t('contactSales.optional')})</span>
    </>
  );

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
            <Field
              nativeID={`${formId}-interest`}
              label={t('contactSales.interest')}
              error={errors.interest}
            >
              <OptionSelect
                label={t('contactSales.interest')}
                value={form.interest}
                onValueChange={(next) => update('interest', next as InquiryInterest)}
                options={INQUIRY_INTERESTS.map((value) => ({
                  value,
                  label: t(INTEREST_LABEL_KEYS[value] ?? value),
                }))}
              />
            </Field>
          </fieldset>

          {/* ── About you ──────────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-4">
            <legend className="text-xl text-foreground">{t('contactSales.sectionYou')}</legend>
            {isAuthenticated && (
              <p className="text-sm text-muted-foreground">{t('contactSales.accountHelp')}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field nativeID={`${formId}-name`} label={t('contactSales.name')} error={errors.name}>
                <TextFieldInput
                  label={t('contactSales.name')}
                  placeholder={null}
                  value={nameValue}
                  onValueChange={(next) => update('name', next)}
                  autoComplete="name"
                />
              </Field>
              <Field
                nativeID={`${formId}-email`}
                label={t('contactSales.email')}
                error={errors.email}
              >
                <TextFieldInput
                  label={t('contactSales.email')}
                  placeholder={null}
                  keyboardType="email-address"
                  value={emailValue}
                  onValueChange={(next) => update('email', next)}
                  autoComplete="email"
                />
              </Field>
              <Field
                nativeID={`${formId}-company`}
                label={t('contactSales.company')}
                error={errors.company}
              >
                <TextFieldInput
                  label={t('contactSales.company')}
                  placeholder={null}
                  value={form.company}
                  onValueChange={(next) => update('company', next)}
                  autoComplete="organization"
                />
              </Field>
              <Field nativeID={`${formId}-role`} label={optionalCaption(t('contactSales.role'))}>
                <TextFieldInput
                  label={optionalName(t('contactSales.role'))}
                  placeholder={null}
                  value={form.role}
                  onValueChange={(next) => update('role', next)}
                  autoComplete="organization-title"
                />
              </Field>
              <Field
                nativeID={`${formId}-country`}
                label={optionalCaption(t('contactSales.country'))}
              >
                <TextFieldInput
                  label={optionalName(t('contactSales.country'))}
                  placeholder={null}
                  value={form.country}
                  onValueChange={(next) => update('country', next)}
                  autoComplete="country"
                />
              </Field>
              <Field
                nativeID={`${formId}-companySize`}
                label={optionalCaption(t('contactSales.companySize'))}
              >
                <OptionSelect
                  label={t('contactSales.companySize')}
                  value={form.companySize}
                  onValueChange={(next) => update('companySize', next)}
                  options={withNone(COMPANY_SIZES.map((size) => ({ value: size, label: size })))}
                  emptyIsPlaceholder
                />
              </Field>
              <Field
                nativeID={`${formId}-website`}
                label={optionalCaption(t('contactSales.website'))}
                error={errors.website}
              >
                <TextFieldInput
                  label={optionalName(t('contactSales.website'))}
                  keyboardType="url"
                  inputMode="url"
                  placeholder="https://"
                  value={form.website}
                  onValueChange={(next) => update('website', next)}
                />
              </Field>
            </div>

            {isAuthenticated && accounts.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  nativeID={`${formId}-accountId`}
                  label={optionalCaption(t('contactSales.accountSection'))}
                >
                  <OptionSelect
                    label={t('contactSales.accountSection')}
                    value={form.accountId}
                    onValueChange={(next) => {
                      // An application belongs to one account; keeping the old
                      // selection — or the old list — after switching would
                      // submit a pair the server is about to reject.
                      setApplications([]);
                      setForm((current) => ({
                        ...current,
                        accountId: next,
                        applicationId: '',
                      }));
                    }}
                    options={[
                      { value: '', label: t('contactSales.accountNone') },
                      ...accounts.map((account) => ({ value: account.id, label: account.label })),
                    ]}
                  />
                </Field>
                {form.accountId && applications.length > 0 && (
                  <Field
                    nativeID={`${formId}-applicationId`}
                    label={optionalCaption('Application')}
                  >
                    <OptionSelect
                      label="Application"
                      value={form.applicationId}
                      onValueChange={(next) => update('applicationId', next)}
                      options={[
                        { value: '', label: t('contactSales.applicationNone') },
                        ...applications.map((application) => ({
                          value: application.id,
                          label: application.label,
                        })),
                      ]}
                    />
                  </Field>
                )}
              </div>
            )}
          </fieldset>

          {/* ── About the workload ─────────────────────────────────── */}
          <fieldset className="flex flex-col gap-4">
            <legend className="text-xl text-foreground">{t('contactSales.sectionWorkload')}</legend>
            <Field
              nativeID={`${formId}-useCase`}
              label={t('contactSales.useCase')}
              description={t('contactSales.useCaseHelp')}
              error={errors.useCase}
            >
              <Textarea
                value={form.useCase}
                onValueChange={(next) => update('useCase', next)}
                rows={4}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                nativeID={`${formId}-monthlyVolume`}
                label={optionalCaption(t('contactSales.monthlyVolume'))}
              >
                <OptionSelect
                  label={t('contactSales.monthlyVolume')}
                  value={form.monthlyVolume}
                  onValueChange={(next) => update('monthlyVolume', next)}
                  options={withNone(
                    MONTHLY_VOLUMES.map((value) => ({
                      value,
                      label: t(VOLUME_LABEL_KEYS[value] ?? value),
                    })),
                  )}
                  emptyIsPlaceholder
                />
              </Field>
              <Field
                nativeID={`${formId}-budget`}
                label={optionalCaption(t('contactSales.budget'))}
              >
                <OptionSelect
                  label={t('contactSales.budget')}
                  value={form.budget}
                  onValueChange={(next) => update('budget', next)}
                  options={withNone(
                    BUDGET_BANDS.map((value) => ({
                      value,
                      label: t(BUDGET_LABEL_KEYS[value] ?? value),
                    })),
                  )}
                  emptyIsPlaceholder
                />
              </Field>
              <Field
                nativeID={`${formId}-deploymentPreference`}
                label={optionalCaption(t('contactSales.deploymentPreference'))}
              >
                <OptionSelect
                  label={t('contactSales.deploymentPreference')}
                  value={form.deploymentPreference}
                  onValueChange={(next) => update('deploymentPreference', next)}
                  options={withNone(
                    DEPLOYMENT_PREFERENCES.map((value) => ({
                      value,
                      label: t(DEPLOYMENT_LABEL_KEYS[value] ?? value),
                    })),
                  )}
                  emptyIsPlaceholder
                />
              </Field>
              <Field
                nativeID={`${formId}-launchTimeline`}
                label={optionalCaption(t('contactSales.launchTimeline'))}
              >
                <OptionSelect
                  label={t('contactSales.launchTimeline')}
                  value={form.launchTimeline}
                  onValueChange={(next) => update('launchTimeline', next)}
                  options={withNone(
                    LAUNCH_TIMELINES.map((value) => ({
                      value,
                      label: t(TIMELINE_LABEL_KEYS[value] ?? value),
                    })),
                  )}
                  emptyIsPlaceholder
                />
              </Field>
              <Field
                nativeID={`${formId}-preferredRegion`}
                label={optionalCaption(t('contactSales.preferredRegion'))}
              >
                <TextFieldInput
                  label={optionalName(t('contactSales.preferredRegion'))}
                  placeholder={null}
                  value={form.preferredRegion}
                  onValueChange={(next) => update('preferredRegion', next)}
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
            <Field
              nativeID={`${formId}-message`}
              label={optionalCaption(t('contactSales.message'))}
            >
              <Textarea
                accessibilityLabel={optionalName(t('contactSales.message'))}
                value={form.message}
                onValueChange={(next) => update('message', next)}
                maxLength={MESSAGE_MAX_LENGTH}
                rows={5}
              />
            </Field>

            <Checkbox
              checked={form.marketingConsent}
              onCheckedChange={(next) => update('marketingConsent', next)}
              label={t('contactSales.marketingConsent')}
            />
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
              <Link to="/transparency/legal/privacy" className="underline underline-offset-4">
                {t('contactSales.seoTitle')}
              </Link>
            </p>
            <div>
              <Button type="submit" variant="inverse" disabled={submitting}>
                {submitting ? t('contactSales.submitting') : t('contactSales.submit')}
              </Button>
            </div>
          </div>
        </form>
      </section>
    </PageShell>
  );
}

/** The "—" row that leaves an optional select unanswered. */
function withNone(options: SelectOption[]): SelectOption[] {
  return [{ value: '', label: '—' }, ...options];
}

function CheckboxGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  selected: readonly string[];
  onToggle: (value: string) => void;
}) {
  return (
    <Field label={legend} multiple>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {options.map((option) => (
          <Checkbox
            key={option.value}
            checked={selected.includes(option.value)}
            onCheckedChange={() => onToggle(option.value)}
            label={option.label}
          />
        ))}
      </div>
    </Field>
  );
}
