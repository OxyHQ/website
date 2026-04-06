import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import { usePage, type PageSection } from '../api/hooks'

const legalSections = [
  { slug: 'privacy', title: 'Privacy Policy', description: 'How we collect, use, and protect your data.' },
  { slug: 'cookies', title: 'Cookie Policy', description: 'How we use cookies and similar technologies.' },
  { slug: 'terms', title: 'Terms & Conditions', description: 'The terms governing your use of Oxy.' },
  { slug: 'accessibility', title: 'Accessibility', description: 'Our commitment to digital accessibility.' },
  { slug: 'llms', title: 'LLMs', description: 'How Oxy uses large language models.' },
]

function SectionContent({ slug }: { slug: string }) {
  const meta = legalSections.find((s) => s.slug === slug)
  const { data: pageData } = usePage(`legal-${slug}`)
  const title = pageData?.title ?? meta?.title ?? slug
  const pageSections = pageData?.sections ?? []

  return (
    <div className="container max-w-3xl py-16">
      <Link to="/legal" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M11.75 7H2.25m0 0 3.393 3.5M2.25 7l3.393-3.5" />
        </svg>
        All legal documents
      </Link>
      <h1 className="mb-8 text-4xl font-semibold tracking-tight text-foreground">{title}</h1>
      {pageSections.length > 0 ? (
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {pageSections.map((s: PageSection, i: number) => (
            <div key={i}>
              {s.heading && <h2>{s.heading}</h2>}
              {s.subheading && <h3>{s.subheading}</h3>}
              {s.content && <div dangerouslySetInnerHTML={{ __html: s.content }} />}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">This document is being prepared and will be available soon.</p>
      )}
    </div>
  )
}

function LegalIndex() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="mb-2 text-4xl font-semibold tracking-tight text-foreground">Legal</h1>
      <p className="mb-10 text-lg text-muted-foreground">Legal documents and policies for Oxy.</p>
      <div className="flex flex-col gap-3">
        {legalSections.map((section) => (
          <Link
            key={section.slug}
            to={`/legal/${section.slug}`}
            className="group flex items-center justify-between rounded-xl border border-border p-5 transition-colors hover:bg-foreground/[0.03]"
          >
            <div>
              <h2 className="text-base font-medium text-foreground">{section.title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{section.description}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.1" d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function LegalPage() {
  const { section } = useParams<{ section?: string }>()
  const current = section ? legalSections.find((s) => s.slug === section) : undefined
  const title = current?.title ?? 'Legal'
  const description = current?.description ?? 'Legal documents and policies for Oxy.'

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={title}
        description={description}
        canonicalPath={section ? `/legal/${section}` : '/legal'}
      />
      <Navbar />
      <main className="flex-1">
        {section ? <SectionContent slug={section} /> : <LegalIndex />}
      </main>
      <Footer />
    </div>
  )
}
