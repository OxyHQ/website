const emails = [
  { sender: "Alex Chen", avatar: "AC", subject: "Q1 revenue report — final numbers", time: "9:32 AM", unread: true },
  { sender: "Maya Johnson", avatar: "MJ", subject: "Updated brand guidelines attached", time: "9:15 AM", unread: true, aiDraft: true },
  { sender: "Jordan Lee", avatar: "JL", subject: "Re: Product launch timeline", time: "8:48 AM", unread: false },
  { sender: "Priya Patel", avatar: "PP", subject: "Quarterly OKR check-in notes", time: "8:20 AM", unread: false, aiDraft: true },
  { sender: "Sam Rivera", avatar: "SR", subject: "New logo concepts for review", time: "7:55 AM", unread: true },
  { sender: "Newsletter Bot", avatar: "NB", subject: "Your weekly design digest", time: "6:00 AM", unread: false, archived: true },
];

const tabs = [
  { label: "Priority", active: true },
  { label: "All", active: false },
  { label: "Newsletters", active: false },
  { label: "Automated", active: false },
];

const InboxMockup = () => {
  return (
    <div className="flex h-full flex-col bg-[#1a1a1c] border border-foreground/10 rounded-2xl overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-foreground/10">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-foreground/20" />
          <div className="size-2.5 rounded-full bg-foreground/20" />
          <div className="size-2.5 rounded-full bg-foreground/20" />
        </div>
        <svg className="ml-2 size-4 text-foreground/50" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 4.5L8 8.5L14 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <span className="text-xs font-medium text-foreground/50">Smart Inbox</span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
        {/* Filter tabs */}
        <div className="flex gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                tab.active
                  ? "bg-[#73A7FF]/15 text-[#73A7FF]"
                  : "bg-foreground/5 text-foreground/50 hover:bg-foreground/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Email list */}
        <div className="flex flex-col gap-1">
          {emails.map((email) => (
            <div
              key={email.sender}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-foreground/5"
            >
              {/* Avatar */}
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold text-foreground/60">
                {email.avatar}
              </div>

              {/* Content */}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${email.unread ? "font-semibold text-foreground" : "font-medium text-foreground/70"}`}>
                    {email.sender}
                  </span>
                  {email.aiDraft && (
                    <span className="rounded-full bg-[#73A7FF]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#73A7FF]">
                      AI drafted reply
                    </span>
                  )}
                  {email.archived && (
                    <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] text-foreground/40">
                      Low priority — archived
                    </span>
                  )}
                </div>
                <span className={`truncate text-xs ${email.unread ? "text-foreground/60" : "text-foreground/40"}`}>
                  {email.subject}
                </span>
              </div>

              {/* Time & actions */}
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[10px] text-foreground/30 group-hover:hidden">{email.time}</span>
                <div className="hidden gap-1 group-hover:flex">
                  {["Reply", "Archive", "Snooze"].map((a) => (
                    <span key={a} className="rounded-md bg-foreground/10 px-1.5 py-0.5 text-[10px] text-foreground/50">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Unread indicator */}
              {email.unread && <div className="size-1.5 shrink-0 rounded-full bg-[#73A7FF]" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InboxMockup;
