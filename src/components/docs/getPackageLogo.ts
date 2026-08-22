/**
 * Map a synced package's shortName to a public asset path. Returning
 * `undefined` triggers the letter-fallback avatar in `DocsSidebar`. Keep this
 * table in sync with the SVG/PNG files committed under
 * `public/images/apps/<shortName>.{svg,png}`.
 */
export function getPackageLogo(shortName: string): string | undefined {
  const map: Record<string, string> = {
    accounts: '/images/apps/accounts.png',
    alia: '/images/apps/alia-mark.svg',
    allo: '/images/apps/allo.png',
    astro: '/images/apps/astro.svg',
    auth: '/images/apps/auth.svg',
    bloom: '/images/apps/bloom.png',
    clarity: '/images/apps/clarity.png',
    console: '/images/apps/console.svg',
    faircoin: '/images/apps/faircoin.svg',
    homiio: '/images/apps/homiio.png',
    inbox: '/images/apps/inbox.png',
    mention: '/images/apps/mention.png',
    oxyos: '/images/apps/oxyos.png',
    tnp: '/images/apps/tnp.png',
  }
  return map[shortName]
}
