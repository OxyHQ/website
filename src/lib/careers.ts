import type { JobEmploymentType, JobPosting, JobSalary } from '@clarity.surf/sdk'

/**
 * Oxy's open roles as `/api/jobs` serves them: Clarity Jobs listings, written in
 * Mention. Mirrors `CareerJob` in `server/services/careers.ts`, which picks the
 * same fields from the same SDK type.
 */
export type CareerJob = Pick<
  JobPosting,
  | 'id'
  | 'title'
  | 'description'
  | 'responsibilities'
  | 'qualifications'
  | 'skills'
  | 'employer'
  | 'locations'
  | 'workplaceType'
  | 'employmentTypes'
  | 'salary'
  | 'occupationalCategory'
  | 'canonicalUrl'
  | 'applyUrl'
  | 'publishedAt'
  | 'validThrough'
>

/** The group a role is listed under when its listing names no category. */
export const DEFAULT_CAREER_TEAM = 'Open roles'

export function careerJobPath(job: Pick<CareerJob, 'id'>): string {
  return `/company/careers/${encodeURIComponent(job.id)}`
}

export function careerTeam(job: Pick<CareerJob, 'occupationalCategory'>): string {
  return job.occupationalCategory?.trim() || DEFAULT_CAREER_TEAM
}

const WORKPLACE_LABELS: Record<NonNullable<CareerJob['workplaceType']>, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
}

/**
 * "Remote", "Hybrid · Barcelona, Spain", "London, United Kingdom". Absent when
 * the listing states neither a place nor a workplace type.
 */
export function careerLocationLabel(job: Pick<CareerJob, 'locations' | 'workplaceType'>): string | undefined {
  const places = job.locations
    .map((location) => [location.locality, location.country ?? location.countryCode].filter(Boolean).join(', ') || location.raw)
    .filter(Boolean)
  // An on-site role says so by naming its place; the label adds nothing there.
  const workplace = job.workplaceType && (job.workplaceType !== 'onsite' || places.length === 0)
    ? WORKPLACE_LABELS[job.workplaceType]
    : undefined
  return [workplace, ...places].filter(Boolean).join(' · ') || undefined
}

const EMPLOYMENT_LABELS: Record<JobEmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  temporary: 'Temporary',
  internship: 'Internship',
  volunteer: 'Volunteer',
  per_diem: 'Per diem',
  other: 'Other',
}

export function careerEmploymentLabel(job: Pick<CareerJob, 'employmentTypes'>): string | undefined {
  const labels = job.employmentTypes.map((type) => EMPLOYMENT_LABELS[type])
  return labels.length > 0 ? labels.join(' · ') : undefined
}

const INTERVAL_LABELS: Record<JobSalary['interval'], string> = {
  hour: 'hour',
  day: 'day',
  week: 'week',
  month: 'month',
  year: 'year',
}

/** "€60K – €80K / year". Absent when the listing states no salary. */
export function careerSalaryLabel(salary: JobSalary | undefined, locale = 'en'): string | undefined {
  if (!salary || (salary.min === undefined && salary.max === undefined)) return undefined
  let format: Intl.NumberFormat
  try {
    format = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: salary.currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    })
  } catch {
    // A currency the runtime cannot format is not one worth showing a figure in.
    return undefined
  }
  const amounts = [salary.min, salary.max]
    .filter((amount): amount is number => amount !== undefined)
    .map((amount) => format.format(amount))
  return `${[...new Set(amounts)].join(' – ')} / ${INTERVAL_LABELS[salary.interval]}`
}

/** The host a role is published on, which is where applications go. */
export function careerSourceHost(job: Pick<CareerJob, 'canonicalUrl'>): string {
  try {
    return new URL(job.canonicalUrl).hostname.replace(/^www\./, '')
  } catch {
    return job.canonicalUrl
  }
}

/**
 * The listing body as one Markdown document: description, then the
 * responsibilities and qualifications Clarity extracts as their own fields.
 */
export function careerJobMarkdown(job: Pick<CareerJob, 'description' | 'responsibilities' | 'qualifications'>): string {
  return [
    job.description,
    job.responsibilities && `### Responsibilities\n\n${job.responsibilities}`,
    job.qualifications && `### Qualifications\n\n${job.qualifications}`,
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(?:#{1,6}|[-*+]|\d+[.)]|>)\s+/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const SEO_DESCRIPTION_LENGTH = 155

export function careerSeoDescription(job: Pick<CareerJob, 'title' | 'description' | 'locations' | 'workplaceType'>): string {
  const text = job.description ? markdownToPlainText(job.description) : ''
  if (!text) return [`${job.title} at Oxy`, careerLocationLabel(job)].filter(Boolean).join(' · ')
  if (text.length <= SEO_DESCRIPTION_LENGTH) return text
  const cut = text.slice(0, SEO_DESCRIPTION_LENGTH - 1)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length)}…`
}
