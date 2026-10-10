import { buildMentionComposeUrl } from '../../lib/mentionShare';
import MentionIcon from './MentionIcon';

interface DiscussOnMentionProps {
  /** Pre-filled composer text (typically the article title). */
  title: string;
  /** Canonical URL of the page being shared. */
  url: string;
  /** Optional hashtags (no leading `#`). */
  hashtags?: readonly string[];
  /** Optional handle for `via @handle` attribution (no leading `@`). */
  via?: string;
}

/**
 * "Discuss on Mention" pill — used on long-form content (articles, blog
 * posts) where "discuss" reads better than "share". For docs / lessons /
 * courses, use the sibling `ShareWithMention` variant.
 *
 * Both wrap `buildMentionComposeUrl` so the produced URL stays in sync with
 * Mention's intent contract (see `src/lib/mentionShare.ts`).
 */
export default function DiscussOnMention({ title, url, hashtags, via }: DiscussOnMentionProps) {
  const mentionUrl = buildMentionComposeUrl({ text: title, url, hashtags, via });

  return (
    <a
      href={mentionUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
    >
      <MentionIcon className="h-4 w-4" />
      Discuss on Mention
    </a>
  );
}
