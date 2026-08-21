/**
 * One piece of artwork per app, keyed by the app's route.
 *
 * The homepage "Apps that put people first" cards render it, each app's page
 * uses it as its OG image, and `scripts/prerender.ts` emits the same URL into
 * the static `<head>` — so what someone sees on the card is what a link
 * preview shows.
 */
export const APP_CARD_IMAGES: Record<string, string> = {
  '/mention': '/images/landing/mention-laptop.png',
  '/apps/allo': '/images/landing/hero-photo-02.avif',
  '/apps/faircoin': '/images/landing/faircoin-phone.png',
  '/homiio': '/images/landing/homiio-phone.png',
  '/inbox': '/images/landing/inbox-phone.png',
  '/astro': '/images/landing/astro-desktop.png',
  '/os': '/images/landing/oxyos-laptop.png',
}
