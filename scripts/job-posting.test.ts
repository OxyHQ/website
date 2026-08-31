import { describe, expect, test } from 'bun:test'
import {
  buildJobPostingStructuredData,
  jobDescriptionToHtml,
  jobSeoDescription,
  normalizeJobDescription,
} from '../src/lib/jobPosting'

const remoteJob = {
  _id: '68b2f83e2c5928752fbe5e15',
  slug: 'search-engineer',
  title: 'Search Engineer',
  department: 'Engineering',
  location: 'Remote',
  engagement: 'Full-time',
  createdAt: '2026-08-29T10:00:00.000Z',
  description: [
    { type: 'paragraph' as const, text: 'Improve discovery across the open web.' },
    { type: 'heading' as const, text: 'What you will do' },
    { type: 'list' as const, items: ['Own technical SEO', 'Measure index coverage'] },
  ],
}

describe('JobPosting structured data', () => {
  test('includes a full required description and stable remote-location fields', () => {
    const data = buildJobPostingStructuredData(remoteJob)

    expect(data).toMatchObject({
      '@type': 'JobPosting',
      '@id': 'https://oxy.so/company/careers/search-engineer/#job',
      url: 'https://oxy.so/company/careers/search-engineer/',
      title: remoteJob.title,
      datePosted: remoteJob.createdAt,
      employmentType: 'FULL_TIME',
      jobLocationType: 'TELECOMMUTE',
      jobLocation: {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressLocality: 'Barcelona', addressCountry: 'ES' },
      },
    })
    expect(data?.description).toBe(
      '<p>Improve discovery across the open web.</p><p>What you will do</p><ul><li>Own technical SEO</li><li>Measure index coverage</li></ul>',
    )
  })

  test('normalizes live legacy text, escapes HTML and derives useful meta copy', () => {
    const description = 'Help Oxy ship safe search.\n\n**Responsibilities**\n- Audit <canonical> tags\n- Prevent script injection'
    const blocks = normalizeJobDescription(description)

    expect(blocks).toHaveLength(3)
    expect(jobDescriptionToHtml(description)).toContain('&lt;canonical&gt;')
    expect(jobDescriptionToHtml(description)).not.toContain('<canonical>')
    expect(jobSeoDescription({ ...remoteJob, description })).toBe('Help Oxy ship safe search.')
  })

  test('suppresses invalid markup rather than fabricating required source fields', () => {
    expect(buildJobPostingStructuredData({ ...remoteJob, description: '' })).toBeNull()
    expect(buildJobPostingStructuredData({ ...remoteJob, createdAt: undefined })).toBeNull()
    expect(buildJobPostingStructuredData({ ...remoteJob, location: 'Somewhere' })).toBeNull()
  })
})
