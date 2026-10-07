import { Fragment } from 'react'
import TransparencyDocument from '../components/slices/TransparencyDocument'
import { articleMdxComponents } from '../components/slices/articleMdxComponents'
import { ARTICLE_BLOCK } from '../components/slices/articleBlock'
import { Link } from '../lib/navigation'
import { LEGAL_DOCUMENTS, TRANSPARENCY_DOCUMENTS } from '../lib/transparency'
import { RiArrowRightLine } from '@oxy.so/bloom/icons/RiArrowRightLine'

const { h2: Heading, p: Paragraph } = articleMdxComponents

export default function TransparencyPage({ legal = false }: { legal?: boolean }) {
  const groups = legal ? [{
    id: 'policies', title: 'Legal documents', description: 'Policies and terms for using Oxy.',
    documents: LEGAL_DOCUMENTS.map((doc) => ({ ...doc, path: `/transparency/legal/${doc.slug}/` })),
  }] : [{
    id: 'foundations', title: 'Principles & governance', description: 'What we stand for, how we work, and how to hold us to it.',
    documents: TRANSPARENCY_DOCUMENTS,
  }, {
    id: 'legal', title: 'Legal & policies', description: 'Your rights and the terms that apply to our services.',
    documents: [{ title: 'Legal documents', description: 'Privacy, terms, cookies, accessibility and other policies.', path: '/transparency/legal/' }],
  }, {
    id: 'operations', title: 'Operations & updates', description: 'Follow the work and the services it supports.',
    documents: [
      { title: 'Service status', description: 'Service availability and incident history.', path: '/status/' },
      { title: 'Changelog', description: 'Changes across Oxy products and infrastructure.', path: '/changelog/' },
    ],
  }]

  return (
    <TransparencyDocument
      canonicalPath={legal ? '/transparency/legal' : '/transparency'}
      title={legal ? 'Legal documents' : 'Transparency Center'}
      eyebrow="Documents & accountability"
      description={legal ? 'The policies and terms that shape your relationship with Oxy.' : 'Our principles, policies and decisions, in one place. Read what we commit to and follow the work behind it.'}
      readingTools={false}
      entries={groups.map(({ id, title }) => ({ id, label: title, level: 2 }))}
    >
      {groups.map(({ id, title, description, documents }) => (
        <Fragment key={id}>
          <Heading id={id}>{title}</Heading>
          <Paragraph>{description}</Paragraph>
          <ul className={`${ARTICLE_BLOCK} mt-8 w-full divide-y divide-border border-y border-border`}>
            {documents.map((document) => (
              <li key={document.path}>
                <Link to={document.path} className="group flex items-center justify-between gap-6 py-6 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                  <div>
                    <h3 className="text-body-1 text-primary">{document.title}</h3>
                    <p className="mt-2 max-w-prose text-b3 text-muted-foreground">{document.description}</p>
                  </div>
                  <span className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden><RiArrowRightLine width={20} height={20} fill="currentColor" /></span>
                </Link>
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </TransparencyDocument>
  )
}
