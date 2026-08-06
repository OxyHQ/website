import { useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

/** How long typing settles before the query reaches the URL, in ms. */
const DEBOUNCE_MS = 250

interface FeatureSearchProps {
  /** The committed query, from the URL. */
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/**
 * Search over the board.
 *
 * The query goes to the same list endpoint, which matches over the set of
 * issues it already holds in memory, so typing costs no GitHub request and
 * cannot push the board closer to a rate limit. It also keeps whatever app
 * filter is active, since searching inside the app you were already looking at
 * is what someone means by it.
 *
 * The committed value lives in the URL, so a search is a link. Typing is local
 * and debounced on its way there, which keeps the caret responsive and stops
 * every keystroke becoming a history entry.
 */
export default function FeatureSearch({ value, onChange, placeholder = 'Search proposals' }: FeatureSearchProps) {
  const [text, setText] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function commit(next: string) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(next), DEBOUNCE_MS)
  }

  function clear() {
    if (timer.current) clearTimeout(timer.current)
    setText('')
    onChange('')
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          commit(event.target.value)
        }}
        placeholder={placeholder}
        aria-label="Search proposals"
        className="w-full rounded-full border border-border bg-surface py-2 pl-9 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-muted-foreground"
      />
      {text && (
        <button
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
