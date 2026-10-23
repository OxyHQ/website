import { expect, test } from 'bun:test';
import { normalizeColor } from './theme-test-color';

test('compares minified alpha hex with the original Bloom RGBA at 8-bit precision', () => {
  expect(normalizeColor('#668aff21')).toBe(normalizeColor('rgba(102, 138, 255, 0.13)'));
  expect(normalizeColor('#668aff21')).toBe(normalizeColor('rgb(102 138 255 / 13%)'));
  expect(normalizeColor('#1234')).toBe(normalizeColor('rgba(17, 34, 51, 0.266667)'));
});

test('compares opaque and transparent CSS serializations without losing channel differences', () => {
  expect(normalizeColor('#ABC')).toBe(normalizeColor('rgb(170 187 204)'));
  expect(normalizeColor('#aabbccff')).toBe(normalizeColor('rgba(170, 187, 204, 1)'));
  expect(normalizeColor('transparent')).toBe(normalizeColor('#0000'));
  expect(normalizeColor('#668aff21')).not.toBe(normalizeColor('#668aff22'));
  expect(normalizeColor('#668aff21')).not.toBe(normalizeColor('#678aff21'));
  expect(normalizeColor('')).not.toBe(normalizeColor('transparent'));
  expect(normalizeColor('var(--missing)')).not.toBe(normalizeColor(''));
});
