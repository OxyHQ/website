import { useState, type FormEvent } from 'react'
import { Dialog, type DialogControlProps } from '@oxyhq/bloom/dialog'
import { X } from 'lucide-react'

interface StartupProgramDialogProps {
  control: DialogControlProps
}

interface StartupApplication {
  fullName: string
  email: string
  companyName: string
  companyWebsite: string
  role: string
  teamSize: string
  fundingStage: string
  useCase: string
  caseStudy: boolean
}

const INITIAL_APPLICATION: StartupApplication = {
  fullName: '',
  email: '',
  companyName: '',
  companyWebsite: '',
  role: '',
  teamSize: '',
  fundingStage: '',
  useCase: '',
  caseStudy: false,
}

const inputClasses =
  'flex h-12 w-full rounded-full border border-input bg-background px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'

const selectClasses =
  'h-10 w-full appearance-none rounded-full border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:outline-none'

function StartupSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none text-foreground" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${selectClasses} pr-9 ${value ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-muted-foreground" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>
    </div>
  )
}

function encodeMailto(application: StartupApplication) {
  const subject = `Oxy Startup Program application — ${application.companyName.trim()}`
  const body = [
    `Full name: ${application.fullName.trim()}`,
    `Work email: ${application.email.trim()}`,
    `Company: ${application.companyName.trim()}`,
    `Website: ${application.companyWebsite.trim()}`,
    `Role: ${application.role.trim() || 'Not provided'}`,
    `Team size: ${application.teamSize || 'Not provided'}`,
    `Funding stage: ${application.fundingStage || 'Not provided'}`,
    '',
    'What they are building:',
    application.useCase.trim(),
    '',
    `Open to a case study: ${application.caseStudy ? 'Yes' : 'No'}`,
  ].join('\n')

  return `mailto:partners@oxy.so?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export default function StartupProgramDialog({ control }: StartupProgramDialogProps) {
  const [application, setApplication] = useState<StartupApplication>(INITIAL_APPLICATION)

  const requiredFieldsReady =
    application.fullName.trim().length > 0 &&
    application.email.trim().length > 0 &&
    application.companyName.trim().length > 0 &&
    application.companyWebsite.trim().length > 0 &&
    application.useCase.trim().length > 0

  function updateField<K extends keyof StartupApplication>(field: K, value: StartupApplication[K]) {
    setApplication((current) => ({ ...current, [field]: value }))
  }

  function resetApplication() {
    setApplication(INITIAL_APPLICATION)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!requiredFieldsReady) return

    window.location.href = encodeMailto(application)
    control.close()
  }

  return (
    <Dialog
      control={control}
      label="Apply to the Oxy Startup Program"
      maxWidth={512}
      maxHeightRatio={0.9}
      contentPadding={0}
      onClose={resetApplication}
    >
      <div className="relative w-full p-4 text-start sm:p-6">
        <div className="flex flex-col space-y-1.5 text-center sm:text-start">
          <h2 className="text-lg font-medium leading-none tracking-tight text-foreground">
            Apply to the Startup Program
          </h2>
          <p className="text-sm text-muted-foreground">
            Tell us what you&rsquo;re building and how Oxy could help. We&rsquo;ll review your application and get in touch.
          </p>
        </div>

        <form autoComplete="off" className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium leading-none text-foreground">Full name *</span>
              <input
                autoComplete="name"
                className={inputClasses}
                name="full_name"
                placeholder="Jane Doe"
                required
                type="text"
                value={application.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium leading-none text-foreground">Work email *</span>
              <input
                autoComplete="email"
                className={inputClasses}
                name="email"
                placeholder="jane@startup.com"
                required
                type="email"
                value={application.email}
                onChange={(event) => updateField('email', event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium leading-none text-foreground">Company name *</span>
              <input
                autoComplete="organization"
                className={inputClasses}
                name="company_name"
                placeholder="Acme Inc."
                required
                type="text"
                value={application.companyName}
                onChange={(event) => updateField('companyName', event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium leading-none text-foreground">Company website *</span>
              <input
                autoComplete="url"
                className={inputClasses}
                name="company_website"
                placeholder="acme.com"
                required
                type="text"
                value={application.companyWebsite}
                onChange={(event) => updateField('companyWebsite', event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium leading-none text-foreground">Your role</span>
              <input
                autoComplete="organization-title"
                className={inputClasses}
                name="role"
                placeholder="Founder / CTO"
                type="text"
                value={application.role}
                onChange={(event) => updateField('role', event.target.value)}
              />
            </label>

            <StartupSelect
              id="startup-team-size"
              label="Team size"
              value={application.teamSize}
              onChange={(value) => updateField('teamSize', value)}
              options={[
                { value: '1-10', label: '1–10' },
                { value: '11-50', label: '11–50' },
                { value: '51-200', label: '51–200' },
                { value: '200+', label: '200+' },
              ]}
            />
          </div>

          <StartupSelect
            id="startup-funding-stage"
            label="Funding stage"
            value={application.fundingStage}
            onChange={(value) => updateField('fundingStage', value)}
            options={[
              { value: 'idea', label: 'Idea / Building' },
              { value: 'pre_seed', label: 'Pre-seed' },
              { value: 'seed', label: 'Seed' },
              { value: 'series_a', label: 'Series A' },
              { value: 'series_b_plus', label: 'Series B+' },
              { value: 'bootstrapped', label: 'Bootstrapped' },
            ]}
          />

          <label className="space-y-2">
            <span className="text-sm font-medium leading-none text-foreground">What are you building? *</span>
            <textarea
              className="min-h-[110px] w-full resize-y rounded-3xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none"
              name="use_case"
              placeholder="Tell us about your product, who it serves and how you plan to use Oxy."
              required
              value={application.useCase}
              onChange={(event) => updateField('useCase', event.target.value)}
            />
          </label>

          <label className="flex cursor-pointer flex-row items-start gap-3 text-sm leading-snug text-foreground">
            <input
              checked={application.caseStudy}
              className="mt-0.5 size-5 shrink-0 accent-primary"
              name="case_study"
              type="checkbox"
              onChange={(event) => updateField('caseStudy', event.target.checked)}
            />
            <span>I&rsquo;m open to being featured in an Oxy case study after onboarding.</span>
          </label>

          <button
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-medium leading-5 text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            disabled={!requiredFieldsReady}
            type="submit"
          >
            Submit application
          </button>
        </form>

        <button
          aria-label="Close"
          className="absolute right-4 top-4 rounded-sm text-foreground/60 transition-opacity hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          type="button"
          onClick={() => control.close()}
        >
          <X aria-hidden="true" className="size-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </Dialog>
  )
}
