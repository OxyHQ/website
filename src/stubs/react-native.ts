/**
 * Minimal react-native stub for web.
 * Only satisfies imports needed by @oxyhq/bloom/theme barrel export.
 * The actual color-presets.js has no RN dependency — this stub
 * prevents Vite from failing on the BloomThemeProvider imports.
 */
export const Platform = { OS: 'web' as const, select: (o: any) => o.web ?? o.default }
export function useColorScheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}
export const Appearance = { getColorScheme: () => 'light', setColorScheme: () => {} }
