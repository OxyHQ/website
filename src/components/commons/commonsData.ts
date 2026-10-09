/** Product copy checked against oxy/packages/commons: ID, approvals, reputation and settings. */
export const COMMONS_APPS = [
  { name: 'Mention', image: '/images/apps/mention.png' },
  { name: 'Allo', image: '/images/apps/allo.png' },
  { name: 'Inbox', image: '/images/apps/inbox.png' },
  { name: 'Alia', image: '/images/apps/alia.svg' },
  { name: 'Accounts', image: '/images/apps/accounts.png' },
  { name: 'Astro', image: '/images/apps/astro.svg' },
  { name: 'OxyOS', image: '/images/apps/oxyos.png' },
  { name: 'Peable', image: '/images/apps/peable.png' },
  { name: 'Moovo', image: '/images/apps/moovo.png' },
  { name: 'GoWay', image: '/images/apps/goway.svg' },
] as const

// Real app captures: Mention and Mercaria supplied by the user; Alia and Homiio
// captured from their public web apps. Keep screenshots separate from app marks.
export const COMMONS_APP_PREVIEWS = [
  { name: 'Mention', image: '/images/commons/apps/mention.webp' },
  { name: 'Mercaria', image: '/images/commons/apps/mercaria.webp' },
  { name: 'Alia', image: '/images/commons/apps/alia.webp' },
  { name: 'Homiio', image: '/images/commons/apps/homiio.webp' },
] as const

// Rotating hero prompts link to the corresponding Commons feature.
export const COMMONS_PROMPTS = [
  { prompt: 'An identity that stays yours', target: '#commons-identity' },
  { prompt: 'Your connections. Your identity.', target: '#commons-apps' },
  { prompt: 'One identity for all your apps', target: '#commons-apps' },
  { prompt: 'Sign in without a password', target: '#commons-sign-in' },
  { prompt: 'Take your identity with you', target: '#commons-identity' },
  { prompt: 'Your keys stay in your hands', target: '#commons-security' },
] as const
