import type { ReactElement, ReactNode } from 'react'
import { Children, cloneElement, isValidElement } from 'react'

/* ──────────────────────────────────────────────
 * <Steps> + <Step title="…">
 *
 * Numbered list of steps for tutorial-style content. `<Steps>` auto-numbers
 * its `<Step>` children — authors don't write the index themselves.
 *
 *   <Steps>
 *     <Step title="Open Settings">
 *       Click your avatar in the top right and choose Settings.
 *     </Step>
 *     <Step title="Pick Security">
 *       Find the Security tab in the sidebar.
 *     </Step>
 *   </Steps>
 * ──────────────────────────────────────────── */

interface StepProps {
  title?: string
  /** Injected by `<Steps>` — do not set manually. */
  index?: number
  children: ReactNode
}

export function Step({ title, index, children }: StepProps) {
  return (
    <li className="relative pl-12">
      <span
        className="absolute -left-4 top-0 flex size-8 items-center justify-center rounded-full border border-border bg-background font-mono text-sm font-semibold text-foreground"
        aria-hidden="true"
      >
        {index ?? ''}
      </span>
      {title ? (
        <h3 className="mb-2 mt-0.5 text-base font-semibold text-foreground">{title}</h3>
      ) : null}
      <div className="text-sm leading-relaxed text-foreground [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
        {children}
      </div>
    </li>
  )
}

interface StepsProps {
  children: ReactNode
}

export default function Steps({ children }: StepsProps) {
  let counter = 0
  const numbered = Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    // Only auto-number elements whose intent is a Step (carries `title` or
    // is the exported `Step`). Don't blindly inject into every child — that
    // would corrupt whitespace text nodes wrapped by MDX.
    counter += 1
    const childElement = child as ReactElement<StepProps>
    return cloneElement(childElement, { index: counter })
  })
  return (
    <ol className="not-prose my-6 ml-4 flex flex-col gap-6 border-l border-border pl-6">
      {numbered}
    </ol>
  )
}
