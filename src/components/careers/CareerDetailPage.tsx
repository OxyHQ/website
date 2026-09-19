import { useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from '../../lib/navigation'
import * as Skeleton from '@oxy.so/bloom/skeleton'
import Button from '../ui/Button'
import { useJob } from '../../api/hooks'
import { errorStatus } from '../../api/client'
import SEO from '../SEO'
import { AnimatedTitle } from '../ui/AnimatedTitle'
import { useLocaleContext } from '../../lib/i18n'
import {
  careerEmploymentLabel,
  careerJobMarkdown,
  careerJobPath,
  careerLocationLabel,
  careerSalaryLabel,
  careerSeoDescription,
  careerSourceHost,
  careerTeam,
} from '../../lib/careers'

/* ──────────────────────────────────────────────
 * /company/careers/:id
 *
 * One of Oxy's open roles, read from Clarity Jobs. The role is written and
 * applied to in Mention, so the canonical URL and the apply button both point
 * there; this page is the same listing in the site's own frame.
 *
 * Two columns: the role's identity pinned on the left while the description
 * scrolls on the right, with the same apply pair repeated at the end of the
 * text so it is never more than a screen away.
 * ──────────────────────────────────────────── */

function SectionHeading({ children }: { children?: ReactNode }) {
  return <h3 className="relative not-first:mt-7 not-last:mb-3 font-medium text-lg">{children}</h3>
}

/**
 * Clarity serves listing text as Markdown with no raw HTML, and react-markdown
 * renders none either, so nothing in a listing reaches the DOM as markup.
 */
function JobDescription({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="not-first:mt-[13px] text-pretty text-muted-foreground leading-[26px]">{children}</p>
        ),
        // The page's h1 is the role title, so a listing's own headings start below it.
        h1: SectionHeading,
        h2: SectionHeading,
        h3: SectionHeading,
        h4: ({ children }) => <h4 className="relative not-first:mt-5 not-last:mb-2 font-medium">{children}</h4>,
        ul: ({ children }) => (
          <ul className="not-first:mt-1.5 list-[square] pl-3.5 marker:text-muted-foreground">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="not-first:mt-1.5 list-decimal pl-5 marker:text-muted-foreground">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="pt-1 pl-1.5 text-pretty text-muted-foreground leading-[26px] first:pt-1.5">{children}</li>
        ),
        strong: ({ children }) => <strong className="font-medium text-foreground">{children}</strong>,
        a: ({ href, children }) => (
          <a className="underline underline-offset-4" href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground text-xs uppercase tracking-wider">{label}</p>
      <p>{value}</p>
    </div>
  )
}

/** Apply where the role is published, plus the copy-link button and its confirmation. */
function ApplyActions({ href }: { href: string }) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-2">
      <Button variant="primary" size="md" href={href} target="_blank" rel="noopener noreferrer">
        Apply now
      </Button>
      <div className="relative">
        <button
          type="button"
          onClick={copyLink}
          aria-label="Copy link to this role"
          className="inline-flex size-12 items-center justify-center rounded-sm bg-surface text-foreground transition-colors duration-200 hover:bg-border"
        >
          <svg viewBox="0 0 20 20" fill="none" className="size-5 shrink-0">
            <path
              d="m9 6 2.5-2.5a3.536 3.536 0 0 1 5 5L14 11M6 9l-2.5 2.5a3.536 3.536 0 1 0 5 5L11 14"
              stroke="currentColor"
              strokeLinecap="square"
              strokeLinejoin="round"
            />
            <path d="m8 12 4-4" stroke="currentColor" />
          </svg>
        </button>
        <div
          className={`absolute left-full top-3 ml-2 w-28 transition-all duration-150 ${
            copied ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
          }`}
        >
          <div className="flex items-center gap-1 whitespace-nowrap rounded-sm bg-foreground px-2 py-1 text-background text-sm">
            <svg viewBox="0 0 20 20" fill="none" className="size-4 shrink-0">
              <path d="M18 4 7 16l-5-5" stroke="currentColor" />
            </svg>
            Copied link
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CareerDetailContent() {
  const { id = '' } = useParams<{ id: string }>()
  const { locale } = useLocaleContext()
  const { data: job, isPending, error } = useJob(id)

  if (isPending) {
    return (
      <div className="container py-40">
        <div className="max-w-2xl space-y-6">
          <Skeleton.Box width={192} height={32} />
          <Skeleton.Box width="100%" height={48} />
          <Skeleton.Box width={256} height={24} />
          <div className="mt-10 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton.Box key={i} width="100%" height={16} borderRadius={4} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    const unavailable = error !== null && errorStatus(error) !== 404
    return (
      <>
        <SEO
          title={unavailable ? 'Open roles unavailable' : 'Position not found'}
          description={unavailable
            ? 'Open roles could not be loaded right now.'
            : "This job posting doesn't exist or may have been removed."}
          canonicalPath={careerJobPath({ id })}
          noIndex
        />
        <div className="container py-40">
          <AnimatedTitle as="h1" className="text-heading-responsive-lg">
            {unavailable ? 'Open roles are unavailable.' : 'Position not found.'}
          </AnimatedTitle>
          <p className="pt-6 text-muted-foreground">
            {unavailable ? 'Please try again in a few minutes.' : 'This role doesn’t exist or has been filled.'}
          </p>
          <p className="pt-8">
            <Link to="/company/careers#open-positions" className="underline underline-offset-4">
              View all open positions
            </Link>
          </p>
        </div>
      </>
    )
  }

  const team = careerTeam(job)
  const employment = careerEmploymentLabel(job)
  const location = careerLocationLabel(job)
  const salary = careerSalaryLabel(job.salary, locale)
  const sourceHost = careerSourceHost(job)
  const applyHref = job.applyUrl ?? job.canonicalUrl
  const markdown = careerJobMarkdown(job)

  return (
    <section className="mb-12 border-border border-b">
      <SEO
        title={`${job.title}, ${team}`}
        description={careerSeoDescription(job)}
        canonicalPath={careerJobPath(job)}
        canonicalUrl={job.canonicalUrl}
        publishedTime={job.publishedAt}
      />

      <div className="container">
        <div className="grid grid-cols-12 md:gap-8">
          <div className="relative col-span-12 py-8 md:col-span-4">
            <div className="sticky top-[calc(var(--site-header-height)+2rem)]">
              <div className="mb-8 md:mb-16">
                <Link className="flex items-center gap-2" to="/company/careers#open-positions">
                  <span className="size-2.5 rounded-full bg-current" />
                  Careers
                </Link>
              </div>
              {employment && <div className="inline-block rounded-sm bg-surface px-1.5 py-0.5 text-sm">{employment}</div>}
              <AnimatedTitle as="h1" className="mb-10 mt-2 max-w-[450px] text-heading-responsive-md">{job.title}</AnimatedTitle>
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-8 sm:flex-row sm:gap-16 md:flex-col md:gap-8">
                  {location && <Fact label="Location" value={location} />}
                  <Fact label="Team" value={team} />
                  {salary && <Fact label="Compensation" value={salary} />}
                </div>
                <ApplyActions href={applyHref} />
              </div>
            </div>
          </div>

          <div className="col-span-12 border-border pb-16 md:col-span-8 md:border-l md:py-8 md:pl-16">
            <div className="max-w-prose">
              {markdown && <JobDescription markdown={markdown} />}

              {job.skills.length > 0 && (
                <div className="pt-10">
                  <h3 className="font-medium text-lg">Skills</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <li key={skill} className="rounded-sm bg-surface px-2 py-1 text-sm">{skill}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-8 pt-10">
                <h3 className="font-medium text-lg">How to apply</h3>
                <p className="mt-3 text-pretty text-muted-foreground leading-[26px]">
                  Applications for this role are handled on{' '}
                  <a className="underline underline-offset-4" href={applyHref} target="_blank" rel="noopener noreferrer">
                    {sourceHost}
                  </a>
                  , where the listing is published. We read every application.
                </p>
              </div>

              <ApplyActions href={applyHref} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
