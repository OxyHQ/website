import type { DescriptionBlock } from '../data/careers'
import { buildLocalizedSeoUrl } from './seoUrl'

export type JobDescription = string | DescriptionBlock[] | null | undefined

export interface JobPostingInput {
  _id?: string
  slug: string
  title: string
  subtitle?: string
  department?: string
  location: string
  type?: string
  engagement?: string
  description?: JobDescription
  createdAt?: string
  updatedAt?: string
}

interface JobPostingOptions {
  origin?: string
  pageUrl?: string
}

function cleanInlineMarkdown(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .trim()
}

function normalizeBlock(block: DescriptionBlock): DescriptionBlock | null {
  if (block.type === 'list') {
    const items = block.items.map(cleanInlineMarkdown).filter(Boolean)
    return items.length > 0 ? { type: 'list', items } : null
  }
  const text = cleanInlineMarkdown(block.text)
  return text ? { type: block.type, text } : null
}

/** Convert legacy Markdown-ish strings and current block arrays to one shape. */
export function normalizeJobDescription(description: JobDescription): DescriptionBlock[] {
  if (Array.isArray(description)) {
    return description.map(normalizeBlock).filter((block): block is DescriptionBlock => block !== null)
  }
  if (typeof description !== 'string' || !description.trim()) return []

  const blocks: DescriptionBlock[] = []
  let paragraph: string[] = []
  let items: string[] = []

  const flushParagraph = () => {
    const text = cleanInlineMarkdown(paragraph.join(' '))
    if (text) blocks.push({ type: 'paragraph', text })
    paragraph = []
  }
  const flushList = () => {
    const normalizedItems = items.map(cleanInlineMarkdown).filter(Boolean)
    if (normalizedItems.length > 0) blocks.push({ type: 'list', items: normalizedItems })
    items = []
  }

  for (const rawLine of description.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trim()
    if (!line) {
      flushParagraph()
      flushList()
      continue
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/)?.[1] ?? line.match(/^\*\*(.+)\*\*$/)?.[1]
    if (heading) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'heading', text: cleanInlineMarkdown(heading) })
      continue
    }

    const listItem = line.match(/^[-*]\s+(.+)$/)?.[1]
    if (listItem) {
      flushParagraph()
      items.push(listItem)
      continue
    }

    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()
  return blocks
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/** Google Job Search recognizes paragraph and list markup in descriptions. */
export function jobDescriptionToHtml(description: JobDescription): string {
  return normalizeJobDescription(description)
    .map((block) => {
      if (block.type === 'list') {
        return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      }
      return `<p>${escapeHtml(block.text)}</p>`
    })
    .join('')
}

/** Markdown passed to the prerender's own ArticleMarkdown renderer. */
export function jobDescriptionToMarkdown(description: JobDescription): string {
  if (typeof description === 'string') return description.trim()
  return normalizeJobDescription(description)
    .map((block) => {
      if (block.type === 'heading') return `### ${block.text}`
      if (block.type === 'list') return block.items.map((item) => `- ${item}`).join('\n')
      return block.text
    })
    .join('\n\n')
}

export function jobSeoDescription(job: JobPostingInput): string {
  const subtitle = job.subtitle?.trim()
  if (subtitle) return subtitle
  const firstParagraph = normalizeJobDescription(job.description).find((block) => block.type === 'paragraph')
  const source = firstParagraph?.type === 'paragraph'
    ? firstParagraph.text
    : `Join Oxy as ${job.title}. ${job.location}. ${job.engagement ?? job.type ?? 'Full-time'}.`
  if (source.length <= 158) return source
  const clipped = source.slice(0, 157)
  const boundary = clipped.lastIndexOf(' ')
  return `${clipped.slice(0, boundary > 120 ? boundary : 157)}…`
}

function employmentType(value: string | undefined): string {
  const normalized = (value ?? '').trim().toLowerCase()
  if (normalized === 'full-time' || normalized === 'full time') return 'FULL_TIME'
  if (normalized === 'part-time' || normalized === 'part time') return 'PART_TIME'
  if (normalized === 'contract' || normalized === 'contractor') return 'CONTRACTOR'
  if (normalized === 'temporary') return 'TEMPORARY'
  if (normalized === 'intern' || normalized === 'internship') return 'INTERN'
  if (normalized === 'volunteer') return 'VOLUNTEER'
  if (normalized === 'per diem') return 'PER_DIEM'
  return 'OTHER'
}

function locationData(location: string): Record<string, unknown> | null {
  const normalized = location.trim().toLowerCase()
  const remote = normalized === 'remote' || normalized.startsWith('remote ')
  const warsaw = normalized === 'warsaw' || normalized.includes('warsaw,')
  const address = remote
    ? { '@type': 'PostalAddress', addressLocality: 'Barcelona', addressCountry: 'ES' }
    : warsaw
      ? { '@type': 'PostalAddress', addressLocality: 'Warsaw', addressCountry: 'PL' }
      : null

  // A locality without a country is not enough for Google's JobPosting
  // requirements. Keep the page indexable, but suppress its rich-result
  // markup until that location has an explicit mapping.
  if (!address) return null

  return {
    ...(remote ? { jobLocationType: 'TELECOMMUTE' } : {}),
    jobLocation: { '@type': 'Place', address },
  }
}

function normalizeDate(value: string | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/**
 * Build valid, stable JobPosting JSON-LD from the same row the page renders.
 * Missing required source fields suppress markup instead of emitting an item
 * Search Console will correctly reject.
 */
export function buildJobPostingStructuredData(
  job: JobPostingInput,
  options: JobPostingOptions = {},
): Record<string, unknown> | null {
  const origin = (options.origin ?? 'https://oxy.so').replace(/\/+$/, '')
  const description = jobDescriptionToHtml(job.description)
  const datePosted = normalizeDate(job.createdAt)
  const location = locationData(job.location)
  if (!job.slug || !job.title.trim() || !description || !datePosted || !location) return null

  const pageUrl = options.pageUrl
    ?? buildLocalizedSeoUrl(origin, `/company/careers/${job.slug}`, 'en', 'en')

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    '@id': `${pageUrl}#job`,
    url: pageUrl,
    title: job.title,
    description,
    identifier: {
      '@type': 'PropertyValue',
      name: 'Oxy',
      value: job._id ?? job.slug,
    },
    datePosted,
    employmentType: employmentType(job.engagement ?? job.type),
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Oxy',
      sameAs: `${origin}/`,
      logo: `${origin}/favicon.svg`,
    },
    ...location,
  }
}

export function jobLocationLabel(location: string): string {
  const normalized = location.trim().toLowerCase()
  if (normalized === 'remote' || normalized.startsWith('remote ')) {
    return 'Remote · Company base: Barcelona, Spain'
  }
  if (normalized === 'warsaw' || normalized.includes('warsaw,')) return 'Warsaw, Poland'
  return location
}
