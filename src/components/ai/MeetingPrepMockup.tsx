const attendees = [
  { initials: "SC", name: "Sarah C." },
  { initials: "JL", name: "Jordan L." },
  { initials: "MP", name: "Maya P." },
  { initials: "AK", name: "Alex K." },
];

const actionItems = [
  "Finalize color palette for mobile app",
  "Share updated wireframes with engineering",
  "Review accessibility audit results",
];

const talkingPoints = [
  "Mobile nav redesign is ahead of schedule — demo ready for stakeholders",
  "Accessibility score improved from 72 to 91 after last sprint",
  "Design system tokens need alignment with new brand colors",
];

const MeetingPrepMockup = () => {
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
          <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2 6.5H14" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.5 2V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M10.5 2V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span className="text-xs font-medium text-foreground/50">Meeting Prep</span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {/* Next meeting card */}
        <div className="bg-foreground/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Design Review</h3>
              <p className="text-xs text-foreground/50 mt-0.5">in 25 minutes</p>
            </div>
            <span className="rounded-full bg-[#73A7FF]/15 px-2 py-0.5 text-[10px] font-medium text-[#73A7FF]">
              Prepared by Oxy AI
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {attendees.map((a) => (
              <div key={a.initials} className="flex size-7 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold text-foreground/60" title={a.name}>
                {a.initials}
              </div>
            ))}
            <span className="ml-1.5 text-[11px] text-foreground/40">
              {attendees.map((a) => a.name).join(", ")}
            </span>
          </div>
        </div>

        {/* Previous meeting notes */}
        <div className="bg-foreground/5 rounded-xl p-4">
          <h4 className="text-xs font-medium text-foreground mb-2">Previous meeting notes</h4>
          <p className="text-[11px] leading-relaxed text-foreground/50">
            Reviewed mobile nav prototypes. Agreed to simplify to 4 primary tabs. Jordan to lead usability testing by Friday. Design system tokens discussion deferred to next session.
          </p>
        </div>

        {/* Related Slack threads */}
        <div className="bg-foreground/5 rounded-xl p-4">
          <h4 className="text-xs font-medium text-foreground mb-2">Related Slack threads</h4>
          <div className="flex flex-col gap-1.5">
            {["#design — Mobile nav: updated interaction patterns", "#product — Accessibility audit follow-up items"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-[11px] text-foreground/50">
                <span className="text-foreground/30">#</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Open action items */}
        <div className="bg-foreground/5 rounded-xl p-4">
          <h4 className="text-xs font-medium text-foreground mb-2">Open action items</h4>
          <div className="flex flex-col gap-2">
            {actionItems.map((item) => (
              <label key={item} className="flex items-start gap-2.5 text-[11px] cursor-pointer">
                <div className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded border border-foreground/20" />
                <span className="text-foreground/60">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Key talking points */}
        <div className="bg-[#73A7FF]/10 border-l-2 border-[#73A7FF] rounded-r-xl p-4">
          <h4 className="text-xs font-medium text-[#73A7FF] mb-2">Key talking points</h4>
          <div className="flex flex-col gap-2">
            {talkingPoints.map((point) => (
              <div key={point} className="flex items-start gap-2 text-[11px] text-foreground/60">
                <span className="mt-0.5 text-[#73A7FF]">•</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Join meeting button */}
        <button className="w-full rounded-xl bg-[#73A7FF] py-2.5 text-xs font-semibold text-[#1a1a1c] transition-opacity hover:opacity-90">
          Join meeting
        </button>
      </div>
    </div>
  );
};

export default MeetingPrepMockup;
