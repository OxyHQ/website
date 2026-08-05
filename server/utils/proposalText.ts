/**
 * Text handling for feature proposals submitted from the website.
 *
 * The text a visitor types here is published twice: as the body of a real
 * GitHub issue, and back out of this API into the board's own UI. Neither
 * renderer is the problem. GitHub sanitises the HTML it renders, and the SPA
 * puts the description in a text node, so markup is inert on both sides. What a
 * public form genuinely hands an attacker is GitHub's *autolinking*: an
 * `@handle` notifies a real person, a `#123` cross-references a real issue and
 * leaves a permanent backlink on it, and an `![](…)` embeds a remote image that
 * every maintainer who opens the issue then fetches. So the rules below
 * neutralise those three constructs and otherwise leave the text alone, which
 * keeps code fences, lists and links working the way someone writing a feature
 * request expects.
 */

/** Longest accepted title, in characters, after trimming. */
export const TITLE_MAX_LENGTH = 120
/** Shortest accepted title. Rejects "fix it" style submissions. */
export const TITLE_MIN_LENGTH = 8
/** Longest accepted body, in characters, after sanitising. */
export const BODY_MAX_LENGTH = 4000
/** Shortest accepted body. */
export const BODY_MIN_LENGTH = 30

/** Control characters are stripped everywhere; tab and newline survive in bodies. */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g

/**
 * Clean a single-line field.
 *
 * Titles need no autolink treatment: GitHub does not link `#123` in a title and
 * does not notify anyone for an `@handle` there. They do need every newline
 * gone, because a title is one line and a smuggled newline is how a submission
 * fakes structure it was not given.
 */
export function sanitizeProposalTitle(raw: string): string {
  return raw
    .replace(CONTROL_CHARACTERS, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Clean a multi-line body: strip control characters, normalise line endings,
 * cap runs of blank lines, then defuse the three autolinking constructs.
 *
 * Mentions and issue references become inline code, which GitHub renders
 * verbatim and never links, so the reader still sees exactly what was written.
 * Image embeds lose their leading `!`, which turns a silently fetched remote
 * image into an ordinary link the reader chooses to follow.
 */
export function sanitizeProposalBody(raw: string): string {
  const normalized = raw
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARACTERS, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return neutralizeAutolinks(normalized)
}

/**
 * Wrap `@mention`, `#123` and `owner/repo#123` in backticks, and demote
 * `![alt](url)` to `[alt](url)`.
 *
 * Anything already inside a code span or a fenced block is left untouched: it
 * does not autolink there in the first place, and adding backticks inside a
 * fence would corrupt a pasted snippet.
 */
function neutralizeAutolinks(text: string): string {
  const segments = splitOnCode(text)
  return segments
    .map((segment) => {
      if (segment.isCode) return segment.text
      return segment.text
        .replace(/!(\[[^\]\n]*\]\()/g, '$1')
        .replace(/(^|[^\w`/])@([A-Za-z\d](?:[A-Za-z\d]|-(?=[A-Za-z\d])){0,38})/g, '$1`@$2`')
        .replace(/(^|[^\w`#])((?:[\w.-]+\/[\w.-]+)?#\d+)/g, '$1`$2`')
    })
    .join('')
}

interface TextSegment {
  text: string
  isCode: boolean
}

/**
 * Split markdown into alternating plain and code segments, where "code" is a
 * fenced block (``` or ~~~) or an inline code span.
 */
function splitOnCode(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  const pattern = /(```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)|`[^`\n]*`)/g
  let lastIndex = 0

  for (const match of text.matchAll(pattern)) {
    const start = match.index
    if (start > lastIndex) {
      segments.push({ text: text.slice(lastIndex, start), isCode: false })
    }
    segments.push({ text: match[0], isCode: true })
    lastIndex = start + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isCode: false })
  }
  return segments
}

export interface ProposalAttribution {
  /** The proposer's Oxy handle. */
  username: string
  /** The proposer's Oxy user id, so a maintainer can trace an abusive account. */
  userId: string
  /** Absolute URL of the board, e.g. https://oxy.so/features */
  boardUrl: string
}

/**
 * Assemble the issue body.
 *
 * The footer is the part a maintainer reading GitHub actually needs: this issue
 * was not opened by the account in the "opened by" line, it was opened on
 * someone else's behalf by the website's bot token, and here is who asked for
 * it. The handle is wrapped in backticks for the same reason as the body's
 * mentions, since an Oxy handle can collide with a GitHub one.
 */
export function buildProposalIssueBody(body: string, attribution: ProposalAttribution): string {
  return [
    body,
    '',
    '---',
    '',
    `Proposed on the [Oxy feature board](${attribution.boardUrl}) by \`@${attribution.username}\` (Oxy user \`${attribution.userId}\`), and opened here by the website on their behalf.`,
    '',
    'Votes on the board are mirrored into a `priority:` label on this issue.',
  ].join('\n')
}
