const heldNotifications = [
  { sender: "Maya Johnson", snippet: "Hey, quick question about the design..." },
  { sender: "Slack: #engineering", snippet: "New deployment pipeline is ready for..." },
  { sender: "Jordan Lee", snippet: "Can we push the 4 PM meeting to..." },
  { sender: "Calendar", snippet: "Reminder: Team standup in 15 minutes" },
  { sender: "Alex Chen", snippet: "Shared a doc: Q1 Revenue Analysis" },
];

const DeepWorkMockup = () => {
  return (
    <div className="flex h-full flex-col bg-[#1a1a1c] border border-foreground/10 rounded-2xl overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-foreground/10">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-foreground/20" />
          <div className="size-2.5 rounded-full bg-foreground/20" />
          <div className="size-2.5 rounded-full bg-foreground/20" />
        </div>
        <span className="ml-2 text-xs font-medium text-foreground/50">Deep Work</span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <svg className="size-5 text-foreground/50" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="8" cy="8" r="0.75" fill="currentColor" />
            </svg>
            <h2 className="text-lg font-semibold text-foreground">Deep Work</h2>
          </div>
          {/* Focus mode badge */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Focus mode active</span>
          </div>
        </div>

        {/* Current focus block */}
        <div className="bg-foreground/5 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-foreground/30 mb-1.5">Current session</p>
          <p className="text-sm font-medium text-foreground">Code Review Sprint</p>
          <p className="text-xs text-foreground/50 mt-0.5 font-mono">2:00 PM - 3:30 PM</p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-emerald-500/70" style={{ width: "45%" }} />
          </div>
          <p className="text-[10px] text-foreground/30 mt-1">40 min remaining</p>
        </div>

        {/* Blocked notifications */}
        <div className="bg-foreground/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="size-4 text-foreground/40" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6C4 3.79 5.79 2 8 2C10.21 2 12 3.79 12 6V9L13.5 11H2.5L4 9V6Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M6.5 11V12C6.5 12.83 7.17 13.5 8 13.5C8.83 13.5 9.5 12.83 9.5 12V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-medium text-foreground/70">12 notifications held</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {heldNotifications.map((n) => (
              <div key={n.sender} className="flex items-center gap-2 opacity-40">
                <div className="size-1 shrink-0 rounded-full bg-foreground/30" />
                <span className="text-[11px] shrink-0 font-medium text-foreground/50">{n.sender}</span>
                <span className="text-[11px] text-foreground/30 truncate">{n.snippet}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-reply preview */}
        <div className="bg-[#73A7FF]/10 border-l-2 border-[#73A7FF] rounded-r-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#73A7FF]/60 mb-1">Auto-reply</p>
          <p className="text-xs text-foreground/60 italic">
            "I'm in a focus session. I'll respond after 3:30 PM."
          </p>
        </div>

        {/* Exit button */}
        <button className="w-full rounded-xl border border-foreground/10 bg-foreground/5 py-2.5 text-xs font-medium text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground/70">
          Exit focus mode
        </button>
      </div>
    </div>
  );
};

export default DeepWorkMockup;
