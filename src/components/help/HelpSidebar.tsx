import { useState } from 'react'
import { helpCategories } from '../../data/help'

export default function HelpSidebar() {
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  return (
    <aside className="sticky top-[var(--site-header-height)] hidden h-[calc(100vh-var(--site-header-height))] w-full flex-col border-r border-subtle-stroke lg:flex">
      {/* Search button */}
      <div className="border-b border-subtle-stroke px-6 py-4">
        <button className="flex w-full items-center gap-2 rounded-[10px] border border-subtle-stroke px-3 py-2 text-sm text-accent-foreground transition-colors hover:border-default-stroke">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent-foreground">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m15.8 15.8-3.62-3.62M1.8 7.833a6.034 6.034 0 1 1 12.069 0 6.034 6.034 0 0 1-12.07 0Z" />
          </svg>
          <div className="flex w-full items-center justify-between gap-2">
            <span className="text-accent-foreground">Search help</span>
            <div className="flex gap-1">
              <div className="pointer-events-none flex min-h-[22px] min-w-[22px] items-center justify-center rounded-md border-subtle-stroke border-x border-t border-b-2 bg-primary-background px-1 pt-[3px] pb-0.5 text-accent-foreground text-xs leading-3 shadow-[0px_1px_0px_1px_#E4E7EC]">⌘</div>
              <div className="pointer-events-none flex min-h-[22px] min-w-[22px] items-center justify-center rounded-md border-subtle-stroke border-x border-t border-b-2 bg-primary-background px-1 pt-[3px] pb-0.5 text-accent-foreground text-xs leading-3 shadow-[0px_1px_0px_1px_#E4E7EC]">K</div>
            </div>
          </div>
        </button>
      </div>

      {/* Navigation tree */}
      <div className="mask-t-from-[calc(100%-40px)] relative flex-1 overflow-y-scroll pt-10 pr-6 pb-8 [scrollbar-gutter:stable]">
        <div className="mb-5 flex flex-col gap-5 lg:mb-8 lg:gap-8">
          {helpCategories.map((category) => (
            <div key={category.name}>
              <a className="flex items-center gap-[7px] rounded-[10px] py-px pl-px hover:bg-surface-subtle/80" href="#">
                <span className="size-7.5 flex items-center justify-center text-lg">{category.icon}</span>
                <div className="font-semibold text-xs uppercase">{category.name}</div>
              </a>
              <div className="mt-1 flex flex-col lg:gap-0.5">
                {category.items.map((item) => (
                  <div key={item.label}>
                    <div className="group relative w-full">
                      <button
                        className="absolute top-0 left-0 cursor-pointer self-start rounded-[10px] p-2.5 ring-inset transition-[background-color] hover:bg-[#F5F6F8] group-hover:bg-[#F5F6F8]"
                        onClick={() => setOpenCategory(openCategory === item.label ? null : item.label)}
                      >
                        <svg className={`transition-transform ${openCategory === item.label ? 'rotate-90' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M4.5 3L7.5 6L4.5 9" stroke="#717A88" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <a className="inline-block w-full rounded-[10px] p-1.5 pr-2.5 pl-[38px] text-left text-[#717A88] text-sm hover:bg-[#F5F6F8]" href={item.href}>
                        {item.label}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
