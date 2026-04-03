import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@oxyhq/auth'
import { Avatar } from '@oxyhq/bloom/avatar'
import { useAccountPanel } from '../../contexts/AccountPanelContext'
import { ADMIN_USERNAMES } from '../../constants'
import Button from '../ui/Button'

export default function AccountPanel() {
  const { isOpen, close } = useAccountPanel()
  const { user, signOut } = useAuth()
  const location = useLocation()

  // Close panel on route change
  useEffect(() => { close() }, [location.pathname, close])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-[61] h-full w-[400px] max-w-[calc(100vw-48px)] border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <h2 className="text-base font-semibold text-foreground">Account</h2>
            <button
              onClick={close}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              aria-label="Close panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m12.5 5.5-7 7m7 0-7-7" />
              </svg>
            </button>
          </div>

          {/* Profile */}
          <div className="flex flex-col items-center gap-3 border-b border-border px-6 py-8">
            <Avatar source={user?.avatar} size={72} placeholderColor={user?.color} />
            <div className="text-center">
              <div className="text-lg font-medium text-foreground">
                {user?.name?.first}{user?.name?.last ? ` ${user.name.last}` : ''}
              </div>
              <div className="text-sm text-muted-foreground">@{user?.username}</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col gap-1 p-4">
            {ADMIN_USERNAMES.includes(user?.username ?? '') && (
              <Link
                to="/admin"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-foreground transition-colors hover:bg-surface"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4.5h12M2 8h12M2 11.5h8" /></svg>
                Admin
              </Link>
            )}
            <Link
              to="/settings"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-foreground transition-colors hover:bg-surface"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="3" /><path d="M12.7 10.1a1 1 0 00.2 1.1l.03.03a1.22 1.22 0 11-1.72 1.72l-.03-.03a1 1 0 00-1.1-.2 1 1 0 00-.61.92v.09a1.22 1.22 0 11-2.44 0v-.05a1 1 0 00-.65-.91 1 1 0 00-1.1.2l-.03.03a1.22 1.22 0 11-1.72-1.72l.03-.03a1 1 0 00.2-1.1 1 1 0 00-.92-.61h-.09a1.22 1.22 0 110-2.44h.05a1 1 0 00.91-.65 1 1 0 00-.2-1.1l-.03-.03A1.22 1.22 0 114.97 3.5l.03.03a1 1 0 001.1.2h.05a1 1 0 00.61-.92v-.09a1.22 1.22 0 112.44 0v.05a1 1 0 00.65.91 1 1 0 001.1-.2l.03-.03a1.22 1.22 0 111.72 1.72l-.03.03a1 1 0 00-.2 1.1v.05a1 1 0 00.92.61h.09a1.22 1.22 0 010 2.44h-.05a1 1 0 00-.91.65z" /></svg>
              Settings
            </Link>
            <a
              href="https://accounts.oxy.so"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-foreground transition-colors hover:bg-surface"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 14v-1.33A2.67 2.67 0 009.33 10H6.67A2.67 2.67 0 004 12.67V14M8 7.33A2.67 2.67 0 108 2a2.67 2.67 0 000 5.33z" /></svg>
              Manage account
            </a>
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => { signOut(); close() }}
              className="w-full"
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
