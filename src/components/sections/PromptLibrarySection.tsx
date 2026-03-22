import { promptLibraryCards } from '../../data/content'
import type { PromptLibraryCard } from '../../data/content'

function getIcon(iconType: PromptLibraryCard['iconType']) {
  const props = { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none' as const, stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (iconType) {
    case 'calendar':
      return <svg {...props}><rect x="3" y="4" width="14" height="13" rx="2" /><path d="M3 8h14M7 2v4M13 2v4" /></svg>
    case 'briefcase':
      return <svg {...props}><rect x="2" y="6" width="16" height="11" rx="2" /><path d="M7 6V4a2 2 0 012-2h2a2 2 0 012 2v2M2 10h16" /></svg>
    case 'phone':
      return <svg {...props}><path d="M5 3h3l2 4-2.5 1.5A11 11 0 0011.5 12.5L13 10l4 2v3a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z" /></svg>
    case 'mail':
      return <svg {...props}><rect x="2" y="4" width="16" height="12" rx="2" /><path d="M2 6l8 5 8-5" /></svg>
    case 'chart':
      return <svg {...props}><path d="M3 17V10M8 17V7M13 17V3M18 17v-7" /></svg>
    case 'sparkle':
      return <svg {...props}><path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2zM15 12l.75 2.25L18 15l-2.25.75L15 18l-.75-2.25L12 15l2.25-.75L15 12z" /></svg>
    case 'search':
      return <svg {...props}><circle cx="8.5" cy="8.5" r="5.5" /><path d="M13 13l4 4" /></svg>
    case 'users':
      return <svg {...props}><circle cx="7" cy="6" r="3" /><path d="M2 17a5 5 0 0110 0" /><circle cx="14" cy="7" r="2.5" /><path d="M18 17a4 4 0 00-6-3.5" /></svg>
  }
}

function PromptCard({ card }: { card: PromptLibraryCard }) {
  return (
    <div className="w-64 shrink-0 rounded-xl border border-subtle-stroke/5 backdrop-blur-xs">
      <div className="flex flex-col overflow-hidden rounded-[calc(12px-1px)] bg-white-100 shadow-attio-4">
        <div className="flex flex-col gap-2 p-3">
          <div className="size-5 text-[#505155]">{getIcon(card.iconType)}</div>
          <div className="flex h-13 flex-col gap-0.5 pr-9">
            <p className="truncate font-medium text-[#242629] text-sm leading-5 tracking-[-0.14px]">{card.title}</p>
            <p className="line-clamp-2 text-[rgba(0,0,0,0.4)] text-xs leading-4">{card.description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1.5">
            <div className="relative size-4 overflow-hidden rounded-[30%] border border-[rgba(0,0,0,0.05)] bg-blue-500 flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">O</span>
            </div>
            <span className="font-medium text-[#505155] text-xs leading-4">Oxy</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PromptLibrarySection() {
  const row1 = promptLibraryCards.slice(0, 6)
  const row2 = promptLibraryCards.slice(6, 12)
  const row3 = [...promptLibraryCards.slice(3, 6), ...promptLibraryCards.slice(0, 3)]

  return (
    <section>
      <div className="container flex flex-1 flex-col">
        <div className="flex w-full flex-1 flex-col border-subtle-stroke border-x">
          <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center">
            <div className="col-[2/-2] max-w-lg text-center">
              <h2 className="text-pretty text-heading-responsive-md">From one expert to everyone.</h2>
              <p className="text-pretty text-tertiary text-xl">Best practice becomes standard practice with the prompt library.</p>
            </div>
          </header>
        </div>
      </div>

      <div className="flex flex-col items-center overflow-hidden py-16 relative">
        <div className="flex flex-col gap-y-5 max-lg:scale-80 max-md:scale-70">
          {/* Row 1: scrolls left */}
          <div className="relative overflow-hidden">
            <div className="flex w-max animate-marquee-left gap-6">
              {row1.map((card, i) => <PromptCard key={`a-${i}`} card={card} />)}
              {row1.map((card, i) => <PromptCard key={`b-${i}`} card={card} />)}
            </div>
          </div>

          {/* Row 2: scrolls right */}
          <div className="relative overflow-hidden">
            <div className="flex w-max animate-marquee-right gap-6">
              {row2.map((card, i) => <PromptCard key={`a-${i}`} card={card} />)}
              {row2.map((card, i) => <PromptCard key={`b-${i}`} card={card} />)}
            </div>
          </div>

          {/* Row 3: scrolls left */}
          <div className="relative overflow-hidden">
            <div className="flex w-max animate-marquee-left gap-6">
              {row3.map((card, i) => <PromptCard key={`a-${i}`} card={card} />)}
              {row3.map((card, i) => <PromptCard key={`b-${i}`} card={card} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
