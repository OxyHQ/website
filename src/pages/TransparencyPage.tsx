import TransparencyCollection, { type TransparencyCollectionProps } from '../components/transparency/TransparencyCollection'
import { LEGAL_DOCUMENTS, TRANSPARENCY_DOCUMENTS } from '../lib/transparency'

const legalDocuments = LEGAL_DOCUMENTS.map((document) => ({
  ...document,
  path: `/transparency/legal/${document.slug}/`,
}))

const transparencyCollection: TransparencyCollectionProps = {
  canonicalPath: '/transparency/',
  description: 'Our principles, policies and decisions, in one place. Read what we commit to and follow the work behind it.',
  hero: {
    titleLines: ['Transparency', 'Center'],
    introduction: 'Every product we build rests on choices about privacy, ownership, and how a business should work. Here you can read the principles behind those choices, the commitments we make, and the policies that apply to our services. Together, these documents explain what you can expect from Oxy and how to hold us accountable.',
    cornerLead: 'Our word. In writing.',
    cornerText: 'Explore the principles, policies and decisions behind our work.',
    featuredDocuments: [
      TRANSPARENCY_DOCUMENTS.find(({ slug }) => slug === 'charter')!,
      { ...TRANSPARENCY_DOCUMENTS.find(({ slug }) => slug === 'manifesto')!, title: 'The Manifesto' },
      { path: '/transparency/legal/', title: 'Legal & policies' },
    ],
    actionLabel: 'Explore the collection',
  },
  resourcesTitle: 'Explore our principles, policies and decisions',
  resourcesTheme: 'transparency-resources-theme',
  groups: [
    { id: 'foundations', title: 'Principles & governance', documents: TRANSPARENCY_DOCUMENTS },
    {
      id: 'legal', title: 'Legal & policies',
      documents: [{ title: 'Legal documents', path: '/transparency/legal/' }],
    },
    {
      id: 'operations', title: 'Operations & updates',
      documents: [
        { title: 'Service status', path: '/status/' },
        { title: 'Changelog', path: '/changelog/' },
      ],
    },
  ],
}

const legalCollection: TransparencyCollectionProps = {
  canonicalPath: '/transparency/legal/',
  description: 'The policies and terms that shape your relationship with Oxy.',
  hero: {
    titleLines: ['Legal', 'documents'],
    introduction: 'Find the policies that explain how Oxy services work, how personal data is handled, and the terms that apply when you use our products. This collection also covers security, accessibility, and acceptable use, so you can understand your rights, your responsibilities, and the commitments we make.',
    cornerLead: 'Your rights. In writing.',
    cornerText: 'Understand the terms, protections and responsibilities that come with using Oxy.',
    featuredDocuments: ['privacy', 'terms', 'security'].map((slug) => legalDocuments.find((document) => document.slug === slug)!),
    actionLabel: 'Explore the policies',
  },
  resourcesTitle: 'Understand your rights and our responsibilities',
  resourcesTheme: 'legal-resources-theme',
  groups: [
    { id: 'privacy', title: 'Privacy & data', documents: legalDocuments.filter(({ slug }) => ['privacy', 'cookies', 'dpa'].includes(slug)) },
    { id: 'terms', title: 'Terms & acceptable use', documents: legalDocuments.filter(({ slug }) => ['terms', 'aup'].includes(slug)) },
    { id: 'protections', title: 'Security & accessibility', documents: legalDocuments.filter(({ slug }) => ['security', 'accessibility'].includes(slug)) },
    { id: 'ai', title: 'AI transparency', documents: legalDocuments.filter(({ slug }) => slug === 'llms') },
  ],
}

export default function TransparencyPage({ legal = false }: { legal?: boolean }) {
  return <TransparencyCollection {...(legal ? legalCollection : transparencyCollection)} />
}
