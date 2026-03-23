const MorningBriefingMockup = () => {
  return (
    <div className="flex h-full flex-col bg-[#1a1a1c] border border-foreground/10 rounded-2xl overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-foreground/10">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-foreground/20" />
          <div className="size-2.5 rounded-full bg-foreground/20" />
          <div className="size-2.5 rounded-full bg-foreground/20" />
        </div>
        <span className="ml-2 text-xs font-medium text-foreground/50">
          Morning Briefing
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {/* Greeting */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Good morning, Sarah{" "}
            <span role="img" aria-label="wave">
              👋
            </span>
          </h2>
          <p className="mt-0.5 text-sm text-foreground/50">
            Monday, March 24
          </p>
        </div>

        {/* Emails card */}
        <div className="bg-foreground/5 rounded-xl p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <svg
              className="size-4 text-foreground/50"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 4.5L8 8.5L14 4.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="1.5"
                y="3"
                width="13"
                height="10"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
            <span className="text-sm font-medium text-foreground">
              5 new emails
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              {
                sender: "Alex Chen",
                subject: "Q1 revenue report — final numbers",
              },
              {
                sender: "Maya Johnson",
                subject: "Updated brand guidelines attached",
              },
              {
                sender: "Jordan Lee",
                subject: "Re: Product launch timeline",
              },
            ].map((email) => (
              <div
                key={email.sender}
                className="flex items-baseline gap-2 text-xs"
              >
                <span className="shrink-0 font-medium text-foreground/70">
                  {email.sender}
                </span>
                <span className="truncate text-foreground/40">
                  {email.subject}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Meetings card */}
        <div className="bg-foreground/5 rounded-xl p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <svg
              className="size-4 text-foreground/50"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="2"
                y="3"
                width="12"
                height="11"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M2 6.5H14"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M5.5 2V4"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M10.5 2V4"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-sm font-medium text-foreground">
              3 meetings today
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { time: "10:00 AM", title: "Design team sync" },
              { time: "1:00 PM", title: "Product roadmap review" },
              { time: "3:30 PM", title: "1:1 with Jamie" },
            ].map((meeting) => (
              <div
                key={meeting.time}
                className="flex items-center gap-3 text-xs"
              >
                <span className="shrink-0 w-16 font-mono text-foreground/40">
                  {meeting.time}
                </span>
                <span className="text-foreground/70">{meeting.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action items card */}
        <div className="bg-foreground/5 rounded-xl p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <svg
              className="size-4 text-foreground/50"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 8L6.5 11.5L13 4.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-medium text-foreground">
              2 action items
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              "Review and sign off on Q1 marketing budget",
              "Send feedback on new onboarding flow",
            ].map((item) => (
              <label
                key={item}
                className="flex items-start gap-2.5 text-xs cursor-pointer"
              >
                <div className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded border border-foreground/20">
                  {/* empty checkbox */}
                </div>
                <span className="text-foreground/70">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* AI suggestion */}
        <div className="bg-[#73A7FF]/10 border-l-2 border-[#73A7FF] rounded-r-xl p-4">
          <p className="text-xs leading-relaxed text-foreground/70">
            <span className="font-medium text-[#73A7FF]">AI Suggestion</span>
            {" — "}
            Based on your 10am meeting with Design team, I've prepared a
            summary of last week's design review notes.
          </p>
        </div>

        {/* Quick actions bar */}
        <div className="flex flex-wrap gap-2">
          {["Draft reply", "Prep for meeting", "Review tasks"].map(
            (action) => (
              <button
                key={action}
                className="bg-foreground/5 rounded-full px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-foreground/10"
              >
                {action}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MorningBriefingMockup;
