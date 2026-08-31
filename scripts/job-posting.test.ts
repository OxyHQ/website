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
  compensation: '$140K – $180K',
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
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: {
          '@type': 'QuantitativeValue',
          minValue: 140000,
          maxValue: 180000,
          unitText: 'YEAR',
        },
      },
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

  test('uses real optional expiry and complete supplied postal fields without inventing them', () => {
    const data = buildJobPostingStructuredData({
      ...remoteJob,
      location: 'Bucharest, Romania',
      validThrough: '2026-10-31',
      address: {
        streetAddress: '10 Example Street',
        addressLocality: 'Bucharest',
        addressRegion: 'Bucharest',
        postalCode: '010101',
        addressCountry: 'RO',
      },
    })

    expect(data).toMatchObject({
      validThrough: '2026-10-31T00:00:00.000Z',
      jobLocation: {
        address: {
          streetAddress: '10 Example Street',
          addressLocality: 'Bucharest',
          addressRegion: 'Bucharest',
          postalCode: '010101',
          addressCountry: 'RO',
        },
      },
    })
    expect(data).not.toHaveProperty('jobLocationType')
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
    expect(buildJobPostingStructuredData({ ...remoteJob, compensation: 'Competitive' })).not.toHaveProperty('baseSalary')
    expect(buildJobPostingStructuredData({ ...remoteJob, validThrough: 'unknown' })).not.toHaveProperty('validThrough')
  })
})
