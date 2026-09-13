import { describe, expect, test } from 'bun:test'
import { solarDirection } from '../src/data/dashboard/solar-position'

describe('Earth illumination in UTC', () => {
  test('noon and midnight light opposite sides at the equinox', () => {
    const noon = solarDirection(Date.parse('2026-03-20T12:00:00Z'))
    const midnight = solarDirection(Date.parse('2026-03-20T00:00:00Z'))
    expect(noon[2]).toBeGreaterThan(0.99)
    expect(midnight[2]).toBeLessThan(-0.99)
    expect(Math.abs(noon[1])).toBeLessThan(0.02)
  })
  test('morning lights eastern longitudes and evening western longitudes', () => {
    expect(solarDirection(Date.parse('2026-03-20T06:00:00Z'))[0]).toBeGreaterThan(0.99)
    expect(solarDirection(Date.parse('2026-03-20T18:00:00Z'))[0]).toBeLessThan(-0.99)
  })
  test('seasonal tilt favours the correct pole', () => {
    expect(solarDirection(Date.parse('2026-06-21T12:00:00Z'))[1]).toBeCloseTo(Math.sin(23.44 * Math.PI / 180), 2)
    expect(solarDirection(Date.parse('2026-12-21T12:00:00Z'))[1]).toBeCloseTo(-Math.sin(23.44 * Math.PI / 180), 2)
  })
  test('leap day and UTC midnight keep a continuous unit direction', () => {
    const before = solarDirection(Date.parse('2028-02-29T23:59:59Z'))
    const after = solarDirection(Date.parse('2028-03-01T00:00:00Z'))
    expect(Math.hypot(...before)).toBeCloseTo(1, 12)
    expect(Math.hypot(...after)).toBeCloseTo(1, 12)
    expect(Math.hypot(...after.map((value, i) => value - before[i]))).toBeLessThan(0.0001)
  })
})
