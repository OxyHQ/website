/**
 * Canonical model ids in and out of `/ai/models/:publisher/:model`.
 *
 * A catalogue id is `publisher/model`, and the model half can itself carry
 * characters a URL segment is picky about: `@` and `:` for a pinned revision,
 * `.` in a version number, and — for a derived model — a second slash. So the
 * route is two segments, the second one holds whatever is left of the id, and
 * the encoding is explicit in both directions.
 *
 * `encodeURIComponent` alone is not enough: react-router decodes a `%2F` in a
 * path segment back to `/` before the component sees it, which silently splits
 * one param into what looks like two. The slash is therefore encoded as `~`,
 * which no catalogue id uses, and every other reserved character goes through
 * percent-encoding as normal.
 */

/** Separator standing in for a slash inside the model half of an id. */
const SLASH_TOKEN = '~'

export interface ParsedModelId {
  publisher: string
  model: string
}

/** Split a canonical `publisher/model` id. Returns undefined for a malformed id. */
export function splitModelId(id: string): ParsedModelId | undefined {
  const index = id.indexOf('/')
  if (index <= 0 || index === id.length - 1) return undefined
  return { publisher: id.slice(0, index), model: id.slice(index + 1) }
}

/** The site path for a catalogue entry, ready to hand to `<Link to>`. */
export function modelPath(id: string): string | undefined {
  const parts = splitModelId(id)
  if (!parts) return undefined
  return `/ai/models/${encodeModelSegment(parts.publisher)}/${encodeModelSegment(parts.model)}`
}

/** Encode one id half into a single URL path segment. */
export function encodeModelSegment(value: string): string {
  return encodeURIComponent(value.replaceAll(SLASH_TOKEN, `${SLASH_TOKEN}${SLASH_TOKEN}`)).replaceAll(
    '%2F',
    SLASH_TOKEN,
  )
}

/** Decode one URL path segment back into the id half it came from. */
export function decodeModelSegment(segment: string): string {
  // react-router hands over an already-decoded param, but a value read straight
  // out of `location.pathname` is not, so tolerate both: decoding twice is only
  // wrong if the id itself contains a literal `%`, which no catalogue id does.
  const percentDecoded = segment.includes('%') ? safeDecode(segment) : segment
  // A linear scan rather than chained `replaceAll`: `~~` stands for a literal
  // `~` and a lone `~` for `/`, and expressing that with replacements needs a
  // third placeholder character which is itself unsafe the moment an id
  // contains it.
  let out = ''
  for (let index = 0; index < percentDecoded.length; index += 1) {
    const char = percentDecoded[index]
    if (char !== SLASH_TOKEN) {
      out += char
      continue
    }
    if (percentDecoded[index + 1] === SLASH_TOKEN) {
      out += SLASH_TOKEN
      index += 1
    } else {
      out += '/'
    }
  }
  return out
}

/** Rebuild the canonical id from the two route params. */
export function modelIdFromParams(publisher: string, model: string): string {
  return `${decodeModelSegment(publisher)}/${decodeModelSegment(model)}`
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
