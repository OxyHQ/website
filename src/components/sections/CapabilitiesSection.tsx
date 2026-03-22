import { useState } from 'react'
import { capabilityTabs } from '../../data/content'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import DotPattern from '../ui/DotPattern'

function ChatMockup() {
  return (
    <div className="flex flex-col gap-4 px-6 py-8 max-lg:px-4 max-lg:py-6">
      {/* User message */}
      <div className="flex justify-end">
        <div className="mb-1 flex items-center rounded-xl bg-surface px-3.5 py-2">
          <span className="max-w-[17em] text-pretty text-sm text-primary-foreground">
            update this deal pls
          </span>
        </div>
      </div>

      {/* AI response sequence */}
      <div className="flex flex-col gap-2">
        {/* Record link */}
        <div className="flex h-5.5 items-center px-0.75 scroll-reveal">
          <div className="flex items-center gap-1.25">
            <div className="flex size-4 items-center justify-center rounded-[5px] border border-subtle-stroke bg-surface-subtle">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="1" y="1" width="3.5" height="3.5" rx="0.75" fill="var(--color-accent-foreground)" />
                <rect x="5.5" y="1" width="3.5" height="3.5" rx="0.75" fill="var(--color-accent-foreground)" opacity="0.5" />
                <rect x="1" y="5.5" width="3.5" height="3.5" rx="0.75" fill="var(--color-accent-foreground)" opacity="0.5" />
                <rect x="5.5" y="5.5" width="3.5" height="3.5" rx="0.75" fill="var(--color-accent-foreground)" opacity="0.3" />
              </svg>
            </div>
            <span className="text-sm font-medium text-primary-foreground underline decoration-subtle-stroke">
              Basepoint // Greenleaf
            </span>
          </div>
        </div>

        {/* Deal update card */}
        <div className="scroll-reveal" style={{ transitionDelay: '150ms' }}>
          <div className="flex flex-col rounded-xl bg-primary-background shadow-attio-product-e1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 px-3 pt-2.5 pb-0.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="var(--color-accent-foreground)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs text-accent-foreground">Update Deal Stage</span>
              </div>
              <div className="flex items-center px-2 pt-2">
                <div className="flex h-5 min-w-5 items-center gap-0.75 rounded-md bg-primary-background pr-1.5 pl-1 shadow-attio-product-e1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6l2.5 2.5 4.5-5" stroke="var(--color-blue-400)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="px-3 pb-2.5">
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-1.5 gap-y-1">
                <span className="text-xs text-accent-foreground">Stage</span>
                <span className="text-xs text-primary-foreground">Negotiation &rarr; Closed Won</span>
                <span className="text-xs text-accent-foreground">Value</span>
                <span className="text-xs text-primary-foreground">$128,000</span>
                <span className="text-xs text-accent-foreground">Close date</span>
                <span className="text-xs text-primary-foreground">Mar 22, 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification card */}
        <div className="scroll-reveal" style={{ transitionDelay: '300ms' }}>
          <div className="flex flex-col rounded-xl bg-primary-background shadow-attio-product-e1">
            <div className="flex items-center gap-1 px-3 pt-2.5 pb-0.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v4l2.5 1.5" stroke="var(--color-accent-foreground)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6" cy="6" r="4.5" stroke="var(--color-accent-foreground)" strokeWidth="1.2" />
              </svg>
              <span className="text-xs text-accent-foreground">Create Follow-up Task</span>
            </div>
            <div className="px-3 pb-2.5">
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-1.5 gap-y-1">
                <span className="text-xs text-accent-foreground">Task</span>
                <span className="text-xs text-primary-foreground">Send contract to legal</span>
                <span className="text-xs text-accent-foreground">Due</span>
                <span className="text-xs text-primary-foreground">Tomorrow, 9:00 AM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status message */}
        <div className="scroll-reveal" style={{ transitionDelay: '450ms' }}>
          <div className="flex items-center gap-1.5 px-1">
            <div className="flex size-4 items-center justify-center rounded-full bg-blue-500">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4l1.75 1.75 3.25-3.5" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xs text-accent-foreground">Deal updated and task created</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PipelineMockup() {
  const stages = [
    { name: 'Discovery', count: 4, color: 'var(--color-accent-foreground)' },
    { name: 'Proposal', count: 7, color: 'var(--color-blue-400)' },
    { name: 'Negotiation', count: 3, color: 'var(--color-blue-450)' },
    { name: 'Closed Won', count: 12, color: 'var(--color-blue-500)' },
  ]

  return (
    <div className="flex flex-col gap-3 px-6 py-8 max-lg:px-4 max-lg:py-6">
      {stages.map((stage, i) => (
        <div
          key={stage.name}
          className="scroll-reveal flex items-center justify-between rounded-xl bg-primary-background px-3.5 py-2.5 shadow-attio-product-e1"
          style={{ transitionDelay: `${i * 120}ms` }}
        >
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full" style={{ backgroundColor: stage.color }} />
            <span className="text-sm font-medium text-primary-foreground">{stage.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-accent-foreground">{stage.count} deals</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 3l3 3-3 3" stroke="var(--color-accent-foreground)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
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
      <div className="scroll-reveal rounded-xl bg-primary-background px-3.5 py-3 shadow-attio-product-e1">
        <div className="mb-2 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="var(--color-accent-foreground)" strokeWidth="1.2" />
            <path d="M1 5.5h12" stroke="var(--color-accent-foreground)" strokeWidth="1.2" />
            <path d="M4 1v2.5M10 1v2.5" stroke="var(--color-accent-foreground)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-medium text-primary-foreground">QBR - Greenleaf Inc.</span>
          <span className="ml-auto text-xs text-accent-foreground">Today, 2:00 PM</span>
        </div>
        <div className="grid grid-cols-[auto_1fr] items-start gap-x-1.5 gap-y-1">
          <span className="text-xs text-accent-foreground">Account</span>
          <span className="text-xs text-primary-foreground">Greenleaf Inc. &middot; Enterprise</span>
          <span className="text-xs text-accent-foreground">Health</span>
          <span className="text-xs text-primary-foreground">Good &middot; NPS 72</span>
        </div>
      </div>

      {/* Prep items */}
      <div className="scroll-reveal rounded-xl bg-primary-background px-3.5 py-3 shadow-attio-product-e1" style={{ transitionDelay: '150ms' }}>
        <span className="mb-1.5 block text-xs text-accent-foreground">Talking Points</span>
        <ul className="flex flex-col gap-1">
          <li className="flex items-start gap-1.5">
            <div className="mt-1.5 size-1 shrink-0 rounded-full bg-blue-400" />
            <span className="text-xs text-primary-foreground">Discuss Q1 usage increase (+34%)</span>
          </li>
          <li className="flex items-start gap-1.5">
            <div className="mt-1.5 size-1 shrink-0 rounded-full bg-blue-400" />
            <span className="text-xs text-primary-foreground">Review expansion to analytics tier</span>
          </li>
          <li className="flex items-start gap-1.5">
            <div className="mt-1.5 size-1 shrink-0 rounded-full bg-blue-400" />
            <span className="text-xs text-primary-foreground">Address open support tickets (2 pending)</span>
          </li>
        </ul>
      </div>

      {/* Recent activity */}
      <div className="scroll-reveal rounded-xl bg-primary-background px-3.5 py-3 shadow-attio-product-e1" style={{ transitionDelay: '300ms' }}>
        <span className="mb-1.5 block text-xs text-accent-foreground">Recent Activity</span>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary-foreground">Email: Renewal terms sent</span>
            <span className="text-xs text-accent-foreground">2d ago</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary-foreground">Call: Technical review</span>
            <span className="text-xs text-accent-foreground">5d ago</span>
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
      <div className="scroll-reveal rounded-xl bg-primary-background px-3.5 py-3 shadow-attio-product-e1">
        <div className="mb-2 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8.5 1.5C10.5 2 12 3.5 12.5 5.5M8.5 3.5C9.5 3.8 10.2 4.5 10.5 5.5" stroke="var(--color-blue-400)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M2 3.5C2 2.95 2.45 2.5 3 2.5h1.5l1 2.5-1.25.75a7.5 7.5 0 003.5 3.5L8.5 8l2.5 1v1.5c0 .55-.45 1-1 1A9.5 9.5 0 012 3.5z" stroke="var(--color-accent-foreground)" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          <span className="text-xs font-medium text-primary-foreground">Discovery Call - Acme Corp</span>
          <span className="ml-auto text-xs text-accent-foreground">32 min</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="size-1.5 rounded-full bg-blue-400" />
            <span className="text-xs text-accent-foreground">Transcribed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="size-1.5 rounded-full bg-blue-500" />
            <span className="text-xs text-accent-foreground">Analyzed</span>
          </div>
        </div>
      </div>

      {/* Key moments */}
      <div className="scroll-reveal rounded-xl bg-primary-background px-3.5 py-3 shadow-attio-product-e1" style={{ transitionDelay: '150ms' }}>
        <span className="mb-1.5 block text-xs text-accent-foreground">Key Moments</span>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-2">
            <span className="shrink-0 text-xs text-blue-400">4:12</span>
            <span className="text-xs text-primary-foreground">Budget confirmed: $150k-200k range</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="shrink-0 text-xs text-blue-400">12:30</span>
            <span className="text-xs text-primary-foreground">Blocker: need SSO integration by Q2</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="shrink-0 text-xs text-blue-400">28:45</span>
            <span className="text-xs text-primary-foreground">Next step: send proposal by Friday</span>
          </div>
        </div>
      </div>

      {/* Signals */}
      <div className="scroll-reveal rounded-xl bg-primary-background px-3.5 py-3 shadow-attio-product-e1" style={{ transitionDelay: '300ms' }}>
        <span className="mb-1.5 block text-xs text-accent-foreground">Buying Signals</span>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-xs text-primary-foreground">Budget confirmed</span>
          <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-xs text-primary-foreground">Decision maker present</span>
          <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-xs text-primary-foreground">Timeline: Q2</span>
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

export default function CapabilitiesSection() {
  const ref = useScrollReveal()
  const [activeTabIndex, setActiveTabIndex] = useState(0)

  const activeTab = capabilityTabs[activeTabIndex]
  const activePanel = activeTab.panels[0]

  return (
    <section className="bg-primary-background">
      <div className="container flex flex-1 flex-col">
        <div
          ref={ref}
          className="flex w-full flex-1 flex-col border-subtle-stroke border-x"
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
            {/* Mask fade edges for mobile scroll */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 lg:hidden"
              style={{ background: 'linear-gradient(to right, var(--color-primary-background), transparent)' }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 lg:hidden"
              style={{ background: 'linear-gradient(to left, var(--color-primary-background), transparent)' }}
            />

            <div className="flex items-center justify-center gap-1 overflow-x-auto px-4 pb-8 max-lg:justify-start max-lg:px-2">
              {capabilityTabs.map((tab, i) => (
                <button
                  key={tab.role}
                  role="tab"
                  aria-selected={i === activeTabIndex}
                  onClick={() => setActiveTabIndex(i)}
                  className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    i === activeTabIndex
                      ? 'bg-surface text-secondary-foreground'
                      : 'text-caption-foreground hover:text-secondary-foreground'
                  }`}
                >
                  {tab.role}
                </button>
              ))}
            </div>
          </div>

          {/* Split-panel card */}
          <div className="grid grid-cols-12 pb-10">
            <div
              className="relative col-[2/-2] max-lg:col-span-full flex w-full border border-subtle-stroke scroll-reveal"
              style={{ transitionDelay: '200ms' }}
            >
              {/* Left half — title + description */}
              <div className="relative w-1/2 bg-white-100 max-lg:hidden">
                {/* Vertical separator */}
                <div className="absolute top-0 right-0 bottom-0 w-px bg-subtle-stroke" />

                <div className="flex h-full flex-col justify-end p-10">
                  <h3 className="mb-3 font-display text-2xl font-semibold text-black-0">
                    {activePanel.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-black-600">
                    {activePanel.description}
                  </p>
                </div>
              </div>

              {/* Right half — product mockup */}
              <div className="relative flex w-1/2 overflow-hidden bg-secondary-background max-lg:w-full max-lg:aspect-square">
                <DotPattern id="capabilities-dots" />

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
