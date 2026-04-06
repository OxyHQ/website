import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Button from '../ui/Button'
import { useJob } from '../../api/hooks'
import { type DescriptionBlock } from '../../data/careers'
import SEO from '../SEO'
import StructuredData from '../StructuredData'

function DashedLineH() {
  return (
    <svg width="100%" height="1" className="text-border">
      <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
    </svg>
  )
}

function SolidLineH() {
  return (
    <svg width="100%" height="1" className="text-border">
      <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  )
}

function DashedLineV({ className = '' }: { className?: string }) {
  return (
    <svg width="1" height="100%" className={`text-border ${className}`}>
      <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
    </svg>
  )
}

function SolidLineV({ className = '' }: { className?: string }) {
  return (
    <svg width="1" height="100%" className={`text-border ${className}`}>
      <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeLinecap="round" />
    </svg>
  )
}

function DescriptionContent({ blocks }: { blocks: DescriptionBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'paragraph') {
          return (
            <p
              key={i}
              className="not-first:mt-[13px] text-pretty text-secondary-foreground leading-[26px]"
              dangerouslySetInnerHTML={{ __html: block.text }}
            />
          )
        }
        if (block.type === 'heading') {
          return (
            <h3 key={i} className="relative not-first:mt-7 not-last:mb-3 font-semibold text-lg text-secondary-foreground">
              <strong className="font-semibold">{block.text}</strong>
            </h3>
          )
        }
        if (block.type === 'list') {
          return (
            <ul key={i} className="not-first:mt-1.5 list-[square] pl-3.5 marker:text-muted-foreground">
              {block.items.map((item, j) => (
                <li key={j} className="pt-1 pl-1.5 first:pt-1.5 [&:not(:has(ul,li))]:pb-1.5">
                  <p className="not-first:mt-[13px] text-pretty text-secondary-foreground leading-[26px]">{item}</p>
                </li>
              ))}
            </ul>
          )
        }
        return null
      })}
    </>
  )
}

const inputClasses =
  'block w-full rounded-[10px] bg-background p-[10px_13px] outline-hidden transition-all duration-300 ease-out text-secondary-foreground placeholder:text-muted-foreground border border-border hover:border-border hover:shadow-[0px_1px_4px_rgba(56,62,71,0.1)] focus:border-blue-500 focus:ring-[3px] focus:ring-blue-300'

function ApplicationForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    resume: null as File | null,
    linkedin: '',
    coverLetter: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <form className="space-y-6 py-8" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-secondary-foreground">
            First name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="First name"
            className={inputClasses}
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-secondary-foreground">
            Last name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Last name"
            className={inputClasses}
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-secondary-foreground">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          required
          placeholder="you@example.com"
          className={inputClasses}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-secondary-foreground">
          Phone <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <input
          type="tel"
          placeholder="+1 (555) 000-0000"
          className={inputClasses}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-secondary-foreground">
          Resume <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          required
          accept=".pdf,.doc,.docx"
          className={`${inputClasses} file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:px-3 file:py-1 file:text-sm file:font-medium file:text-secondary-foreground cursor-pointer`}
          onChange={(e) => setFormData({ ...formData, resume: e.target.files?.[0] ?? null })}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-secondary-foreground">
          LinkedIn URL <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <input
          type="url"
          placeholder="https://linkedin.com/in/yourprofile"
          className={inputClasses}
          value={formData.linkedin}
          onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-secondary-foreground">
          Cover letter <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <textarea
          rows={5}
          placeholder="Tell us why you'd be a great fit..."
          className={`${inputClasses} resize-y`}
          value={formData.coverLetter}
          onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
        />
      </div>

      <Button type="submit" variant="primary" size="md">
        Submit application
      </Button>
    </form>
  )
}

function NotFoundView() {
  return (
    <article>
      <div className="grid grid-cols-12 py-20">
        <div className="col-[2/-2]">
          <h1 className="text-heading-responsive-lg">Position not found.</h1>
          <p className="pt-6 text-muted-foreground text-xl">
            This job posting doesn&apos;t exist or may have been removed.
          </p>
          <p className="pt-8">
            <Link
              to="/company/careers"
              className="underline decoration-2 decoration-border underline-offset-2 transition-all duration-700 hover:brightness-75 hover:duration-300 active:brightness-50 active:duration-0 text-secondary-foreground"
            >
              View all open positions
            </Link>
          </p>
        </div>
      </div>
    </article>
  )
}

export default function CareerDetailContent() {
  const { slug } = useParams<{ slug: string }>()
  const { data: job, isPending } = useJob(slug ?? '')

  if (isPending) {
    return (
      <div className="container py-40">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-surface" />
          <div className="h-12 w-full animate-pulse rounded-lg bg-surface" />
          <div className="h-6 w-64 animate-pulse rounded-lg bg-surface" />
          <div className="mt-10 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-surface" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <>
        <SEO
          title="Position Not Found"
          description="This job posting doesn't exist or may have been removed."
          canonicalPath={`/company/careers/${slug}`}
          noIndex
        />
        <NotFoundView />
      </>
    )
  }

  const engagement = job.engagement ?? job.type ?? 'Full-time'

  return (
    <article>
      <SEO
        title={`${job.title} — ${job.department}`}
        description={job.subtitle || `Join Oxy as ${job.title}. ${job.location}. ${engagement}.`}
        canonicalPath={`/company/careers/${slug}`}
      />
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: job.subtitle,
        datePosted: job.createdAt || new Date().toISOString(),
        employmentType: engagement === 'Full-time' ? 'FULL_TIME' : engagement === 'Part-time' ? 'PART_TIME' : 'CONTRACTOR',
        jobLocation: {
          '@type': 'Place',
          address: job.location,
        },
        hiringOrganization: {
          '@type': 'Organization',
          name: 'Oxy',
          sameAs: 'https://oxy.so',
          logo: 'https://oxy.so/favicon.svg',
        },
      }} />
      {/* Breadcrumb aside */}
      <aside className="relative grid h-28 grid-cols-12 items-end pb-5">
        <DashedLineV className="absolute col-[-2] max-lg:hidden" />
        <p className="col-2 whitespace-nowrap text-xs uppercase tracking-wider text-muted-foreground">
          <Link className="transition-colors hover:text-foreground" to="/company/careers">Careers</Link>{' '}
          / <span className="text-muted-foreground">{job.department}</span>
        </p>
        <p className="col-[-2] justify-self-center whitespace-nowrap text-xs uppercase tracking-wider text-muted-foreground max-lg:col-[-3] max-lg:justify-self-end">
          {job.department}
        </p>
      </aside>

      <DashedLineH />

      {/* Header */}
      <header className="relative grid grid-cols-12 py-15 max-xl:pb-16">
        <DashedLineV className="absolute col-[-2] max-lg:hidden" />
        <svg width="100%" height="100%" className="text-surface absolute col-[-2] max-lg:hidden">
          <defs>
            <pattern id="_S_1_" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#_S_1_)" />
        </svg>
        <h1 className="col-[2/-2] max-w-[24ch] text-balance pb-7 font-semibold text-heading-responsive-lg">{job.title}</h1>
        <p className="col-[2/-2] max-w-[48ch] text-balance pb-10 text-xl">{job.subtitle}</p>
        <div className="col-[2/-2] flex flex-col gap-2 max-lg:pb-5 lg:col-[2/6] xl:col-[2/5] xl:pr-8">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Location</h3>
          <p className="text-balance text-sm text-muted-foreground">{job.location}</p>
        </div>
        <div className="col-[2/-2] flex flex-col gap-2 lg:col-[6/12] xl:col-[5/12]">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Compensation</h3>
          <p className="text-sm text-muted-foreground">{job.compensation}</p>
        </div>
      </header>

      {/* Decorative separator */}
      <svg width="100%" height="1" className="text-border max-xl:hidden">
        <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
      </svg>
      <div className="relative grid h-12 grid-cols-12 max-xl:hidden">
        <DashedLineV className="col-4" />
        <DashedLineV className="col-[-2]" />
      </div>
      <SolidLineH />

      {/* Content area (2-column) */}
      <div className="relative grid grid-cols-12">
        {/* Vertical lines */}
        <SolidLineV className="absolute col-4 max-xl:hidden" />
        <DashedLineV className="absolute col-[-2] hidden lg:block xl:hidden" />

        {/* Left sticky sidebar (desktop only) */}
        <aside className="relative col-[1/4] bg-surface py-22 max-xl:hidden">
          <div className="sticky top-[calc(var(--site-header-height)+48px)] flex flex-col gap-4 px-9">
            <div className="mb-2">
              <h2 className="text-balance font-semibold text-lg text-secondary-foreground">{job.title}</h2>
              <p className="mt-1 text-balance text-sm text-muted-foreground">{job.subtitle}</p>
            </div>
            <div>
              <h3 className="font-semibold text-secondary-foreground">Location</h3>
              <p className="mt-1 text-balance text-sm text-muted-foreground">{job.location}</p>
            </div>
            <div>
              <h3 className="font-semibold text-secondary-foreground">Engagement Type</h3>
              <p className="mt-1 text-balance text-sm text-muted-foreground">{engagement}</p>
            </div>
            <div>
              <h3 className="font-semibold text-secondary-foreground">Compensation</h3>
              <p className="mt-1 text-sm text-muted-foreground">{job.compensation}</p>
            </div>
            <div className="mt-3">
              <Button variant="primary" size="md" href="#apply-form">
                Apply now
              </Button>
            </div>
          </div>
        </aside>

        {/* Right content area */}
        <div className="col-[5/-2] max-w-prose pt-22 pb-32 max-xl:col-[2/-2] max-xl:pt-18">
          <div className="max-w-prose font-normal">
            {Array.isArray(job.description) ? (
              <DescriptionContent blocks={job.description} />
            ) : typeof job.description === 'string' && job.description ? (
              <div
                className="prose prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            ) : null}
          </div>

          {/* Apply form */}
          <div id="apply-form" className="mt-24 w-full max-w-xl" style={{ scrollMarginTop: 'calc(var(--site-header-height) + 48px)' }}>
            <h2 className="text-heading-sm text-foreground">Apply for this position</h2>
            <div className="min-h-12 lg:rounded-3xl lg:border lg:border-border lg:px-6 lg:pt-1.5 mt-6">
              <ApplicationForm />
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
