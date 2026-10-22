export type SymbolType = 'imperative' | 'moonshot' | 'tech-cluster';

// The three original SVG paths, kept as vectors at every zoom level.
export const SYMBOL_PATHS: Record<SymbolType, string> = {
  imperative: 'M -9 -1 H 9 V 1 H -9 Z M 0 -6 A 6 6 0 1 1 0 6 A 6 6 0 1 1 0 -6 Z',
  moonshot: 'M 0 -6 A 6 6 0 0 1 0 6 L 0 0 Z M 0 -6 A 6 6 0 0 0 0 6 L 0 5 A 5 5 0 0 1 0 -5 Z',
  'tech-cluster':
    'M 0 -6 A 6 6 0 1 1 0 6 A 6 6 0 1 1 0 -6 M 0 -5 A 5 5 0 1 0 0 5 A 5 5 0 1 0 0 -5 Z',
};
