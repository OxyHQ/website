import { describe, expect, test } from 'bun:test'
import {
  careerEmploymentLabel,
  careerJobMarkdown,
  careerJobPath,
  careerLocationLabel,
  careerSalaryLabel,
  careerSeoDescription,
  careerTeam,
  DEFAULT_CAREER_TEAM,
} from '../src/lib/careers'

describe('careers presentation', () => {
  test('a role is addressed by its Clarity id', () => {
    expect(careerJobPath({ id: 'a1b2/c3' })).toBe('/company/careers/a1b2%2Fc3')
  })

  test('the team comes from the listing category, never an invented department', () => {
    expect(careerTeam({ occupationalCategory: 'Engineering' })).toBe('Engineering')
    expect(careerTeam({ occupationalCategory: '  ' })).toBe(DEFAULT_CAREER_TEAM)
    expect(careerTeam({})).toBe(DEFAULT_CAREER_TEAM)
  })

  test('location states only what the listing states', () => {
    expect(careerLocationLabel({ locations: [], workplaceType: 'remote' })).toBe('Remote')
    expect(careerLocationLabel({
      locations: [{ raw: 'Barcelona', locality: 'Barcelona', country: 'Spain', countryCode: 'ES' }],
      workplaceType: 'hybrid',
    })).toBe('Hybrid · Barcelona, Spain')
    expect(careerLocationLabel({
      locations: [{ raw: 'London', locality: 'London', countryCode: 'GB' }],
      workplaceType: 'onsite',
    })).toBe('London, GB')
    expect(careerLocationLabel({ locations: [], workplaceType: 'onsite' })).toBe('On-site')
    expect(careerLocationLabel({ locations: [] })).toBeUndefined()
  })

  test('employment types read as words', () => {
    expect(careerEmploymentLabel({ employmentTypes: ['full_time', 'contract'] })).toBe('Full-time · Contract')
    expect(careerEmploymentLabel({ employmentTypes: [] })).toBeUndefined()
  })

  test('salary is formatted in its own currency and interval, or not at all', () => {
    expect(careerSalaryLabel({ min: 60_000, max: 80_000, currency: 'EUR', interval: 'year' })).toBe('€60K – €80K / year')
    expect(careerSalaryLabel({ min: 50, currency: 'USD', interval: 'hour' })).toBe('$50 / hour')
    expect(careerSalaryLabel({ currency: 'EUR', interval: 'year' })).toBeUndefined()
    expect(careerSalaryLabel({ min: 1, currency: 'NOPE!', interval: 'year' })).toBeUndefined()
    expect(careerSalaryLabel(undefined)).toBeUndefined()
  })

  test('the body joins the listing sections as one Markdown document', () => {
    expect(careerJobMarkdown({ description: 'About **us**', responsibilities: '- Build', qualifications: undefined }))
      .toBe('About **us**\n\n### Responsibilities\n\n- Build')
    expect(careerJobMarkdown({})).toBe('')
  })

  test('the SEO description is plain text cut on a word', () => {
    const description = `## About the role\n\nWe are hiring a [Frontend Engineer](https://mention.earth) to build **Bloom**. ${'More detail. '.repeat(20)}`
    const text = careerSeoDescription({ title: 'Frontend Engineer', description, locations: [], workplaceType: 'remote' })
    expect(text.startsWith('About the role We are hiring a Frontend Engineer to build Bloom.')).toBe(true)
    expect(text.length).toBeLessThanOrEqual(155)
    expect(text.endsWith('…')).toBe(true)
    expect(careerSeoDescription({ title: 'Designer', locations: [], workplaceType: 'remote' })).toBe('Designer at Oxy · Remote')
  })
})
