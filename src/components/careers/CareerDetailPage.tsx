import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as Skeleton from '@oxyhq/bloom/skeleton'
import Button from '../ui/Button'
import { useJob } from '../../api/hooks'
import { type DescriptionBlock } from '../../data/careers'
import SEO from '../SEO'
import StructuredData from '../StructuredData'

/* ──────────────────────────────────────────────
 * /company/careers/:slug
 *
 * Two columns: the role's identity pinned on the left while the description
 * scrolls on the right, with the same apply pair repeated at the end of the
 * text so it is never more than a screen away.
 * ──────────────────────────────────────────── */

const APPLY_EMAIL = 'careers@oxy.so'

function DescriptionContent({ blocks }: { blocks: DescriptionBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'paragraph') {
          return (
            <p key={i} className="not-first:mt-[13px] text-pretty text-muted-foreground leading-[26px]">
              {block.text}
            </p>
          )
        }
        if (block.type === 'heading') {
          return (
            <h3 key={i} className="relative not-first:mt-7 not-last:mb-3 font-medium text-lg">
              {block.text}
            </h3>
          )
        }
        return (
          <ul key={i} className="not-first:mt-1.5 list-[square] pl-3.5 marker:text-muted-foreground">
            {block.items.map((item, j) => (
              <li key={j} className="pt-1 pl-1.5 first:pt-1.5 [&:not(:has(ul,li))]:pb-1.5">
                <p className="text-pretty text-muted-foreground leading-[26px]">{item}</p>
              </li>
            ))}
          </ul>
        )
      })}
    </>
  )
}

/** Apply, plus the copy-link button and its confirmation. */
function ApplyActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="primary"
        size="md"
        href={`mailto:${APPLY_EMAIL}?subject=${encodeURIComponent(`Application: ${title}`)}`}
      >
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
  const { slug } = useParams<{ slug: string }>()
  const { data: job, isPending } = useJob(slug ?? '')

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
    return (
      <>
        <SEO
          title="Position not found"
          description="This job posting doesn't exist or may have been removed."
          canonicalPath={`/company/careers/${slug}`}
          noIndex
        />
        <div className="container py-40">
          <h1 className="text-heading-responsive-lg">Position not found.</h1>
          <p className="pt-6 text-muted-foreground">This role doesn&apos;t exist or has been filled.</p>
          <p className="pt-8">
            <Link to="/company/careers#open-positions" className="underline underline-offset-4">
              View all open positions
            </Link>
          </p>
        </div>
      </>
    )
  }

  const engagement = job.engagement ?? job.type ?? 'Full-time'

  return (
    <section className="mb-12 border-border border-b">
      <SEO
        title={`${job.title}, ${job.department}`}
        description={job.subtitle || `Join Oxy as ${job.title}. ${job.location}. ${engagement}.`}
        canonicalPath={`/company/careers/${slug}`}
      />
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'JobPosting',
          title: job.title,
          description: job.subtitle,
          datePosted: job.createdAt || new Date().toISOString(),
          employmentType:
            engagement === 'Full-time' ? 'FULL_TIME' : engagement === 'Part-time' ? 'PART_TIME' : 'CONTRACTOR',
          jobLocation: { '@type': 'Place', address: job.location },
          hiringOrganization: {
            '@type': 'Organization',
            name: 'Oxy',
            sameAs: 'https://oxy.so',
            logo: 'https://oxy.so/favicon.svg',
          },
        }}
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
              <div className="inline-block rounded-sm bg-surface px-1.5 py-0.5 text-sm">{engagement}</div>
              <h1 className="mb-10 mt-2 max-w-[450px] text-heading-responsive-md">{job.title}</h1>
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-8 sm:flex-row sm:gap-16 md:flex-col md:gap-8">
                  <div className="flex flex-col gap-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Location</p>
                    <p>{job.location}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Department</p>
                    <p>{job.department}</p>
                  </div>
                  {job.compensation && (
                    <div className="flex flex-col gap-1">
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Compensation</p>
                      <p>{job.compensation}</p>
                    </div>
                  )}
                </div>
                <ApplyActions title={job.title} />
              </div>
            </div>
          </div>

          <div className="col-span-12 border-border pb-16 md:col-span-8 md:border-l md:py-8 md:pl-16">
            <div className="max-w-prose">
              {job.subtitle && <p className="pb-6 text-pretty text-xl">{job.subtitle}</p>}
              {Array.isArray(job.description) ? (
                <DescriptionContent blocks={job.description} />
              ) : typeof job.description === 'string' && job.description ? (
                <p className="whitespace-pre-line text-pretty text-muted-foreground leading-[26px]">{job.description}</p>
              ) : null}

              <div className="mb-8 pt-10">
                <h3 className="font-medium text-lg">How to apply</h3>
                <p className="mt-3 text-pretty text-muted-foreground leading-[26px]">
                  Send your CV, a short note about why you&rsquo;d like to join Oxy, and any relevant work (GitHub,
                  portfolio, links) to{' '}
                  <a className="underline underline-offset-4" href={`mailto:${APPLY_EMAIL}`}>
                    {APPLY_EMAIL}
                  </a>
                  . We read every application.
                </p>
              </div>

              <ApplyActions title={job.title} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
