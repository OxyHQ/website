interface PromptCardProps {
  text: string
}

export default function PromptCard({ text }: PromptCardProps) {
  return (
    <div className="group flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[var(--color-subtle-stroke)] bg-[var(--color-secondary-bg)] p-5 transition-colors duration-200 hover:border-[var(--color-black-500)] hover:bg-[var(--color-surface-subtle)]">
      <p className="text-sm leading-relaxed text-[var(--color-secondary-fg)]">{text}</p>
      <svg
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent-fg)] transition-transform duration-200 group-hover:translate-x-0.5"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M6 3L11 8L6 13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
