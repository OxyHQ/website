/** Canonical public marks shared by docs, help and the brand guide. */
export const BRAND_MARKS: Readonly<Record<string, string>> = {
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

export function getBrandMark(id: string): string | undefined {
  return BRAND_MARKS[id]
}
