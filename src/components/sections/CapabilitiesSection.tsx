import { useState } from 'react'
import { capabilityTabs } from '../../data/content'
import { useScrollReveal } from '../../hooks/useScrollReveal'

function ChatMockup() {
  return (
    <div className="flex flex-col gap-4 px-6 py-8 max-lg:px-4 max-lg:py-6">
      {/* User message */}
      <div className="flex justify-end">
        <div className="mb-1 flex items-center rounded-xl bg-surface px-3.5 py-2">
          <span className="max-w-[17em] text-pretty text-sm text-foreground">
            update this deal pls
          </span>
        </div>
      </div>

      {/* AI response sequence */}
      <div className="flex flex-col gap-2">
        {/* Record link */}
        <div className="flex h-5.5 items-center px-0.75 scroll-reveal">
          <div className="flex items-center gap-1.25">
            <div className="flex size-4 items-center justify-center rounded-[5px] border border-border bg-surface">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="1" y="1" width="3.5" height="3.5" rx="0.75" fill="var(--color-muted-foreground)" />
                <rect x="5.5" y="1" width="3.5" height="3.5" rx="0.75" fill="var(--color-muted-foreground)" opacity="0.5" />
                <rect x="1" y="5.5" width="3.5" height="3.5" rx="0.75" fill="var(--color-muted-foreground)" opacity="0.5" />
                <rect x="5.5" y="5.5" width="3.5" height="3.5" rx="0.75" fill="var(--color-muted-foreground)" opacity="0.3" />
              </svg>
            </div>
            <span className="text-sm font-medium text-foreground underline decoration-border">
              Basepoint // Greenleaf
            </span>
          </div>
        </div>

        {/* Deal update card */}
        <div className="scroll-reveal" style={{ transitionDelay: '150ms' }}>
          <div className="flex flex-col rounded-xl bg-background shadow-attio-product-e1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 px-3 pt-2.5 pb-0.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="var(--color-muted-foreground)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs text-muted-foreground">Update Deal Stage</span>
              </div>
              <div className="flex items-center px-2 pt-2">
                <div className="flex h-5 min-w-5 items-center gap-0.75 rounded-md bg-background pr-1.5 pl-1 shadow-attio-product-e1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6l2.5 2.5 4.5-5" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="px-3 pb-2.5">
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-1.5 gap-y-1">
                <span className="text-xs text-muted-foreground">Stage</span>
                <span className="text-xs text-foreground">Negotiation &rarr; Closed Won</span>
                <span className="text-xs text-muted-foreground">Value</span>
                <span className="text-xs text-foreground">$128,000</span>
                <span className="text-xs text-muted-foreground">Close date</span>
                <span className="text-xs text-foreground">Mar 22, 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification card */}
        <div className="scroll-reveal" style={{ transitionDelay: '300ms' }}>
          <div className="flex flex-col rounded-xl bg-background shadow-attio-product-e1">
            <div className="flex items-center gap-1 px-3 pt-2.5 pb-0.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v4l2.5 1.5" stroke="var(--color-muted-foreground)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6" cy="6" r="4.5" stroke="var(--color-muted-foreground)" strokeWidth="1.2" />
              </svg>
              <span className="text-xs text-muted-foreground">Create Follow-up Task</span>
            </div>
            <div className="px-3 pb-2.5">
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-1.5 gap-y-1">
                <span className="text-xs text-muted-foreground">Task</span>
                <span className="text-xs text-foreground">Send contract to legal</span>
                <span className="text-xs text-muted-foreground">Due</span>
                <span className="text-xs text-foreground">Tomorrow, 9:00 AM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status message */}
        <div className="scroll-reveal" style={{ transitionDelay: '450ms' }}>
          <div className="flex items-center gap-1.5 px-1">
            <div className="flex size-4 items-center justify-center rounded-full bg-primary">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4l1.75 1.75 3.25-3.5" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xs text-muted-foreground">Deal updated and task created</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PipelineMockup() {
  const stages = [
    { name: 'Discovery', count: 4, color: 'var(--color-muted-foreground)' },
    { name: 'Proposal', count: 7, color: 'var(--color-primary)' },
    { name: 'Negotiation', count: 3, color: 'var(--color-primary)' },
    { name: 'Closed Won', count: 12, color: 'var(--color-primary)' },
  ]

  return (
    <div className="flex flex-col gap-3 px-6 py-8 max-lg:px-4 max-lg:py-6">
      {stages.map((stage, i) => (
        <div
          key={stage.name}
          className="scroll-reveal flex items-center justify-between rounded-xl bg-background px-3.5 py-2.5 shadow-attio-product-e1"
          style={{ transitionDelay: `${i * 120}ms` }}
        >
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full" style={{ backgroundColor: stage.color }} />
            <span className="text-sm font-medium text-foreground">{stage.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{stage.count} deals</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 3l3 3-3 3" stroke="var(--color-muted-foreground)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
}

function MeetingMockup() {
  return (
    <div className="flex flex-col gap-3 px-6 py-8 max-lg:px-4 max-lg:py-6">
      {/* Meeting header */}
      <div className="scroll-reveal rounded-xl bg-background px-3.5 py-3 shadow-attio-product-e1">
        <div className="mb-2 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="var(--color-muted-foreground)" strokeWidth="1.2" />
            <path d="M1 5.5h12" stroke="var(--color-muted-foreground)" strokeWidth="1.2" />
            <path d="M4 1v2.5M10 1v2.5" stroke="var(--color-muted-foreground)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-medium text-foreground">QBR - Greenleaf Inc.</span>
          <span className="ml-auto text-xs text-muted-foreground">Today, 2:00 PM</span>
        </div>
        <div className="grid grid-cols-[auto_1fr] items-start gap-x-1.5 gap-y-1">
          <span className="text-xs text-muted-foreground">Account</span>
          <span className="text-xs text-foreground">Greenleaf Inc. &middot; Enterprise</span>
          <span className="text-xs text-muted-foreground">Health</span>
          <span className="text-xs text-foreground">Good &middot; NPS 72</span>
        </div>
      </div>

      {/* Prep items */}
      <div className="scroll-reveal rounded-xl bg-background px-3.5 py-3 shadow-attio-product-e1" style={{ transitionDelay: '150ms' }}>
        <span className="mb-1.5 block text-xs text-muted-foreground">Talking Points</span>
        <ul className="flex flex-col gap-1">
          <li className="flex items-start gap-1.5">
            <div className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
            <span className="text-xs text-foreground">Discuss Q1 usage increase (+34%)</span>
          </li>
          <li className="flex items-start gap-1.5">
            <div className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
            <span className="text-xs text-foreground">Review expansion to analytics tier</span>
          </li>
          <li className="flex items-start gap-1.5">
            <div className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
            <span className="text-xs text-foreground">Address open support tickets (2 pending)</span>
          </li>
        </ul>
      </div>

      {/* Recent activity */}
      <div className="scroll-reveal rounded-xl bg-background px-3.5 py-3 shadow-attio-product-e1" style={{ transitionDelay: '300ms' }}>
        <span className="mb-1.5 block text-xs text-muted-foreground">Recent Activity</span>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground">Email: Renewal terms sent</span>
            <span className="text-xs text-muted-foreground">2d ago</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground">Call: Technical review</span>
            <span className="text-xs text-muted-foreground">5d ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CallMockup() {
  return (
    <div className="flex flex-col gap-3 px-6 py-8 max-lg:px-4 max-lg:py-6">
      {/* Call header */}
      <div className="scroll-reveal rounded-xl bg-background px-3.5 py-3 shadow-attio-product-e1">
        <div className="mb-2 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8.5 1.5C10.5 2 12 3.5 12.5 5.5M8.5 3.5C9.5 3.8 10.2 4.5 10.5 5.5" stroke="var(--color-primary)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M2 3.5C2 2.95 2.45 2.5 3 2.5h1.5l1 2.5-1.25.75a7.5 7.5 0 003.5 3.5L8.5 8l2.5 1v1.5c0 .55-.45 1-1 1A9.5 9.5 0 012 3.5z" stroke="var(--color-muted-foreground)" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          <span className="text-xs font-medium text-foreground">Discovery Call - Acme Corp</span>
          <span className="ml-auto text-xs text-muted-foreground">32 min</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="size-1.5 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Transcribed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="size-1.5 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Analyzed</span>
          </div>
        </div>
      </div>

      {/* Key moments */}
      <div className="scroll-reveal rounded-xl bg-background px-3.5 py-3 shadow-attio-product-e1" style={{ transitionDelay: '150ms' }}>
        <span className="mb-1.5 block text-xs text-muted-foreground">Key Moments</span>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-2">
            <span className="shrink-0 text-xs text-primary">4:12</span>
            <span className="text-xs text-foreground">Budget confirmed: $150k-200k range</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="shrink-0 text-xs text-primary">12:30</span>
            <span className="text-xs text-foreground">Blocker: need SSO integration by Q2</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="shrink-0 text-xs text-primary">28:45</span>
            <span className="text-xs text-foreground">Next step: send proposal by Friday</span>
          </div>
        </div>
      </div>

      {/* Signals */}
      <div className="scroll-reveal rounded-xl bg-background px-3.5 py-3 shadow-attio-product-e1" style={{ transitionDelay: '300ms' }}>
        <span className="mb-1.5 block text-xs text-muted-foreground">Buying Signals</span>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md bg-surface px-2 py-0.5 text-xs text-foreground">Budget confirmed</span>
          <span className="rounded-md bg-surface px-2 py-0.5 text-xs text-foreground">Decision maker present</span>
          <span className="rounded-md bg-surface px-2 py-0.5 text-xs text-foreground">Timeline: Q2</span>
        </div>
      </div>
    </div>
  )
}

function ProductMockup({ mockupType }: { mockupType: 'chat' | 'pipeline' | 'meeting' | 'call' }) {
  switch (mockupType) {
    case 'chat':
      return <ChatMockup />
    case 'pipeline':
      return <PipelineMockup />
    case 'meeting':
      return <MeetingMockup />
    case 'call':
      return <CallMockup />
  }
}

function TickMarks() {
  const ticks = Array.from({ length: 30 })
  return (
    <div className="mask-x-from-96% relative flex w-full justify-center overflow-hidden">
      <div className="flex min-w-[200vw] max-w-[200vw] items-end justify-center gap-3">
        {ticks.map((_, i) => (
          <svg key={i} width="1" height="100%" className="text-border h-2 shrink-0">
            <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeLinecap="round" />
          </svg>
        ))}
      </div>
    </div>
  )
}

export default function CapabilitiesSection() {
  const ref = useScrollReveal()
  const [activeTabIndex, setActiveTabIndex] = useState(0)

  const activeTab = capabilityTabs[activeTabIndex]
  const activePanel = activeTab.panels[0]

  return (
    <section className="bg-background">
      <div className="container flex flex-1 flex-col">
        <div
          ref={ref}
          className="flex w-full flex-1 flex-col border-border border-x"
        >
          {/* Header */}
          <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center">
            <div className="max-w-[20em] text-pretty text-heading-responsive-sm text-center col-[2/-2] mix-blend-multiply dark:mix-blend-screen">
              <h2 className="text-pretty inline">
                Simply powerful customer intelligence.
              </h2>
            </div>
          </header>

          {/* Tab navigation */}
          <div className="relative scroll-reveal" style={{ transitionDelay: '100ms' }}>
            <div className="mask-x-from-80% relative flex w-full justify-center overflow-hidden">
              <div className="flex cursor-grab items-center justify-center gap-8 active:cursor-grabbing">
                {capabilityTabs.map((tab, i) => (
                  <button
                    key={tab.role}
                    role="tab"
                    aria-selected={i === activeTabIndex}
                    onClick={() => setActiveTabIndex(i)}
                    className={`shrink-0 cursor-pointer select-none whitespace-nowrap pb-4 text-center text-sm transition-colors duration-300 ${
                      i === activeTabIndex ? 'text-secondary' : 'text-muted-foreground'
                    }`}
                  >
                    {tab.role}
                  </button>
                ))}
              </div>
            </div>

            {/* Tick marks */}
            <TickMarks />
          </div>

          {/* Split-panel card */}
          <div className="grid grid-cols-12 pb-10">
            <div
              className="relative col-[2/-2] max-lg:col-span-full flex w-full border border-border max-lg:aspect-video max-lg:border-x-0 max-md:aspect-5/4 max-lg:aspect-square! scroll-reveal"
              style={{ transitionDelay: '200ms' }}
            >
              {/* Left half — title + description */}
              <div className="relative my-px bg-background w-1/2 max-lg:hidden">
                {/* Vertical separator SVG */}
                <svg width="1" height="100%" className="text-border absolute inset-y-0 right-0">
                  <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeLinecap="round" />
                </svg>

                <div className="absolute top-12 left-10 flex items-center gap-2 max-xl:top-12 max-xl:left-7.5" style={{ filter: 'blur(0px)', opacity: 1, transform: 'none' }}>
                  <div className="flex flex-col gap-3">
                    <h3 className="max-w-[20em] text-balance pr-6 font-display font-semibold text-2xl">
                      {activePanel.title}
                    </h3>
                  </div>
                </div>

                <div className="absolute inset-x-10 bottom-10 max-xl:inset-x-7.5 max-xl:bottom-7.5">
                  <div className="absolute bottom-0 flex max-w-sm flex-col text-balance text-muted-foreground" style={{ filter: 'blur(0px)', opacity: 1, transform: 'none' }}>
                    <p className="text-balance pr-6 text-muted-foreground text-sm">
                      {activePanel.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right half — product mockup */}
              <div className="relative flex overflow-hidden bg-surface max-lg:aspect-video max-lg:w-full max-lg:justify-center max-md:aspect-square aspect-square! aspect-square w-1/2">
                <svg width="100%" height="100%" className="text-muted mask-[radial-gradient(circle,transparent_00%,black_100%)] absolute inset-0">
                  <defs>
                    <pattern id="capabilities-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                      <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#capabilities-dots)" />
                </svg>

                <div className="relative z-10 flex w-full flex-col justify-center">
                  <ProductMockup mockupType={activePanel.mockupType} />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom spacing */}
          <div className="h-20 max-lg:h-12" />
        </div>
      </div>
    </section>
  )
}
