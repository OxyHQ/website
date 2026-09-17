import { ClarityClient, ClarityError, type JobPosting } from '@clarity.surf/sdk'
import { config } from '../config.js'
import { oxyService } from './oxyService.js'

/**
 * The careers page reads Oxy's open roles from Clarity Jobs. Mention is where
 * they are written, Clarity is where they are indexed, and this site keeps no
 * copy: no table, no admin, no translation overlay.
 */

/** The fields the careers pages render. Everything else Clarity returns stays behind. */
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

/**
 * Every careers view spends Clarity search quota, so the list is shared across
 * requests for this long. An opening published in Mention shows up within it.
 */
const CACHE_TTL_MS = 5 * 60_000
const PAGE_SIZE = 50
/** A hard stop so a cursor that never ends cannot loop the process. */
const MAX_PAGES = 10

let client: ClarityClient | undefined
let cached: { jobs: CareerJob[]; expiresAt: number } | undefined
let inflight: Promise<CareerJob[]> | undefined

function clarity(): ClarityClient {
  client ??= new ClarityClient({
    baseUrl: config.clarity.apiUrl,
    getAccessToken: () => oxyService.getServiceToken(),
  })
  return client
}

function toCareerJob(job: JobPosting): CareerJob {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    responsibilities: job.responsibilities,
    qualifications: job.qualifications,
    skills: job.skills,
    employer: job.employer,
    locations: job.locations,
    workplaceType: job.workplaceType,
    employmentTypes: job.employmentTypes,
    salary: job.salary,
    occupationalCategory: job.occupationalCategory,
    canonicalUrl: job.canonicalUrl,
    applyUrl: job.applyUrl,
    publishedAt: job.publishedAt,
    validThrough: job.validThrough,
  }
}

function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`)
}

/** The same two constraints the search applies, for a listing fetched by id. */
function isOxyOpening(job: JobPosting): boolean {
  const { careersEmployer, careersSourceDomains } = config.clarity
  if (job.status !== 'active') return false
  if (job.employer.name.toLowerCase() !== careersEmployer.toLowerCase()) return false
  const host = job.source.domain.toLowerCase()
  return careersSourceDomains.some((domain) => hostMatches(host, domain.toLowerCase()))
}

async function fetchOpenings(): Promise<CareerJob[]> {
  const jobs: CareerJob[] = []
  let cursor: string | undefined
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await clarity().jobs.search({
      employers: [config.clarity.careersEmployer],
      sourceDomains: config.clarity.careersSourceDomains,
      limit: PAGE_SIZE,
      cursor,
    })
    jobs.push(...response.data.filter(isOxyOpening).map(toCareerJob))
    cursor = response.nextCursor
    if (!cursor) break
  }
  return jobs
}

/**
 * Oxy's open roles, in Clarity's order. When Clarity is unreachable a list that
 * has already expired is served rather than an error: an opening that closed a
 * few minutes ago is a smaller problem than a careers page with no roles.
 */
export async function listCareerJobs(): Promise<CareerJob[]> {
  if (cached && cached.expiresAt > Date.now()) return cached.jobs
  inflight ??= fetchOpenings()
    .then((jobs) => {
      cached = { jobs, expiresAt: Date.now() + CACHE_TTL_MS }
      return jobs
    })
    .catch((error: unknown) => {
      if (cached) return cached.jobs
      throw error
    })
    .finally(() => {
      inflight = undefined
    })
  return inflight
}

/** One open role, or null when it is not an active Oxy opening. */
export async function getCareerJob(id: string): Promise<CareerJob | null> {
  const listed = cached?.jobs.find((job) => job.id === id)
  if (listed && cached && cached.expiresAt > Date.now()) return listed
  try {
    const job = await clarity().jobs.get(id)
    return isOxyOpening(job) ? toCareerJob(job) : null
  } catch (error) {
    if (error instanceof ClarityError && error.status === 404) return null
    throw error
  }
}
