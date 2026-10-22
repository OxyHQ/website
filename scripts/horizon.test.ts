import { describe, expect, test } from 'bun:test';
import { angleDelta, axisColor, sectorRotation } from '../src/components/horizon/geometry';

describe('Horizon reference map interactions', () => {
  test('dragging across the angular seam stays continuous in both directions', () => {
    expect(angleDelta(179, -179)).toBe(2);
    expect(angleDelta(-179, 179)).toBe(-2);
    expect(angleDelta(720, 45)).toBe(45);
    expect(angleDelta(-720, -45)).toBe(-45);
  });
  test('Electricity faces right, rather than down, after selection', () => {
    expect(sectorRotation(0, 0, 47.5)).toBe(-23.75);
  });

  test('crossing the zero-degree boundary takes the short turn', () => {
    const electricity = sectorRotation(0, 0, 47.5);
    const transportation = sectorRotation(electricity, 312.5, 360);
    expect(transportation).toBe(23.75);
    expect(transportation - electricity).toBe(47.5);
    expect(sectorRotation(transportation, 0, 47.5)).toBe(-23.75);
  });

  test('each selected solution area gets its own swatch, centered on hover', () => {
    const palette = ['first', 'second', 'third'];
    expect([0, 1, 2].map((index) => axisColor(palette, index, -1))).toEqual(palette);
    expect([0, 1, 2].map((index) => axisColor(palette, index, 1))).toEqual([
      'second',
      'first',
      'second',
    ]);
  });
});
