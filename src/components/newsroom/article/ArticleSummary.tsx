import { TextAlignLeft } from '@phosphor-icons/react'

/**
 * The article's standfirst, in a panel above the body.
 *
 * The layout this follows animates a "Thinking → Summary" label, implying the
 * summary was just generated. This one is the editor's own `resume` field, so it
 * says Summary and stays still — the animation would be a claim about where the
 * text came from, and it would be false.
 */
export default function ArticleSummary({ resume }: { resume: string }) {
  return (
    <section className="w-full rounded-radius-12 border border-border bg-fill-secondary p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-7 items-center justify-center rounded-radius-8 bg-fill-inverse text-bg">
          <TextAlignLeft size={16} weight="bold" />
        </span>
        <p className="font-semibold text-text-secondary">Summary</p>
      </div>
      <p className="pt-4 text-base leading-relaxed text-text lg:px-10 lg:py-3">{resume}</p>
    </section>
  )
}
