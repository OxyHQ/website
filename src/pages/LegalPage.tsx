import { Fragment, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { usePage } from '../api/hooks';
import { sanitizeCmsHtml } from '../lib/sanitizeCmsHtml';
import { canonicalHref } from '../lib/canonicalPath';
import { LEGAL_DOCUMENTS } from '../lib/transparency';
import TransparencyDocument from '../components/slices/TransparencyDocument';
import { articleMdxComponents } from '../components/slices/articleMdxComponents';
import { ARTICLE_BLOCK } from '../components/slices/articleBlock';
import type { TocEntry } from '../components/slices/ArticleToc';
import NotFoundPage from './NotFoundPage';

const { h2: Heading, h3: Subheading, p: Paragraph } = articleMdxComponents;

function LegalDocument({ document }: { document: (typeof LEGAL_DOCUMENTS)[number] }) {
  // Keep CMS identifiers stable: the public URL does not change the stored page.
  const { data, isPending, isError, refetch } = usePage(`legal-${document.slug}`);
  const { sections, entries } = useMemo(() => {
    const entries: TocEntry[] = [];
    const sections = [...(data?.sections ?? [])]
      .sort((a, b) => a.order - b.order)
      .map((section, index) => {
        const id = `section-${index + 1}`;
        if (section.heading) entries.push({ id, label: section.heading, level: 2 });
        if (section.subheading)
          entries.push({ id: `${id}-subheading`, label: section.subheading, level: 3 });
        let html = sanitizeCmsHtml(section.content ?? '');
        if (typeof DOMParser !== 'undefined') {
          const body = new DOMParser().parseFromString(html, 'text/html').body;
          body.querySelectorAll('h2, h3, h4').forEach((heading, headingIndex) => {
            heading.id = `${id}-heading-${headingIndex + 1}`;
            entries.push({
              id: heading.id,
              label: heading.textContent ?? '',
              level: Number(heading.tagName.slice(1)),
            });
          });
          body.querySelectorAll('a[href]').forEach((link) => {
            link.setAttribute('href', canonicalHref(link.getAttribute('href')!)!);
          });
          html = body.innerHTML;
        }
        return { ...section, id, html };
      });
    return { sections, entries };
  }, [data?.sections]);
  const title = data?.title || document.title;

  return (
    <TransparencyDocument
      canonicalPath={`/transparency/legal/${document.slug}`}
      title={title}
      eyebrow="Legal"
      description={data?.description || document.description}
      entries={entries}
      readingTools={sections.length > 0}
      cta={{
        title: 'Explore the collection.',
        label: 'All legal documents',
        href: '/transparency/legal/',
      }}
    >
      {isPending ? (
        <Paragraph>
          <span role="status">Loading document…</span>
        </Paragraph>
      ) : sections.length > 0 ? (
        sections.map((section) => (
          <Fragment key={section.id}>
            {section.heading && <Heading id={section.id}>{section.heading}</Heading>}
            {section.subheading && (
              <Subheading id={`${section.id}-subheading`}>{section.subheading}</Subheading>
            )}
            {section.content && (
              <div
                className={`${ARTICLE_BLOCK} w-full min-w-0 text-blog-body text-foreground [&_p]:mt-4 [&_a]:text-primary [&_a]:underline [&_h2]:scroll-m-24 [&_h2]:pt-12 [&_h2]:pb-4 [&_h2]:text-subheading-3 [&_h2]:text-primary [&_h3]:scroll-m-24 [&_h3]:pt-8 [&_h3]:pb-4 [&_h3]:text-body-1 [&_h4]:scroll-m-24 [&_h4]:pt-6 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:mb-2 [&_table]:block [&_table]:overflow-x-auto [&_td]:border [&_td]:border-border [&_td]:p-3 [&_th]:border [&_th]:border-border [&_th]:p-3`}
                dangerouslySetInnerHTML={{ __html: section.html }}
              />
            )}
          </Fragment>
        ))
      ) : isError ? (
        <>
          <Heading>Document unavailable</Heading>
          <Paragraph>
            We could not load this document. Please try again, or contact{' '}
            <a className="text-primary underline" href="mailto:legal@oxy.so">
              legal@oxy.so
            </a>
            .
          </Paragraph>
          <div className={`${ARTICLE_BLOCK} mt-6`}>
            <button
              type="button"
              className="cursor-pointer rounded-full border border-border px-5 py-3 text-b3 hover:bg-muted"
              onClick={() => void refetch()}
            >
              Try again
            </button>
          </div>
        </>
      ) : (
        <>
          <Heading>Publication pending</Heading>
          <Paragraph>
            This document is being prepared and will be published here once it is ready.
          </Paragraph>
          <Paragraph>
            For legal, privacy or compliance questions, contact{' '}
            <a className="text-primary underline" href="mailto:legal@oxy.so">
              legal@oxy.so
            </a>
            .
          </Paragraph>
        </>
      )}
    </TransparencyDocument>
  );
}

export default function LegalPage() {
  const { section } = useParams<{ section: string }>();
  const document = LEGAL_DOCUMENTS.find(({ slug }) => slug === section);
  return document ? <LegalDocument key={document.slug} document={document} /> : <NotFoundPage />;
}
