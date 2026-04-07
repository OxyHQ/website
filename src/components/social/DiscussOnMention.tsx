interface DiscussOnMentionProps {
  title: string
  url: string
}

export default function DiscussOnMention({ title, url }: DiscussOnMentionProps) {
  const mentionUrl = `https://mention.earth/compose?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`

  return (
    <a
      href={mentionUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M8 12a4 4 0 1 1 8 0c0 2.5-2 3-2 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="18" r="0.5" fill="currentColor" stroke="currentColor" />
      </svg>
      Discuss on Mention
    </a>
  )
}
