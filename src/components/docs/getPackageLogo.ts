/**
 * Map a synced package's shortName to a public asset path. Returning
 * `undefined` triggers the letter-fallback avatar in `DocsSidebar`. Keep this
 * table in sync with the SVG/PNG files committed under
 * `public/images/apps/<shortName>.{svg,png}`.
 */
export function getPackageLogo(shortName: string): string | undefined {
  const map: Record<string, string> = {
    accounts: '/images/apps/accounts.png',
    alia: '/images/apps/alia.svg',
    allo: '/images/apps/allo.png',
    astro: '/images/apps/astro.svg',
    auth: '/images/apps/auth.svg',
    clarity: '/images/apps/clarity.png',
    inbox: '/images/apps/inbox.png',
    oxyos: '/images/apps/oxyos.png',
  }
  return map[shortName]
}
