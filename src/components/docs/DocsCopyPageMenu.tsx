import { useState } from 'react'

export function DocsCopyPageMenu() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyPage() {
    const content = document.querySelector('[data-docs-content]')?.textContent
    if (content) {
      navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className="relative items-center shrink-0 min-w-[156px] justify-end ml-auto sm:flex hidden"
      id="page-context-menu"
    >
      <button
        className="rounded-l-xl px-3 text-foreground py-1.5 border border-border bg-surface hover:bg-surface border-r-0"
        aria-label="Copy page"
        onClick={copyPage}
      >
        <div className="flex items-center gap-2 text-sm text-center font-medium">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4">
            <path d="M14.25 5.25H7.25C6.14543 5.25 5.25 6.14543 5.25 7.25V14.25C5.25 15.3546 6.14543 16.25 7.25 16.25H14.25C15.3546 16.25 16.25 15.3546 16.25 14.25V7.25C16.25 6.14543 15.3546 5.25 14.25 5.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.80103 11.998L1.77203 5.07397C1.61003 3.98097 2.36403 2.96397 3.45603 2.80197L10.38 1.77297C11.313 1.63397 12.19 2.16297 12.528 3.00097" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{copied ? 'Copied!' : 'Copy page'}</span>
        </div>
      </button>
      <button
        className="group disabled:pointer-events-none [&>span]:line-clamp-1 overflow-hidden flex items-center py-0.5 gap-1 text-sm text-white/50 group-hover:text-white/70 rounded-none rounded-r-xl border px-3 border-border aspect-square bg-surface hover:bg-surface"
        aria-label="More actions"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        data-state={open ? 'open' : 'closed'}
        onClick={() => setOpen(!open)}
      >
        <svg width="8" height="24" viewBox="0 -9 3 24" className="transition-transform text-muted-foreground overflow-visible group-hover:text-foreground rotate-90">
          <path d="M0 0L3 3L0 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-xl border border-border bg-surface shadow-[0px_4px_16px_rgba(0,0,0,0.4),0px_1px_4px_rgba(0,0,0,0.3)] py-1">
            <button
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-surface rounded-lg mx-1"
              style={{ width: 'calc(100% - 8px)' }}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                setOpen(false)
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted-foreground">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Copy link
            </button>
            <button
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-surface rounded-lg mx-1"
              style={{ width: 'calc(100% - 8px)' }}
              onClick={() => {
                copyPage()
                setOpen(false)
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted-foreground">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Copy as Markdown
            </button>
            <div className="my-1 mx-3 h-px bg-white/[0.07]" />
            <button
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-surface rounded-lg mx-1"
              style={{ width: 'calc(100% - 8px)' }}
              onClick={() => {
                window.open(window.location.href, '_blank')
                setOpen(false)
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted-foreground">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open in new tab
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
