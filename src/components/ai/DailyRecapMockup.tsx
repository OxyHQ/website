const stats = [
  { value: "8", label: "tasks completed" },
  { value: "12", label: "emails handled" },
  { value: "3", label: "meetings" },
];

const accomplishments = [
  "Shipped mobile navigation redesign to staging",
  "Reviewed and approved Q1 marketing budget",
  "Resolved 3 design system token conflicts",
  "Sent feedback on onboarding flow to product team",
];

const tomorrowMeetings = [
  { time: "9:30 AM", title: "Sprint planning" },
  { time: "2:00 PM", title: "Client presentation rehearsal" },
];

const pendingTasks = [
  "Finalize slide deck for client presentation",
  "Review pull request for design system updates",
  "Prepare user testing script for Thursday",
];

const DailyRecapMockup = () => {
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
          <circle cx="8" cy="11" r="4.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 6.5V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M4.5 4.5L5.5 5.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M11.5 4.5L10.5 5.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span className="text-xs font-medium text-foreground/50">Daily Recap</span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">Today's summary</h2>
          <p className="mt-0.5 text-sm text-foreground/50">Monday, March 23</p>
        </div>

        {/* Stats row */}
        <div className="flex gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="flex-1 bg-foreground/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-foreground">{stat.value}</div>
              <div className="text-[10px] text-foreground/40">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Accomplishments */}
        <div className="bg-foreground/5 rounded-xl p-4">
          <h4 className="text-xs font-medium text-foreground mb-2.5">Accomplishments</h4>
          <div className="flex flex-col gap-2">
            {accomplishments.map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-[11px]">
                <svg className="mt-0.5 size-3.5 shrink-0 text-emerald-400" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-foreground/60">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tomorrow's preview */}
        <div className="bg-foreground/5 rounded-xl p-4">
          <h4 className="text-xs font-medium text-foreground mb-2.5">Tomorrow's preview</h4>

          {/* Meetings */}
          <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/30 mb-1.5">Meetings</p>
          <div className="flex flex-col gap-1.5 mb-3">
            {tomorrowMeetings.map((m) => (
              <div key={m.time} className="flex items-center gap-3 text-[11px]">
                <span className="shrink-0 w-14 font-mono text-foreground/40">{m.time}</span>
                <span className="text-foreground/60">{m.title}</span>
              </div>
            ))}
          </div>

          {/* Pending tasks */}
          <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/30 mb-1.5">Pending tasks</p>
          <div className="flex flex-col gap-1.5">
            {pendingTasks.map((task) => (
              <div key={task} className="flex items-start gap-2.5 text-[11px]">
                <div className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded border border-foreground/20" />
                <span className="text-foreground/50">{task}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI suggestion CTA */}
        <button className="w-full rounded-xl bg-[#73A7FF]/15 border border-[#73A7FF]/20 py-2.5 text-xs font-semibold text-[#73A7FF] transition-colors hover:bg-[#73A7FF]/25">
          Prepare for tomorrow
        </button>
      </div>
    </div>
  );
};

export default DailyRecapMockup;
