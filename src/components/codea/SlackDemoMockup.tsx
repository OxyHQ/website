// Static Slack-like chat mockup — recreates a channel interface with AI agent messages.
// Purely visual, no interactivity.

export default function SlackDemoMockup() {
  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-[10px] bg-[#1a1a1c] text-sm select-none"
      style={{
        boxShadow:
          '0 28px 70px rgba(0,0,0,0.14), 0 14px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      {/* ─── Channel Header ─── */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/70">
            <HashIcon />
          </span>
          <span className="text-[13px] font-semibold text-foreground">
            feature-realtime-sync
          </span>
          <span className="ml-1 text-xs text-muted-foreground/60">|</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
            <UsersIcon />
            <span>4 members</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <HeaderButton>
            <SearchIcon />
          </HeaderButton>
          <HeaderButton>
            <PinIcon />
          </HeaderButton>
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {/* Sarah's message */}
        <Message
          avatar={<Avatar color="#3b82f6" initials="S" />}
          name="Sarah Chen"
          time="10:24 AM"
        >
          Just pushed the initial sync implementation. Can someone review the
          conflict resolution logic?
        </Message>

        {/* Codea bot message */}
        <Message
          avatar={<BotAvatar />}
          name="Codea"
          time="10:25 AM"
          isBot
          badge="APP"
        >
          <p>
            I've reviewed the PR. Found 2 potential race conditions in{' '}
            <code className="rounded bg-white/[0.06] px-1 py-0.5 text-xs font-mono text-purple-300">
              syncEngine.ts
            </code>
            . Here's my analysis:
          </p>
          <div className="mt-2 rounded-md bg-[#141415] p-3 font-mono text-xs leading-relaxed text-muted-foreground">
            <div className="text-red-400/80">
              {'//'} Issue 1: Missing mutex on shared state
            </div>
            <div className="mt-1">
              <span className="text-purple-400">async</span>{' '}
              <span className="text-blue-300">handleSync</span>
              {'()'} {'{'}
            </div>
            <div className="pl-4 text-yellow-300/70">
              await this.lock.acquire();{' '}
              <span className="text-green-400/60">
                {'//'} &larr; add this
              </span>
            </div>
            <div className="pl-4">
              <span className="text-purple-400">const</span> state ={' '}
              <span className="text-purple-400">await</span>{' '}
              this.getSharedState();
            </div>
            <div>{'}'}</div>
            <div className="mt-2 text-red-400/80">
              {'//'} Issue 2: Unbounded retry without backoff
            </div>
            <div>
              <span className="text-purple-400">while</span> (!synced) {'{'}{' '}
              <span className="text-green-400/60">
                {'//'} add exponential backoff
              </span>
            </div>
          </div>
        </Message>

        {/* Marcus's message */}
        <Message
          avatar={<Avatar color="#22c55e" initials="M" />}
          name="Marcus Rivera"
          time="10:28 AM"
        >
          Nice catch! I'll fix the mutex issue.{' '}
          <span className="rounded bg-purple-500/20 px-1 py-0.5 text-xs font-medium text-purple-300">
            @Codea
          </span>{' '}
          can you run the integration tests?
        </Message>

        {/* Codea response */}
        <Message
          avatar={<BotAvatar />}
          name="Codea"
          time="10:29 AM"
          isBot
          badge="APP"
        >
          <p>
            Running integration tests...{' '}
            <span className="text-green-400">&#10003; 47/47 passed</span>. No
            regressions detected.
          </p>
        </Message>
      </div>

      {/* ─── Message Input ─── */}
      <div className="border-t border-white/[0.06] px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
          <PlusIcon />
          <span className="flex-1 text-[13px] text-muted-foreground/40">
            Message #feature-realtime-sync
          </span>
          <div className="flex items-center gap-1.5">
            <EmojiIcon />
            <AtIcon />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function Message({
  avatar,
  name,
  time,
  isBot = false,
  badge,
  children,
}: {
  avatar: React.ReactNode;
  name: string;
  time: string;
  isBot?: boolean;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`group flex gap-2.5 rounded-md px-2 py-1.5 hover:bg-white/[0.02] ${
        isBot ? 'border-l-2 border-purple-500/40' : 'border-l-2 border-transparent'
      }`}
    >
      <div className="mt-0.5 shrink-0">{avatar}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[13px] font-semibold ${
              isBot ? 'text-purple-300' : 'text-foreground'
            }`}
          >
            {name}
          </span>
          {badge && (
            <span className="rounded bg-purple-500/20 px-1 py-px text-[10px] font-bold uppercase tracking-wider text-purple-400">
              {badge}
            </span>
          )}
          <span className="text-xs text-muted-foreground/50">{time}</span>
        </div>
        <div className="mt-0.5 text-[13px] leading-relaxed text-foreground/80">
          {children}
        </div>
      </div>
    </div>
  );
}

function Avatar({ color, initials }: { color: string; initials: string }) {
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a1 1 0 0 1 1 1v1h2a3 3 0 0 1 3 3v1h-1a1 1 0 1 0 0 2h1v1a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9h1a1 1 0 0 0 0-2H2V6a3 3 0 0 1 3-3h2V2a1 1 0 0 1 1-1ZM6 7.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
      </svg>
    </div>
  );
}

function HeaderButton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground/50 hover:bg-white/[0.05] hover:text-muted-foreground">
      {children}
    </div>
  );
}

/* ─── Icons ─── */

function HashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6.72 2.18a.75.75 0 0 0-1.44-.36L4.6 5H2.75a.75.75 0 0 0 0 1.5h1.53l-.8 3.5H1.75a.75.75 0 0 0 0 1.5h1.41l-.44 1.82a.75.75 0 0 0 1.44.36L4.84 11h3.32l-.44 1.82a.75.75 0 0 0 1.44.36L9.84 11h1.41a.75.75 0 0 0 0-1.5H10.16l.8-3.5h1.29a.75.75 0 0 0 0-1.5h-.97l.44-1.82a.75.75 0 0 0-1.44-.36L9.6 5H6.28l.44-1.82ZM5.96 6.5l-.8 3.5h3.32l.8-3.5H5.96Z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-4.5 6a4.5 4.5 0 0 1 9 0 .5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85-.017.016Zm-4.742.656a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.828 1.282a2 2 0 0 1 2.829 0l2.06 2.06a2 2 0 0 1 0 2.83l-3.17 3.17a.5.5 0 0 1-.22.13l-2.07.58.58-2.07a.5.5 0 0 1 .13-.22l3.17-3.17a1 1 0 0 0 0-1.414l-2.06-2.06a1 1 0 0 0-1.415 0L6.46 6.29a.5.5 0 0 1-.22.13L4.17 7l.58-2.07a.5.5 0 0 1 .13-.22l3.17-3.17Z" />
      <path d="M1.5 14.5a.5.5 0 0 1 0-.707L5.793 9.5 6.5 10.207l-4.293 4.293a.5.5 0 0 1-.707 0Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="text-muted-foreground/40"
    >
      <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
    </svg>
  );
}

function EmojiIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="text-muted-foreground/30"
    >
      <path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0-1.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11ZM6.5 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-6.3 3.8a.75.75 0 0 1 1.05-.15A3.97 3.97 0 0 0 8 10.5c.87 0 1.61-.32 2.25-.85a.75.75 0 0 1 .9 1.2A5.47 5.47 0 0 1 8 12a5.47 5.47 0 0 1-3.15-1.15.75.75 0 0 1-.15-1.05Z" />
    </svg>
  );
}

function AtIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="text-muted-foreground/30"
    >
      <path d="M8 1a7 7 0 1 0 3.5 13.06.75.75 0 0 0-.75-1.3A5.5 5.5 0 1 1 13.5 8v.5a2 2 0 0 1-4 0V5.75a.75.75 0 0 0-1.5 0V6A3.5 3.5 0 1 0 11.5 8v.5a3.5 3.5 0 0 0 6.13 2.3A7 7 0 0 0 8 1ZM6 8a2 2 0 1 1 4 0 2 2 0 0 1-4 0Z" />
    </svg>
  );
}
