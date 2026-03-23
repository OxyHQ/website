const emails = [
  { sender: "David Park", color: "#EF4444", priority: "urgent" as const, subject: "Server outage — production down", summary: "Critical: API response times spiked 10x, customers affected since 2:14 PM" },
  { sender: "Lisa Wang", color: "#F59E0B", priority: "important" as const, subject: "Board deck needs final review", summary: "Deadline moved up to tomorrow morning, slides 8-12 need your input" },
  { sender: "Tom Rivera", color: "#73A7FF", priority: "normal" as const, subject: "Re: New hire onboarding plan", summary: "Confirmed the start date for Monday, equipment request submitted" },
  { sender: "Priya Sharma", color: "#A78BFA", priority: "important" as const, subject: "Partnership proposal from Acme Corp", summary: "They're offering a 2-year deal with 15% revenue share, wants a call Thursday" },
  { sender: "Chris Muller", color: "#34D399", priority: "normal" as const, subject: "Team offsite — venue options", summary: "Narrowed it down to 3 venues, budget looks good for the lakehouse option" },
];

const priorityDot = { urgent: "bg-red-500", important: "bg-yellow-500", normal: "bg-foreground/20" };

const CatchUpMockup = () => {
  return (
    <div className="flex h-full flex-col bg-[#1a1a1c] border border-foreground/10 rounded-2xl overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-foreground/10">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-foreground/20" />
          <div className="size-2.5 rounded-full bg-foreground/20" />
          <div className="size-2.5 rounded-full bg-foreground/20" />
        </div>
        <span className="ml-2 text-xs font-medium text-foreground/50">Catch Up</span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <svg className="size-5 text-foreground/50" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4.5L8 8.5L14 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <h2 className="text-lg font-semibold text-foreground">Catch Up</h2>
          </div>
          <p className="mt-0.5 text-sm text-foreground/50">While you were away...</p>
        </div>

        {/* Email list */}
        <div className="flex flex-col gap-2">
          {emails.map((email) => (
            <div key={email.sender} className="bg-foreground/5 rounded-xl p-4">
              <div className="flex items-center gap-2.5">
                <div className="size-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: email.color }}>
                  {email.sender[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{email.sender}</span>
                    <div className={`size-1.5 shrink-0 rounded-full ${priorityDot[email.priority]}`} />
                  </div>
                  <p className="text-xs font-medium text-foreground/70 truncate">{email.subject}</p>
                </div>
              </div>
              <p className="mt-1.5 ml-[38px] text-[11px] leading-relaxed text-foreground/40">{email.summary}</p>
            </div>
          ))}
        </div>

        {/* Reply highlight */}
        <div className="bg-[#73A7FF]/10 border-l-2 border-[#73A7FF] rounded-r-xl p-4">
          <p className="text-xs font-medium text-[#73A7FF]">3 emails need your reply</p>
          <p className="mt-0.5 text-[11px] text-foreground/50">David, Lisa, and Priya are waiting on a response</p>
        </div>
      </div>
    </div>
  );
};

export default CatchUpMockup;
