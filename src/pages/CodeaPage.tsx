import PageShell from '../components/layout/PageShell'
import CodeaContent from '../components/codea/CodeaPage'

export default function CodeaPage() {
  return (
    <PageShell
      seo={{
        title: 'Codea — AI Code Editor',
        description:
          'Codea is an AI-native code editor that understands your entire codebase. Write, refactor, and debug faster with intelligent AI assistance.',
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
