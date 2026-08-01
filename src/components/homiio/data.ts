import teresaPamies from '../../assets/homiio/teresa-pamies.jpg'
import torrentOlla from '../../assets/homiio/torrent-olla.jpg'
import santAntoni from '../../assets/homiio/sant-antoni.jpg'
import manso from '../../assets/homiio/manso.jpeg'
import rogerLluria from '../../assets/homiio/roger-lluria.jpg'
import gaudi from '../../assets/homiio/gaudi.jpg'
import industria from '../../assets/homiio/industria.jpg'
import sandra from '../../assets/homiio/sandra.jpg'
import { useHomiioListings, type HomiioListing as ApiHomiioListing } from '../../api/hooks'

/**
 * Shown while the live listings load, and if Homiio's API is unreachable. Same
 * shape as the real ones so the card never has to know which it is holding.
 */
export type HomiioListing = ApiHomiioListing

export const SANDRA_IMAGE = sandra

/** A placeholder card: a local photo and a price, with the rest left empty. */
function fallback(id: string, title: string, monthlyAmount: number, imageUrl: string): HomiioListing {
  return {
    id,
    title,
    city: 'Barcelona',
    monthlyAmount,
    currency: 'EUR',
    bedrooms: null,
    squareFootage: null,
    imageUrl,
    href: 'https://homiio.com',
  }
}

/** The deck the hero falls back to before the live listings arrive. */
export const HOMIIO_LISTINGS: readonly HomiioListing[] = [
  fallback('teresa-pamies', 'Apartment in Barcelona', 482, teresaPamies),
  fallback('torrent-olla', 'Apartment in Barcelona', 1385, torrentOlla),
  fallback('sant-antoni', 'Apartment in Sant Antoni', 440, santAntoni),
  fallback('manso', 'Apartment in Barcelona', 219, manso),
  fallback('roger-lluria', 'Room in Barcelona', 220, rogerLluria),
  fallback('gaudi', 'Penthouse in Barcelona', 600, gaudi),
  fallback('industria', 'Apartment in Barcelona', 550, industria),
]

export interface HomiioFaq {
  question: string
  answer: string
}

export const HOMIIO_FAQS: readonly HomiioFaq[] = [
  {
    question: 'What makes Homiio different from other housing sites?',
    answer:
      'Homiio puts fairness first: transparent property histories, an Oxy-powered trust score for users and landlords, and values-based roommate matching. No surveillance, no hidden fees, no fake listings.',
  },
  {
    question: 'How does Sindi assist tenants?',
    answer:
      'Sindi is the built-in AI assistant. It gives step-by-step legal guidance, explains your tenant rights in plain language, and can even draft and automate defense letters when something goes wrong.',
  },
  {
    question: 'Who can use Homiio?',
    answer:
      'Anyone with an Oxy account. Renters, room-seekers, and ethical landlords share one identity layer across the whole Oxy ecosystem, so your reputation and history travel with you.',
  },
]

/**
 * The listings the landing renders: Homiio's live rentals once they arrive,
 * the local deck until then. One place decides, so the wheel and the spiral
 * always show the same set.
 */
export function useHomiioDeck(): readonly HomiioListing[] {
  const { data } = useHomiioListings()
  return data && data.length > 0 ? data : HOMIIO_LISTINGS
}
