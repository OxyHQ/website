import { useState, type FormEvent } from 'react'
import { Checkbox } from '@oxy.so/bloom/checkbox'
import { Field } from '@oxy.so/bloom/field'
import { TextFieldInput } from '@oxy.so/bloom/text-field'
import { Textarea } from '@oxy.so/bloom/textarea'
import { Dialog, type DialogControlProps } from '@oxy.so/bloom/dialog'
import { RiCloseLine } from '@oxy.so/bloom/icons/RiCloseLine'
import Button from '../ui/Button'
import OptionSelect from '../ui/OptionSelect'

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

function StartupSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
}) {
  return (
    <Field label={label}>
      <OptionSelect
        label={label}
        value={value}
        onValueChange={onChange}
        options={[{ value: '', label: 'Select' }, ...options]}
        emptyIsPlaceholder
      />
    </Field>
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
            <Field label="Full name" required>
              <TextFieldInput
                label="Full name"
                autoComplete="name"
                placeholder="Jane Doe"
                value={application.fullName}
                onValueChange={(value) => updateField('fullName', value)}
              />
            </Field>

            <Field label="Work email" required>
              <TextFieldInput
                label="Work email"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="jane@startup.com"
                value={application.email}
                onValueChange={(value) => updateField('email', value)}
              />
            </Field>

            <Field label="Company name" required>
              <TextFieldInput
                label="Company name"
                autoComplete="organization"
                placeholder="Acme Inc."
                value={application.companyName}
                onValueChange={(value) => updateField('companyName', value)}
              />
            </Field>

            <Field label="Company website" required>
              <TextFieldInput
                label="Company website"
                autoComplete="url"
                placeholder="acme.com"
                value={application.companyWebsite}
                onValueChange={(value) => updateField('companyWebsite', value)}
              />
            </Field>

            <Field label="Your role">
              <TextFieldInput
                label="Your role"
                autoComplete="organization-title"
                placeholder="Founder / CTO"
                value={application.role}
                onValueChange={(value) => updateField('role', value)}
              />
            </Field>

            <StartupSelect
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

          <Field label="What are you building?" required>
            <Textarea
              placeholder="Tell us about your product, who it serves and how you plan to use Oxy."
              rows={4}
              value={application.useCase}
              onValueChange={(value) => updateField('useCase', value)}
            />
          </Field>

          <Checkbox
            checked={application.caseStudy}
            onCheckedChange={(checked) => updateField('caseStudy', checked)}
            label="I’m open to being featured in an Oxy case study after onboarding."
          />

          <Button className="w-full" disabled={!requiredFieldsReady} type="submit">
            Submit application
          </Button>
        </form>

        <button
          aria-label="Close"
          className="absolute right-4 top-4 rounded-sm text-foreground/60 transition-opacity hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          type="button"
          onClick={() => control.close()}
        >
          <RiCloseLine width={16} height={16} fill="currentColor" aria-hidden />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </Dialog>
  )
}
