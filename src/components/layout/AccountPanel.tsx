import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@oxyhq/auth'
import { Avatar } from '@oxyhq/bloom/avatar'
import { useAccountPanel } from '../../contexts/AccountPanelContext'
import { ADMIN_USERNAMES } from '../../constants'

const linkClass = 'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] text-foreground transition-colors hover:bg-surface'

function IconCircle({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
      {children}
    </div>
  )
}

export default function AccountPanel() {
  const { isOpen, close } = useAccountPanel()
  const { user, signOut } = useAuth()
  const location = useLocation()

  useEffect(() => { close() }, [location.pathname, close])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close])

  const displayName = [user?.name?.first, user?.name?.last].filter(Boolean).join(' ') || user?.username || ''

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={close}
        aria-hidden="true"
      />

      <div
        className={`fixed top-0 right-0 z-[61] h-full w-[400px] max-w-[calc(100vw-48px)] border-l border-border bg-background/80 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          {/* Close button */}
          <div className="flex justify-end px-4 pt-4">
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

          {/* Profile header */}
          <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-2">
            <Avatar source={user?.avatar} size={88} placeholderColor={user?.color} />
            <div className="text-center">
              <div className="text-xl font-semibold text-foreground">{displayName}</div>
              {user?.username && (
                <div className="mt-0.5 text-sm text-muted-foreground">@{user.username}</div>
              )}
              <div className="mt-1 text-[13px] text-muted-foreground">Manage your Oxy account</div>
            </div>
          </div>

          {/* Quick actions grid */}
          <div className="grid grid-cols-4 gap-2 px-4 pb-4">
            {[
              { label: 'Personal Info', href: '/settings', icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 15.75v-1.5a3 3 0 0 0-3-3h-3a3 3 0 0 0-3 3v1.5" /><circle cx="9" cy="6" r="3" /></svg>
              ), color: '#e8f0fe' },
              { label: 'Security', href: '/settings', icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 1.5 3 4.5v4.5c0 4.14 2.56 7.01 6 7.5 3.44-.49 6-3.36 6-7.5V4.5L9 1.5Z" /></svg>
              ), color: '#fce8e6' },
              { label: 'Devices', href: '/settings', icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2.25" y="3" width="13.5" height="9" rx="1.5" /><path d="M6 15h6M9 12v3" /></svg>
              ), color: '#e6f4ea' },
              { label: 'Data', href: '/settings', icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2.25v13.5M2.25 9h13.5" /><rect x="3" y="3" width="12" height="12" rx="2" /></svg>
              ), color: '#fef7e0' },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className="flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-colors hover:bg-surface"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: action.color }}>
                  {action.icon}
                </div>
                <span className="text-[11px] leading-tight text-muted-foreground">{action.label}</span>
              </Link>
            ))}
          </div>

          {/* Menu sections */}
          <div className="flex flex-1 flex-col gap-1 px-4 pb-4">
            {/* Account section */}
            <div className="rounded-xl border border-border bg-surface/50">
              <Link to="/settings" className={linkClass}>
                <IconCircle color="#e8f0fe">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#4285f4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="3" /><path d="M12.7 10.1a1 1 0 00.2 1.1l.03.03a1.22 1.22 0 11-1.72 1.72l-.03-.03a1 1 0 00-1.1-.2 1 1 0 00-.61.92v.09a1.22 1.22 0 11-2.44 0v-.05a1 1 0 00-.65-.91 1 1 0 00-1.1.2l-.03.03a1.22 1.22 0 11-1.72-1.72l.03-.03a1 1 0 00.2-1.1 1 1 0 00-.92-.61h-.09a1.22 1.22 0 110-2.44h.05a1 1 0 00.91-.65 1 1 0 00-.2-1.1l-.03-.03A1.22 1.22 0 114.97 3.5l.03.03a1 1 0 001.1.2h.05a1 1 0 00.61-.92v-.09a1.22 1.22 0 112.44 0v.05a1 1 0 00.65.91 1 1 0 001.1-.2l.03-.03a1.22 1.22 0 111.72 1.72l-.03.03a1 1 0 00-.2 1.1v.05a1 1 0 00.92.61h.09a1.22 1.22 0 010 2.44h-.05a1 1 0 00-.91.65z" /></svg>
                </IconCircle>
                <span>Settings</span>
              </Link>
              <a href="https://accounts.oxy.so" target="_blank" rel="noopener noreferrer" className={linkClass}>
                <IconCircle color="#e6f4ea">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#34a853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 14v-1.33A2.67 2.67 0 009.33 10H6.67A2.67 2.67 0 004 12.67V14M8 7.33A2.67 2.67 0 108 2a2.67 2.67 0 000 5.33z" /></svg>
                </IconCircle>
                <span>Manage account</span>
              </a>
              {ADMIN_USERNAMES.includes(user?.username ?? '') && (
                <Link to="/admin" className={linkClass}>
                  <IconCircle color="#fef7e0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#f9ab00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4.5h12M2 8h12M2 11.5h8" /></svg>
                  </IconCircle>
                  <span>Admin</span>
                </Link>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <button
              onClick={() => { signOut(); close() }}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 14H3.33A1.33 1.33 0 012 12.67V3.33A1.33 1.33 0 013.33 2H6M10.67 11.33L14 8l-3.33-3.33M14 8H6" /></svg>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
