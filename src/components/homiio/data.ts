import teresaPamies from '../../assets/homiio/teresa-pamies.jpg'
import torrentOlla from '../../assets/homiio/torrent-olla.jpg'
import santAntoni from '../../assets/homiio/sant-antoni.jpg'
import manso from '../../assets/homiio/manso.jpeg'
import rogerLluria from '../../assets/homiio/roger-lluria.png'
import gaudi from '../../assets/homiio/gaudi.jpg'
import industria from '../../assets/homiio/industria.jpg'
import sandra from '../../assets/homiio/sandra.jpg'

export interface HomiioListing {
  id: string
  title: string
  /** Monthly price in FairCoin, shown next to the coin glyph. */
  price: string
  image: string
}

export const SANDRA_IMAGE = sandra

/** The seven distinct listings that ride around the hero wheel. */
export const HOMIIO_LISTINGS: readonly HomiioListing[] = [
  { id: 'teresa-pamies', title: 'Alquiler de piso en calle de Teresa Pàmies, 61', price: '482', image: teresaPamies },
  { id: 'torrent-olla', title: "Alquiler de piso en calle del Torrent de l'Olla, 60", price: '1,385', image: torrentOlla },
  { id: 'sant-antoni', title: 'Alquiler de piso en Sant Antoni', price: '440', image: santAntoni },
  { id: 'manso', title: 'Alquiler de piso en calle de Manso', price: '219', image: manso },
  { id: 'roger-lluria', title: 'Alquiler de habitación en calle de Roger de Llúria, 126', price: '220', image: rogerLluria },
  { id: 'gaudi', title: 'Alquiler de ático en avenida de Gaudí, 31', price: '600', image: gaudi },
  { id: 'industria', title: 'Alquiler de piso en calle de la Indústria', price: '550', image: industria },
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
