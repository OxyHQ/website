// Static IDE demo mockup — recreates an OpenAI Codex-style hero IDE window.
// Purely visual, no interactivity.

export default function IDEDemoMockup() {
  return (
    <div
      className="flex h-full w-full overflow-hidden rounded-[10px] bg-[#1e1e20] text-sm select-none"
      style={{
        boxShadow:
          '0 28px 70px rgba(0,0,0,0.14), 0 14px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      {/* ─── Sidebar ─── */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-white/[0.06] bg-[#171717] px-2 py-1.5">
        {/* Mac dots + sidebar toggle */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 pl-1">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#febc2e' }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#28c840' }} />
          </div>
          {/* Sidebar toggle icon */}
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/80 hover:bg-white/5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.47 3.2c-.36 0-.66.01-.91.03-.31.03-.53.07-.7.13a2.5 2.5 0 0 0-1.09.95c-.1.2-.16.45-.2.86-.03.42-.03.95-.03 1.71v2.13c0 .76 0 1.29.03 1.71.04.42.1.67.2.87a2.5 2.5 0 0 0 1.09.95c.17.07.39.1.7.13.25.02.55.03.91.03V3.2Zm1.06 9.6h3.2c.76 0 1.29 0 1.71-.03.41-.04.66-.1.86-.2a2.5 2.5 0 0 0 1.1-.95c.09-.2.16-.45.19-.87.03-.42.04-.95.04-1.7V6.93c0-.76-.01-1.29-.04-1.71-.03-.41-.1-.66-.19-.86a2.5 2.5 0 0 0-1.1-.95c-.2-.1-.45-.16-.86-.2-.42-.03-.95-.03-1.71-.03H6.53v9.6Z" />
            </svg>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-0.5">
          <SidebarButton icon={<PencilIcon />} label="New thread" />
          <SidebarButton icon={<ClockIcon />} label="Automations" />
          <SidebarButton icon={<CubeIcon />} label="Skills" />
        </div>

        {/* Threads header */}
        <div className="px-2 pt-4 pb-2 text-xs font-medium text-muted-foreground">Threads</div>

        {/* Thread groups */}
        <div className="min-h-0 flex-1 space-y-0.5 overflow-hidden">
          {/* Codea group */}
          <ThreadGroup
            name="Codea"
            icon={<FolderIcon />}
            threads={[
              { name: 'Use image skill', time: '1h' },
              { name: 'Create Codex app CTA', time: '4h' },
              { name: 'Implement dark mode', time: '8h' },
            ]}
          />
          {/* ChatGPT group */}
          <ThreadGroup
            name="ChatGPT"
            icon={<FolderIcon />}
            threads={[{ name: 'Voice mode shortcuts', time: '2h' }]}
          />
          {/* Sora group */}
          <ThreadGroup
            name="Sora"
            icon={<FolderIcon />}
            threads={[{ name: 'Persist prompt presets', time: '5h' }]}
          />
          {/* Atlas group */}
          <ThreadGroup
            name="Atlas"
            icon={<FolderIcon />}
            threads={[{ name: 'Add Status filter facet', time: '3h' }]}
          />
        </div>
      </aside>

      {/* ─── Main content area ─── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#1a1a1c]">
        {/* Header bar */}
        <header className="flex items-center justify-between border-b border-white/[0.06] px-3 py-1.5 text-sm">
          <div className="min-w-0 truncate pl-1 font-medium text-foreground/90">Implement dark mode</div>
          <div className="flex items-center gap-1.5">
            <HeaderPill icon={<TerminalIcon />} label="Terminal" />
            <HeaderPill icon={<PlusIcon />} label="New" />
          </div>
        </header>

        {/* Chat / task content */}
        <div className="flex-1 overflow-hidden px-6 py-5">
          {/* Task card */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center gap-2 text-foreground/90">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <circle cx="5" cy="5" r="4" />
                </svg>
              </span>
              <span className="font-medium">Implementing dark mode for the dashboard</span>
            </div>

            <p className="mb-4 text-xs leading-relaxed text-foreground/55">
              Analyzing the codebase to add a dark theme toggle. This involves updating CSS variables, adding a
              ThemeProvider context, and wiring the toggle into the settings panel.
            </p>

            {/* Status steps */}
            <div className="mb-4 space-y-1.5 text-xs">
              <StatusStep done label="Scanned project structure" />
              <StatusStep done label="Identified color tokens in globals.css" />
              <StatusStep done label="Created ThemeProvider component" />
              <StatusStep active label="Updating Dashboard.tsx with dark mode classes" />
            </div>

            {/* Changed files */}
            <div className="mb-4">
              <div className="mb-1.5 text-xs font-medium text-foreground/55">Changed files</div>
              <div className="flex flex-wrap gap-1.5">
                <FilePill name="globals.css" additions={24} deletions={3} />
                <FilePill name="ThemeProvider.tsx" additions={48} />
                <FilePill name="Dashboard.tsx" additions={12} deletions={8} />
                <FilePill name="settings.ts" additions={6} deletions={1} />
              </div>
            </div>

            {/* Diff preview */}
            <div className="overflow-hidden rounded-md border border-white/[0.06] bg-[#141416] text-xs">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-1.5 text-foreground/55">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-foreground/40">
                  <path d="M2 1h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Z" />
                </svg>
                <span>Dashboard.tsx</span>
              </div>
              <div className="font-mono leading-5">
                <DiffLine type="context" lineNum="14" content="  return (" />
                <DiffLine type="deletion" lineNum="15" content='    <div className="bg-white text-gray-900">' />
                <DiffLine type="addition" lineNum="15" content='    <div className="bg-background text-foreground">' />
                <DiffLine type="context" lineNum="16" content="      <Sidebar />" />
                <DiffLine type="context" lineNum="17" content="      <main>" />
                <DiffLine type="deletion" lineNum="18" content='        <h1 className="text-black">Dashboard</h1>' />
                <DiffLine type="addition" lineNum="18" content='        <h1 className="text-foreground">Dashboard</h1>' />
                <DiffLine type="context" lineNum="19" content="      </main>" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────── Sub-components ───────────────── */

function SidebarButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex h-7 w-full items-center gap-2.5 rounded-lg px-2 text-foreground/80">
      <span className="text-foreground/55">{icon}</span>
      <span>{label}</span>
    </div>
  )
}

function ThreadGroup({
  name,
  icon,
  threads,
}: {
  name: string
  icon: React.ReactNode
  threads: { name: string; time: string }[]
}) {
  return (
    <div>
      <div className="flex h-7 w-full items-center gap-2.5 rounded-lg px-2 text-foreground/80">
        <span className="text-foreground/55">{icon}</span>
        <span>{name}</span>
      </div>
      <div className="mt-0.5 space-y-0.5">
        {threads.map((t) => (
          <div
            key={t.name}
            className="flex h-7 w-full items-center justify-between gap-2.5 rounded-md px-2"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="h-3.5 w-3.5 flex-none" />
              <span className="min-w-0 truncate text-sm text-foreground/70">{t.name}</span>
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">{t.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeaderPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 text-sm text-foreground/80">
      {icon}
      <span>{label}</span>
    </div>
  )
}

function FilePill({
  name,
  additions,
  deletions,
}: {
  name: string
  additions?: number
  deletions?: number
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-xs text-foreground/70">
      <span>{name}</span>
      {additions != null && <span className="text-emerald-400">+{additions}</span>}
      {deletions != null && <span className="text-red-400">-{deletions}</span>}
    </span>
  )
}

function StatusStep({ done, active, label }: { done?: boolean; active?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-foreground/70">
      {done ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-emerald-400">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4.5 7 6.2 8.7 9.5 5.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : active ? (
        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
      ) : (
        <span className="h-3.5 w-3.5 rounded-full border border-white/20" />
      )}
      <span>{label}</span>
    </div>
  )
}

function DiffLine({
  type,
  lineNum,
  content,
}: {
  type: 'context' | 'addition' | 'deletion'
  lineNum: string
  content: string
}) {
  const bg =
    type === 'addition'
      ? 'bg-emerald-500/10'
      : type === 'deletion'
        ? 'bg-red-500/10'
        : ''
  const prefix = type === 'addition' ? '+' : type === 'deletion' ? '-' : ' '
  const textColor =
    type === 'addition'
      ? 'text-emerald-300'
      : type === 'deletion'
        ? 'text-red-300'
        : 'text-foreground/55'

  return (
    <div className={`flex ${bg}`}>
      <span className="w-10 shrink-0 select-none pr-2 text-right text-foreground/25">{lineNum}</span>
      <span className="w-4 shrink-0 select-none text-center text-foreground/35">{prefix}</span>
      <span className={textColor}>{content}</span>
    </div>
  )
}

/* ───────────────── Icons ───────────────── */

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M10.77 2.49a2.12 2.12 0 0 1 2.74.13 2.12 2.12 0 0 1 .13 2.74l-4.04 4.04a3.04 3.04 0 0 1-1.55.83l-1.46.21-1.45.2a.53.53 0 0 1-.55-.15.53.53 0 0 1-.15-.55l.21-1.45.05-.25a3.04 3.04 0 0 1 .86-1.56l4.04-4.04.15-.13Zm1.85.89a.93.93 0 0 0-1.18.07l-4.04 4.04c-.29.29-.49.65-.57 1.04l-.1.67 .75-.11.17-.03a1.83 1.83 0 0 0 .96-.57l4.04-4.04a.93.93 0 0 0 .06-1.18l-.06-.07-.03.18Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.27 8a5.27 5.27 0 1 1-10.54 0 5.27 5.27 0 0 1 10.54 0Zm-5.8-3.2a.53.53 0 0 1 1.06 0v3.2c0 .11-.03.21-.09.3l-.07.08-1.6 1.6a.53.53 0 0 1-.75-.75l1.44-1.44V4.8ZM14.33 8a6.33 6.33 0 1 1-12.66 0 6.33 6.33 0 0 1 12.66 0Z" />
    </svg>
  )
}

function CubeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.79 18.51a1.64 1.64 0 0 1-.99-.33l-3.45-2.38a2.04 2.04 0 0 1-.87-1.62V6.53c0-.33.07-.62.22-.89.15-.27.37-.49.66-.66l5.72-3.52c.33-.2.68-.3 1.06-.29.38 0 .73.1 1.05.32l3.52 2.4c.26.19.46.41.6.67.14.25.21.53.21.84v7.89c0 .33-.08.65-.25.95-.17.3-.4.54-.69.71l-5.79 3.56Zm4.59-13.85-2.96-2.02a.36.36 0 0 0-.31-.1.36.36 0 0 0-.3.08l-5.31 3.27 3.27 2.22 5.61-3.45ZM8.14 9.33l-3.28-2.22v3.1l3.28 2.24V9.33Zm0 4.71-3.28-2.24v2.66c0 .1.02.19.06.28.04.08.1.15.19.21l3.03 2.07v-2.98Zm7-4.15V5.81l-5.62 3.45v3.09l5.62-3.46Zm-.28 4.9c.09-.06.16-.13.21-.2.05-.09.07-.19.07-.3V11.48l-5.62 3.46v3.13l5.34-3.29Z" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.29 7.47H2.71v2.69c0 .54 0 .92.02 1.21.02.29.07.45.13.57l.05.1a1.5 1.5 0 0 0 .56.51l.1.04c.11.04.25.07.47.08.29.02.67.02 1.2.02h5.52c.54 0 .92 0 1.21-.02.28-.02.44-.07.56-.13l.1-.05a1.5 1.5 0 0 0 .51-.56l.04-.1c.04-.11.07-.25.09-.47.02-.29.02-.67.02-1.2V7.47ZM14.31 10.16c0 .52 0 .95-.03 1.29-.02.3-.07.58-.18.84l-.05.11a2.56 2.56 0 0 1-1.05.97l-.17.09c-.28.15-.6.21-.95.24-.34.03-.76.03-1.29.03H5.24c-.52 0-.95 0-1.29-.03-.3-.02-.58-.08-.83-.18l-.11-.05a2.56 2.56 0 0 1-1.05-1.01l-.09-.17c-.15-.28-.21-.59-.24-.95-.03-.34-.03-.76-.03-1.29V5.84c0-.52 0-.95.03-1.29.03-.35.09-.66.24-.94l.09-.17A2.56 2.56 0 0 1 3 2.51l.11-.05c.26-.11.53-.16.84-.18.34-.03.76-.03 1.29-.03h.56c.11 0 .19 0 .27.01l.2.02c.46.07.9.27 1.25.58l.19.19c.09.09.12.12.15.15l.09.07c.22.16.48.26.75.28l.21.01h1.85c.52 0 .95 0 1.29.03.35.03.66.09.94.24l.17.09c.38.23.69.56.88.96l.05.11c.11.26.16.53.18.84.03.34.03.76.03 1.29v3.02ZM2.71 6.45h10.59c0-.2-.01-.37-.02-.52-.02-.21-.04-.36-.08-.47l-.04-.1a1.5 1.5 0 0 0-.51-.56l-.1-.05c-.12-.06-.28-.1-.57-.13-.29-.02-.67-.02-1.2-.02H8.92l-.27-.01a2.04 2.04 0 0 1-1.3-.48l-.16-.13a3.7 3.7 0 0 0-.19-.19l-.15-.15a1.5 1.5 0 0 0-.73-.34l-.12-.01h-.88c-.54 0-.92 0-1.21.02-.21.02-.36.05-.47.08l-.1.04a1.5 1.5 0 0 0-.56.51l-.05.1c-.06.12-.1.28-.13.57-.02.29-.02.67-.02 1.2v.63Z" />
    </svg>
  )
}

function TerminalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.96 6.29a.53.53 0 0 1 .75 0l1.33 1.33a.53.53 0 0 1 0 .75L5.71 9.71a.53.53 0 0 1-.75-.75L5.91 8l-.96-.96a.53.53 0 0 1 0-.75Z" />
      <path d="M10.67 9.33a.53.53 0 0 0 0-1.06H8.67a.53.53 0 0 0 0 1.06h2Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M10.13 2.13h-4.26c-.55 0-1 0-1.36.03-.37.03-.7.1-1.01.26a2.56 2.56 0 0 0-1.11 1.11c-.15.31-.23.64-.26 1.01-.03.36-.03.81-.03 1.36v4.26c0 .55 0 1 .03 1.36.03.37.09.7.26 1.01.24.48.63.87 1.11 1.11.31.15.64.23 1.01.26.36.03.81.03 1.36.03h4.26c.55 0 1 0 1.36-.03.37-.03.7-.1 1.01-.26a2.56 2.56 0 0 0 1.11-1.11c.15-.31.23-.64.26-1.01.03-.36.03-.81.03-1.36V5.86c0-.55 0-1-.03-1.36-.03-.37-.1-.7-.26-1.01a2.56 2.56 0 0 0-1.11-1.11c-.31-.15-.64-.23-1.01-.26-.36-.03-.81-.03-1.36-.03Zm-4.26 1.06c-.57 0-.96 0-1.27.03-.3.02-.47.07-.6.13a1.5 1.5 0 0 0-.64.64c-.06.13-.1.3-.13.6-.03.3-.03.7-.03 1.27v4.26c0 .57 0 .97.03 1.27.02.3.07.47.13.6a1.5 1.5 0 0 0 .64.64c.13.06.3.1.6.13.31.02.7.03 1.27.03h4.26c.57 0 .96 0 1.27-.03.3-.02.47-.07.6-.13a1.5 1.5 0 0 0 .64-.64c.06-.13.1-.3.13-.6.03-.3.03-.7.03-1.27V5.86c0-.57 0-.96-.03-1.27-.02-.3-.07-.47-.13-.6a1.5 1.5 0 0 0-.64-.64c-.13-.06-.3-.1-.6-.13-.31-.03-.7-.03-1.27-.03H5.86Z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 3a.5.5 0 0 1 .5.5v4h4a.5.5 0 0 1 0 1h-4v4a.5.5 0 0 1-1 0v-4h-4a.5.5 0 0 1 0-1h4v-4A.5.5 0 0 1 8 3Z" />
    </svg>
  )
}
