import { useState } from 'react'
import { aiHero, aiDemoTabs, aiFeatureCards } from '../../data/ai'

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 12 12" fill="currentColor" className={className}>
      <g fill="currentColor">
        <path d="m11.526,5.803l-3.102-1.227-1.227-3.102c-.113-.286-.39-.474-.697-.474s-.584.188-.697.474l-1.227,3.102-3.102,1.227c-.286.113-.474.39-.474.697s.188.584.474.697l3.102,1.227,1.227,3.102c.113.286.39.474.697.474s.584-.188.697-.474l1.227-3.102,3.102-1.227c.286-.113.474-.39.474-.697s-.188-.584-.474-.697Z" strokeWidth="0" />
        <path d="m3.492,1.492l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316.947-.946.315c-.153.051-.257.194-.257.356s.104.305.257.356l.946.315.316.947c.051.153.194.256.355.256s.305-.104.355-.256l.316-.947.946-.315c.153-.051.257-.194.257-.356s-.104-.305-.257-.356h0Z" fill="currentColor" strokeWidth="0" />
      </g>
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 14 14" fill="none" className={className}>
      <g clipPath="url(#clip-clock)">
        <path d="M7.00005 13.2218C10.4365 13.2218 13.2223 10.436 13.2223 6.99957C13.2223 3.56313 10.4365 0.777344 7.00005 0.777344C3.56362 0.777344 0.777832 3.56313 0.777832 6.99957C0.777832 10.436 3.56362 13.2218 7.00005 13.2218Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 3.76562V7.00118L9.73778 8.7434" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip-clock">
          <rect width="14" height="14" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" className={className}>
      <g fill="currentColor">
        <path d="M5.707,14.875c.094,.018,.191,.025,.385,.039,.403,.051,.787-.234,.842-.645s-.234-.788-.645-.842c-.067-.009-.136-.014-.204-.018-.035-.002-.069-.002-.101-.008-.605-.115-1.188-.332-1.729-.645-.244-.141-.547-.132-.783,.021-.273,.178-.763,.384-1.295,.531,.333-.887,.424-1.888,.062-2.568-.483-.836-.738-1.785-.738-2.742C1.5,4.966,3.967,2.5,6.998,2.5c1.933,0,3.689,.993,4.698,2.656,.215,.353,.675,.466,1.03,.252,.354-.215,.468-.676,.253-1.03-1.284-2.115-3.52-3.377-5.981-3.377C3.14,1,0,4.139,0,7.998c0,1.221,.325,2.428,.927,3.47,.167,.314-.065,1.605-.707,2.248-.209,.209-.276,.522-.17,.798,.105,.276,.364,.465,.659,.481,.073,.004,.146,.006,.222,.006,.992,0,2.162-.337,2.958-.738,.577,.288,1.187,.494,1.818,.613Z" />
        <path d="M17.295,14.367c.461-.797,.705-1.704,.705-2.621,0-2.895-2.355-5.25-5.25-5.25s-5.251,2.355-5.251,5.25,2.355,5.25,5.251,5.25c.325,0,.651-.03,.97-.091,.438-.083,.864-.222,1.27-.414,.597,.281,1.425,.508,2.135,.508,.057,0,.112-.001,.166-.004,.296-.016,.555-.205,.66-.481,.106-.276,.039-.589-.17-.798-.376-.376-.547-1.168-.485-1.349Z" />
      </g>
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <g clipPath="url(#clip-shield)">
        <path d="M9.52793 7.00347C9.20593 7.00347 8.94459 6.74214 8.94459 6.42014V3.89236C8.94459 2.82058 8.07193 1.94792 7.00015 1.94792C5.92837 1.94792 5.0557 2.82058 5.0557 3.89236V6.42014C5.0557 6.74214 4.79437 7.00347 4.47237 7.00347C4.15037 7.00347 3.88904 6.74214 3.88904 6.42014V3.89236C3.88904 2.17658 5.28437 0.78125 7.00015 0.78125C8.71593 0.78125 10.1113 2.17658 10.1113 3.89236V6.42014C10.1113 6.74214 9.84993 7.00347 9.52793 7.00347Z" fill="currentColor" />
        <path d="M9.9168 5.83594H4.08347C2.90358 5.83594 1.94458 6.79494 1.94458 7.97483V11.0859C1.94458 12.2658 2.90358 13.2248 4.08347 13.2248H9.9168C11.0967 13.2248 12.0557 12.2658 12.0557 11.0859V7.97483C12.0557 6.79494 11.0967 5.83594 9.9168 5.83594ZM7.58347 9.91927C7.58347 10.2413 7.32214 10.5026 7.00014 10.5026C6.67814 10.5026 6.4168 10.2413 6.4168 9.91927V9.14149C6.4168 8.81949 6.67814 8.55816 7.00014 8.55816C7.32214 8.55816 7.58347 8.81949 7.58347 9.14149V9.91927Z" fill="currentColor" />
      </g>
      <defs>
        <clipPath id="clip-shield">
          <rect width="14" height="14" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  sparkle: SparkleIcon,
  clock: ClockIcon,
  chat: ChatIcon,
  shield: ShieldIcon,
}

export default function AIPage() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="bg-[#0a0a0a] text-foreground">
      {/* ── 1. Hero — Split Layout ── */}
      <div className="relative z-0 mx-auto flex min-h-screen w-full max-w-[100rem] flex-col overflow-clip lg:flex-row">
        {/* Left sticky panel */}
        <div className="relative overflow-hidden lg:sticky lg:inset-0 lg:z-40 lg:flex lg:max-h-screen lg:max-w-[32rem] mt-12 shrink-0 max-lg:snap-start lg:mt-0 lg:min-h-0 lg:border-r border-border">
          <div className="relative flex w-full lg:min-w-[32rem] lg:overflow-y-auto lg:pl-6">
            <div className="mx-auto max-w-lg lg:mx-0 lg:flex lg:w-[32rem] lg:max-w-none lg:flex-col px-8 sm:px-0 lg:px-4">
              <div className="pb-8 pt-16 lg:flex lg:h-full lg:flex-col lg:pr-10">
                {/* Badge */}
                <h6 className="text-base text-foreground">{aiHero.badge}</h6>

                {/* Title */}
                <h1 className="mt-4 max-w-80 text-4xl font-medium text-foreground sm:max-w-none sm:text-5xl">
                  {aiHero.title}
                </h1>

                {/* Feature list with icons */}
                <div className="mt-6 flex flex-col gap-3">
                  {aiHero.features.map((f) => {
                    const Icon = iconMap[f.icon] ?? SparkleIcon
                    return (
                      <div key={f.text} className="flex items-start gap-2">
                        <Icon className="mt-0.5 size-4 shrink-0 text-foreground" />
                        <p className="text-sm text-foreground">{f.text}</p>
                      </div>
                    )
                  })}
                </div>

                {/* CTA buttons */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
                    href="#"
                  >
                    Get started free &rarr;
                  </a>
                  <a
                    className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
                    href="#"
                  >
                    Watch demo
                  </a>
                </div>

                {/* Demo navigation tabs (desktop only) */}
                <div className="mt-auto max-lg:hidden">
                  <h6 className="mb-4 text-lg font-bold text-foreground">
                    What Oxy AI handles for you
                  </h6>
                  <ul className="flex flex-col items-start">
                    {aiDemoTabs.map((tab, i) => (
                      <li key={tab.label} className="w-full">
                        <button
                          type="button"
                          onClick={() => setActiveTab(i)}
                          className={`flex w-full items-center justify-between rounded-[10px] p-2 text-base transition-colors ${
                            activeTab === i
                              ? 'bg-secondary'
                              : 'hover:bg-secondary/50'
                          }`}
                        >
                          <div className="flex items-center">
                            {activeTab === i && (
                              <div className="mr-1.5 h-5 w-[3px] rounded-[2px] bg-[var(--color-blue-500)]" />
                            )}
                            {tab.label}
                          </div>
                          <span className="font-medium text-muted-foreground">
                            {tab.number}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right content area */}
        <div className="relative flex-1 overflow-hidden">
          {/* Product demo placeholder */}
          <div className="flex min-h-screen items-center justify-center bg-secondary p-8">
            <div className="w-full max-w-2xl rounded-2xl bg-background border border-border p-6 shadow-xl">
              <div className="text-center text-muted-foreground">
                Product demo preview
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. "Your smartest coworker starts today" CTA ── */}
      <section className="flex flex-col items-center px-6 py-20 text-center md:py-32">
        <h5 className="text-xs uppercase tracking-widest text-muted-foreground">
          Get Started
        </h5>
        <h2 className="mt-3 text-[40px] font-medium text-foreground sm:text-[50px] sm:leading-[56px]">
          Your smartest coworker starts today.
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Connect your tools. Oxy AI starts working in under a minute.
        </p>
        <a
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-lg font-medium text-foreground transition hover:bg-secondary"
          href="#"
        >
          Get started today &rarr;
        </a>
        {/* CTA background image placeholder */}
        <div className="relative mt-8 w-full max-w-4xl">
          <div className="aspect-[2772/962] rounded-2xl bg-gradient-to-b from-secondary to-background" />
        </div>
      </section>

      {/* ── 3. "Built for real work" — Horizontal Scroll Feature Cards ── */}
      <section className="py-12 md:py-14" id="features">
        <div className="flex flex-col md:flex-row">
          {/* Left: heading */}
          <div className="shrink-0 px-6 pb-8 md:w-80 md:px-14 md:pb-0">
            <h2 className="text-5xl font-medium text-foreground">
              Built for real work.
            </h2>
            <a
              className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground"
              href="#"
            >
              Get Started &rarr;
            </a>
          </div>

          {/* Right: horizontal scroll cards */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex w-full items-center gap-4 px-4 sm:px-6 md:px-0">
              {aiFeatureCards.map((card) => (
                <div
                  key={card.title}
                  className={`relative shrink-0 overflow-hidden p-8 h-[520px] w-96 rounded-[32px] flex flex-col gap-1 bg-gradient-to-b ${card.gradient}`}
                >
                  <p className="max-w-36 text-sm font-semibold leading-4 text-foreground">
                    {card.title}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {card.description}
                  </p>
                  <div className="mt-auto flex h-64 items-center justify-center rounded-2xl bg-background/50 text-muted-foreground text-xs">
                    Feature preview
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
