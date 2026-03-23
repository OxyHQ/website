import { useState, useRef, useEffect } from 'react'
import { useLocaleContext } from '../../contexts/LocaleContext'
import { Globe } from 'lucide-react'

export default function LocalePicker() {
  const { locale, locales, setLocale } = useLocaleContext()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Don't render if only one locale exists
  if (locales.length <= 1) return null

  const current = locales.find(l => l.code === locale)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-transparent px-2.5 text-sm text-muted-foreground transition-colors duration-300 hover:bg-surface hover:text-foreground"
        aria-label="Change language"
      >
        <Globe className="size-4" />
        <span className="hidden sm:inline">{current?.nativeName ?? locale.toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[140px] rounded-xl border border-border bg-background p-1.5 shadow-lg">
          {locales.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLocale(l.code); setOpen(false) }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface ${
                l.code === locale ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}
            >
              {l.nativeName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
