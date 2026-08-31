import { useMemo } from 'react'

/**
 * The code surface: a real `<textarea>` with a coloured copy of its own text
 * drawn behind it.
 *
 * The two layers share one box and one set of type metrics (`BOX`), the
 * highlighted copy is the one in flow so the container grows with the code, and
 * the textarea stretches over it with transparent text and a visible caret.
 * That is what keeps them aligned at any width or zoom without a line of
 * measuring code, and it is why there is no scroll to synchronise: nothing
 * scrolls inside the editor, the page does.
 *
 * A textarea is also the whole reason this page needs no editor library. It
 * arrives with selection, undo, spellcheck-off, IME, screen-reader support and
 * mobile keyboards already correct — everything CodeMirror would be carried in
 * to re-implement, for a file the reader edits a few lines of.
 */

/**
 * Every property that decides where a glyph lands. Both layers take this
 * identical string; a value that lives on only one of them is a misalignment
 * waiting for the first long line.
 */
const BOX =
  'block w-full px-4 py-3 font-mono text-[13px] leading-[1.6] whitespace-pre-wrap break-words'

interface Token {
  text: string
  className: string
}

/**
 * One pass, one regex, in precedence order: comments and strings first so a
 * keyword inside either stays inert, then keywords, JSX tag names, other
 * capitalised identifiers (a component in an attribute or an expression), and
 * numbers.
 *
 * This is a highlighter, not a parser — it colours what a reader scans for and
 * has no opinion about what the code means. Sucrase is the only thing that
 * decides whether a snippet is valid.
 */
const TOKEN_PATTERN = new RegExp(
  [
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/, // comment
    /('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)/, // string
    /\b(import|from|export|default|return|function|const|let|var|type|interface|as|new|await|async|if|else|for|while|typeof|null|undefined|true|false)\b/,
    /(<\/?[A-Z][\w.]*|<\/?[a-z][\w-]*)/, // JSX tag
    /\b([A-Z][\w]*)\b/, // component or type reference
    /\b(\d+(?:\.\d+)?)\b/, // number
  ]
    .map((part) => part.source)
    .join('|'),
  'g',
)

/**
 * Colours are Bloom's. `chart-*` is the only multi-hue family its tokens
 * publish, which makes it the vocabulary for anything that needs several
 * distinguishable colours at once — here, token classes.
 */
const TOKEN_CLASSNAMES = [
  'text-muted-foreground italic', // comment
  'text-chart-2', // string
  'text-chart-5', // keyword
  'text-primary', // JSX tag
  'text-chart-1', // component or type reference
  'text-chart-4', // number
]

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let plainFrom = 0
  for (const match of source.matchAll(TOKEN_PATTERN)) {
    // `match` has the full match at 0 and one group per alternative; exactly
    // one of them is set, and its position is the token's class. No alternative
    // can match an empty string, so truthiness identifies it.
    const group = match.findIndex((value, index) => index > 0 && Boolean(value)) - 1
    if (group < 0) continue
    if (match.index > plainFrom) {
      tokens.push({ text: source.slice(plainFrom, match.index), className: '' })
    }
    tokens.push({ text: match[0], className: TOKEN_CLASSNAMES[group] ?? '' })
    plainFrom = match.index + match[0].length
  }
  tokens.push({ text: source.slice(plainFrom), className: '' })
  return tokens
}

export interface BloomLiveEditorProps {
  value: string
  onChange: (value: string) => void
  /** Labels the textarea for assistive technology. */
  label: string
}

export function BloomLiveEditor({ value, onChange, label }: BloomLiveEditorProps) {
  const tokens = useMemo(() => tokenize(value), [value])

  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-border bg-background">
      <pre aria-hidden className={`${BOX} text-foreground`}>
        {tokens.map((token, index) => (
          // Tokens are positional and the whole list is rebuilt on every edit,
          // so the index IS the identity here — there is no other key that
          // survives a keystroke.
          <span key={index} className={token.className}>
            {token.text}
          </span>
        ))}
        {/* A trailing newline has no glyph, so without this the box stops one
            line short of the caret the reader is typing on. */}
        {'\n'}
      </pre>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className={`${BOX} absolute inset-0 resize-none border-0 bg-transparent text-transparent caret-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring`}
      />
    </div>
  )
}
