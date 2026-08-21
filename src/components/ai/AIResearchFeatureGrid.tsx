import PhotoCardCarousel, { type PhotoCard } from '../sections/PhotoCardCarousel'
import { useTranslation } from '../../lib/i18n'

const RESEARCH_FEATURES: PhotoCard[] = [
  {
    image: '/ai/research/oxy-logo.jpg',
    title: 'Oxy AI, built for better answers',
    description:
      'Oxy AI brings capable models and transparent research tools together, so people can explore ideas with more context and control.',
  },
  {
    image: '/ai/research/oxy-open-ethical.webp',
    title: 'A more open, ethical world',
    description:
      'Oxy believes technology should be open, ethical, and accountable to the people who use it, so the future stays ours to shape together.',
  },
  {
    image: '/ai/research/mention-people.png',
    title: 'Mention, made for people',
    description:
      'Mention is an open social network built around genuine connection, respectful conversations, and a community that keeps people in control.',
  },
  {
    image: '/ai/research/faircoin-stage.png',
    title: 'FairCoin, built for cooperation',
    description:
      'FairCoin gives the ecosystem an open, community-run currency for everyday exchange, with a network people can inspect and use directly.',
  },
  {
    image: '/ai/research/oxy-ai-models.png',
    title: 'Many models, one thoughtful layer',
    description:
      'Oxy works with leading external models while building its own, bringing different capabilities together with clarity, care, and user control.',
  },
  {
    image: '/ai/research/oxy-open-design.png',
    title: 'Open by design',
    description:
      'From identity to infrastructure, Oxy makes room for technology that is inspectable, collaborative, and built to serve people over platforms.',
  },
]

export default function AIResearchFeatureGrid() {
  const { t } = useTranslation()
  const cards = RESEARCH_FEATURES.map((card, index) => ({
    image: card.image,
    title: t(`home.aiFeature${index + 1}Title`),
    description: t(`home.aiFeature${index + 1}Description`),
  }))
  return (
    <PhotoCardCarousel
      title={t('home.aiFeaturesTitle')}
      description={t('home.aiFeaturesDescription')}
      cards={cards}
      variant="square"
    />
  )
}
