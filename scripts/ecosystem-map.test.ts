import { describe, expect, test } from 'bun:test';
import { ecosystemMap, ecosystemDomains, ecosystemAreas } from '../src/data/ecosystem/map';
import { sectorRotation } from '../src/components/horizon/geometry';

describe('Oxy ecosystem wheel', () => {
  test('eight contiguous sectors fill one turn and rotate to the reading position', () => {
    expect(ecosystemMap.categories).toHaveLength(8);
    let end = 0;
    for (const category of ecosystemMap.categories) {
      expect(category.categoryStartAngleDegree).toBe(end);
      end = category.categoryEndAngleDegree;
      const midpoint = (category.categoryStartAngleDegree + end) / 2;
      const rotation = sectorRotation(0, category.categoryStartAngleDegree, end);
      expect((midpoint + rotation) % 360).toBe(0);
      expect(Math.abs(rotation)).toBeLessThanOrEqual(180);
    }
    expect(end).toBe(360);
  });

  test('each area fills its own sector without gaps, overlap or orphaned targets', () => {
    expect(new Set(ecosystemAreas.map((area) => area.id)).size).toBe(ecosystemAreas.length);
    for (const category of ecosystemMap.categories) {
      const axes = ecosystemMap.axes.filter((axis) => axis.categoryId === category.categoryId);
      let end = category.categoryArcStartAngleDegree;
      for (const axis of axes) {
        expect(axis.axisStartAngleDegree).toBeCloseTo(end);
        end = axis.axisEndAngleDegree;
        expect(axis.axisAngleDegree).toBeGreaterThan(axis.axisStartAngleDegree);
        expect(axis.axisAngleDegree).toBeLessThan(axis.axisEndAngleDegree);
        expect(ecosystemAreas.some((area) => area.id === axis.axisId)).toBe(true);
      }
      expect(end).toBeCloseTo(category.categoryArcEndAngleDegree);
      expect(category.categoryColorPalette).toHaveLength(axes.length);
    }
  });

  test('life areas lead to human activities, with products nested one level below', () => {
    expect(ecosystemDomains.map((domain) => domain.id)).toEqual([
      'health',
      'education',
      'housing',
      'food',
      'mobility',
      'culture',
      'economy',
      'governance',
    ]);
    expect(ecosystemDomains.find((domain) => domain.id === 'housing')?.areas[0].name).toBe(
      'Find a home',
    );
    expect(
      ecosystemAreas
        .find((area) => area.id === 'learn')
        ?.projects.some((project) => project.href === '/academy/'),
    ).toBe(true);
    const horizon = ecosystemAreas
      .flatMap((area) => area.projects)
      .find((project) => project.name === 'Horizon');
    expect(horizon).toBeDefined();
    expect(horizon?.href).toBeUndefined();
    for (const area of ecosystemAreas) {
      expect(area.detail.length).toBeGreaterThan(0);
      for (const project of area.projects) {
        if (project.href?.startsWith('/')) expect(project.href.endsWith('/')).toBe(true);
      }
    }
  });
});
