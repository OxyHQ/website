import { buildMentionComposeUrl } from '../../lib/mentionShare'
import MentionIcon from './MentionIcon'

interface ShareWithMentionProps {
  /** Pre-filled composer text (typically the page title). */
  title: string
  /** Canonical URL of the page being shared. */
  url: string
  /** Optional hashtags (no leading `#`). */
  hashtags?: readonly string[]
  /** Optional handle for `via @handle` attribution (no leading `@`). */
  via?: string
}

/**
 * "Share with Mention" pill — used on reference content (docs, courses,
 * lessons) where "share" reads better than "discuss". For articles / blog
 * posts, use the sibling `DiscussOnMention` variant.
 *
 * Both wrap `buildMentionComposeUrl` so the produced URL stays in sync with
 * Mention's intent contract (see `src/lib/mentionShare.ts`).
 */
export default function ShareWithMention({ title, url, hashtags, via }: ShareWithMentionProps) {
  const mentionUrl = buildMentionComposeUrl({ text: title, url, hashtags, via })

  return (
    <a
      href={mentionUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
    >
      <MentionIcon className="h-4 w-4" />
      Share with Mention
    </a>
  )
}
