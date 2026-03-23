const tasks = [
  { title: "Review PR #482 — auth refactor", source: "from: GitHub", done: true },
  { title: "Reply to Lisa's budget question", source: "from: Email", done: true },
  { title: "Update Q1 roadmap slide deck", source: "from: Meeting", done: true },
  { title: "Schedule 1:1 with new designer", source: "from: Slack", done: false },
  { title: "Write post-mortem for Friday's outage", source: "from: Incident", done: false },
  { title: "Submit expense report", source: "from: Calendar", done: false },
];

const aiTasks = [
  { title: "Prep talking points for 3 PM investor call", source: "from: Calendar + Email" },
  { title: "Follow up with Acme Corp on partnership terms", source: "from: Email thread" },
];

const completed = tasks.filter((t) => t.done).length;
const total = tasks.length + aiTasks.length;

const ActionPlanMockup = () => {
  return (
    <div className="flex h-full flex-col bg-[#1a1a1c] border border-foreground/10 rounded-2xl overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-foreground/10">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-foreground/20" />
          <div className="size-2.5 rounded-full bg-foreground/20" />
          <div className="size-2.5 rounded-full bg-foreground/20" />
        </div>
        <span className="ml-2 text-xs font-medium text-foreground/50">Action Plan</span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <svg className="size-5 text-foreground/50" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 className="text-lg font-semibold text-foreground">Action Plan</h2>
          </div>
          <p className="mt-0.5 text-sm text-foreground/50">Today's priorities</p>
        </div>

        {/* Task list */}
        <div className="bg-foreground/5 rounded-xl p-4 flex flex-col gap-3">
          {tasks.map((task) => (
            <div key={task.title} className="flex items-start gap-2.5">
              <div className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border ${task.done ? "bg-[#73A7FF] border-[#73A7FF]" : "border-foreground/20"}`}>
                {task.done && (
                  <svg className="size-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.5 7.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${task.done ? "text-foreground/40 line-through" : "text-foreground/70"}`}>{task.title}</p>
                <span className="text-[10px] text-foreground/30">{task.source}</span>
              </div>
            </div>
          ))}
        </div>

        {/* AI suggested tasks */}
        <div className="bg-[#73A7FF]/10 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-[#73A7FF]" />
            <span className="text-[11px] font-medium text-[#73A7FF]">Suggested by AI</span>
          </div>
          {aiTasks.map((task) => (
            <div key={task.title} className="flex items-start gap-2.5">
              <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-[#73A7FF]/40" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/70">{task.title}</p>
                <span className="text-[10px] text-[#73A7FF]/50">{task.source}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="bg-foreground/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-foreground/50">{completed} of {total} tasks completed</span>
            <span className="text-xs font-medium text-foreground/70">{Math.round((completed / total) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-[#73A7FF]" style={{ width: `${(completed / total) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionPlanMockup;
