import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@oxyhq/auth'
import { Avatar } from '@oxyhq/bloom/avatar'

export const ADMIN_USERNAMES = ['oxy', 'nate']

interface AdminSection {
  id: string
  label: string
  icon: ReactNode
}

const sections: AdminSection[] = [
  { id: 'settings', label: 'Site Settings', icon: <SettingsIcon /> },
  { id: 'navigation', label: 'Navigation', icon: <MenuIcon /> },
  { id: 'footer', label: 'Footer', icon: <LayoutIcon /> },
  { id: 'pages', label: 'Pages', icon: <FileIcon /> },
  { id: 'newsroom', label: 'Newsroom', icon: <PenIcon /> },
  { id: 'pricing', label: 'Pricing', icon: <TagIcon /> },
  { id: 'testimonials', label: 'Testimonials', icon: <QuoteIcon /> },
  { id: 'changelog', label: 'Changelog', icon: <ClockIcon /> },
  { id: 'jobs', label: 'Jobs', icon: <BriefcaseIcon /> },
  { id: 'mcp-tokens', label: 'API Tokens', icon: <KeyIcon /> },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const activeSection = pathname.split('/admin/')[1]?.split('/')[0] ?? 'settings'

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Avatar source={user?.avatar} size={28} placeholderColor={user?.color} />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">Admin</div>
            <div className="truncate text-xs text-muted-foreground">@{user?.username}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {sections.map((s) => (
            <Link
              key={s.id}
              to={`/admin/${s.id}`}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                activeSection === s.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <span className="size-4 shrink-0">{s.icon}</span>
              {s.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8H4M4 8l3.5 3.5M4 8l3.5-3.5" /></svg>
            Back to site
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

/* ── Icons ── */
function SettingsIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2.5" /><path d="M13.1 10a1.1 1.1 0 00.2 1.2l.04.04a1.33 1.33 0 11-1.88 1.88l-.04-.04a1.1 1.1 0 00-1.2-.2 1.1 1.1 0 00-.66 1v.1a1.33 1.33 0 11-2.67 0v-.06a1.1 1.1 0 00-.72-1 1.1 1.1 0 00-1.2.2l-.03.04a1.33 1.33 0 11-1.88-1.88l.04-.04a1.1 1.1 0 00.2-1.2 1.1 1.1 0 00-1-.66h-.1a1.33 1.33 0 110-2.67h.06a1.1 1.1 0 001-.72 1.1 1.1 0 00-.2-1.2l-.04-.03A1.33 1.33 0 114.94 3.4l.04.04a1.1 1.1 0 001.2.2h.05a1.1 1.1 0 00.66-1v-.1a1.33 1.33 0 112.67 0v.06a1.1 1.1 0 00.72 1 1.1 1.1 0 001.2-.2l.03-.04a1.33 1.33 0 111.88 1.88l-.04.04a1.1 1.1 0 00-.2 1.2v.05a1.1 1.1 0 001 .66h.1a1.33 1.33 0 010 2.67h-.06a1.1 1.1 0 00-1 .72z" /></svg> }
function MenuIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h12M2 8h12M2 12h12" /></svg> }
function LayoutIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="12" height="12" rx="2" /><path d="M2 10h12" /></svg> }
function FileIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2H4.5A1.5 1.5 0 003 3.5v9A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V6L9 2z" /><path d="M9 2v4h4" /></svg> }
function PenIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11.5 2.5a1.77 1.77 0 012.5 2.5L5.5 13.5 2 14l.5-3.5 9-9z" /></svg> }
function TagIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8.5V3a1 1 0 011-1h5.5L14 7.5 8.5 13 2 8.5z" /><circle cx="5.5" cy="5.5" r="1" /></svg> }
function QuoteIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7.5H3A1.5 1.5 0 011.5 6V4.5A1.5 1.5 0 013 3h1.5A1.5 1.5 0 016 4.5V9a3 3 0 01-3 3M14 7.5h-3A1.5 1.5 0 019.5 6V4.5A1.5 1.5 0 0111 3h1.5A1.5 1.5 0 0114 4.5V9a3 3 0 01-3 3" /></svg> }
function ClockIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6" /><path d="M8 4.5V8l2.5 1.5" /></svg> }
function BriefcaseIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="5" width="13" height="8" rx="1.5" /><path d="M5.5 5V3.5A1.5 1.5 0 017 2h2a1.5 1.5 0 011.5 1.5V5" /></svg> }
function KeyIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 2a3.5 3.5 0 00-2.8 5.6L2 13.5V15h1.5l5.9-5.7A3.5 3.5 0 1010.5 2z" /><circle cx="11" cy="5" r="1" /></svg> }
