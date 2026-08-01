import PageShell from '../components/layout/PageShell'
import CodeaContent from '../components/codea/CodeaPage'

export default function CodeaPage() {
  return (
    <PageShell
      seo={{
        title: 'Codea, an open-source AI code editor',
        description:
          'Write, review and ship in the browser, on your machine or self-hosted. A professional AI editor you can read the source of.',
        canonicalPath: '/codea',
      }}
      className="bg-[#0a0a0b]"
      mainClassName="flex-1"
    >
      <div className="cursor-theme">
        <CodeaContent />
      </div>
    </PageShell>
  )
}
