import { FaqQuestion, type FaqItem } from './FaqAccordion'

export interface FaqGroup {
  title: string
  items: FaqItem[]
}

interface FaqDirectoryProps {
  groups: FaqGroup[]
}

/** Slugs the heading so the pill above can jump to it. */
function groupId(index: number): string {
  return `section-${index}`
}

/**
 * A long FAQ split into named groups, with the group list pinned to the top of
 * the viewport as you read. The pills are plain anchors, so a jump is a real
 * navigation: it lands in history and survives a copied URL.
 */
export default function FaqDirectory({ groups }: FaqDirectoryProps) {
  return (
    <section className="layout-px-large grid grid-cols-8 gap-x-2.5 sm:grid-cols-12 sm:gap-x-5 md:gap-x-6 items-start gap-16 py-40">
      <aside className="sticky top-[var(--header-height)] z-10 col-span-full col-start-1 flex flex-wrap items-start gap-2 bg-gray-a10 max-lg:py-2 lg:col-span-3 lg:pt-10">
        {groups.map((group, index) => (
          <a key={group.title} href={`#${groupId(index)}`}>
            <button
              type="button"
              className="relative cursor-pointer rounded-full border-none bg-gray-a8 px-3.5 py-1.75 text-b4 text-gray-a1 outline-none transition-all duration-200 ease-impulse hover:bg-gray-a6"
            >
              <span className="inline-flex items-center justify-center">{group.title}</span>
            </button>
          </a>
        ))}
      </aside>

      {/* Runs to the right edge of the frame, like every other wide content
          block on the site — stopping two columns short left a ragged gap
          against the header and footer above and below it. */}
      <div className="col-span-full sm:col-span-12 lg:col-start-5 lg:col-span-8">
        {groups.map((group, index) => (
          <div key={group.title} className="mb-40 last:mb-0 lg:mb-62">
            <h2 id={groupId(index)} className="scroll-mt-[calc(var(--header-height)+6rem)] pb-10 text-h4 text-gray-a1">
              {group.title}
            </h2>
            {group.items.map((item) => (
              <FaqQuestion key={item.question} item={item} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
