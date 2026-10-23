import { describe, expect, test } from 'bun:test';
import { marketingCanvasClass } from '../src/lib/marketingCanvas';

describe('marketing opening surfaces', () => {
  test('keeps FairCoin white on both host route trees and locale mirrors', () => {
    for (const path of ['/faircoin', '/faircoin/', '/es/faircoin/wallet/', '/ca/faircoin/']) {
      expect(marketingCanvasClass(path)).toBe('faircoin-editorial bg-card');
    }
    expect(marketingCanvasClass('/', true)).toBe('faircoin-editorial bg-card');
    expect(marketingCanvasClass('/wallet/', true)).toBe('faircoin-editorial bg-card');
  });
  test('isolates Horizon without recolouring the Oxy home or unrelated routes', () => {
    expect(marketingCanvasClass('/horizon/')).toBe('oxy-ecosystem bg-background');
    for (const path of [
      '/',
      '/old/',
      '/wallet/',
      '/faircoin/buy/',
      '/horizon/missing/',
      '/xx/faircoin/',
    ]) {
      expect(marketingCanvasClass(path)).toBe('');
    }
  });
});
