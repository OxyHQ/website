import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@oxyhq/auth'
import { Avatar } from '@oxyhq/bloom/avatar'
import { useAccountPanel } from '../../contexts/AccountPanelContext'
import { ADMIN_USERNAMES } from '../../constants'

/* ─── Shared styles ─── */
const chipClass = 'flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-surface'
const groupItemClass = 'flex w-full items-center gap-3 px-4 py-3 text-[14px] text-foreground transition-colors hover:bg-surface first:rounded-t-xl last:rounded-b-xl'

function IconCircle({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
      {children}
    </div>
  )
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-auto shrink-0 text-muted-foreground">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m6 4 4 4-4 4" />
    </svg>
  )
}

/* ─── Quick‑action data ─── */
const quickActions = [
  { label: 'Personal Info', href: '/settings', stroke: '#34A853', bg: '#e6f4ea', d: 'M13.5 15.75v-1.5a3 3 0 00-3-3h-3a3 3 0 00-3 3v1.5M9 8.25a3 3 0 100-6 3 3 0 000 6z' },
  { label: 'Security', href: '/settings', stroke: '#4285F4', bg: '#e8f0fe', d: 'M9 1.5L3 4.5v4.5c0 4.14 2.56 7.01 6 7.5 3.44-.49 6-3.36 6-7.5V4.5L9 1.5z' },
  { label: 'Devices', href: '/settings', stroke: '#4285F4', bg: '#e8f0fe', d: 'M2.25 3.75h13.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H2.25a.75.75 0 01-.75-.75v-7.5a.75.75 0 01.75-.75zM6.75 15h4.5M9 12.75v2.25' },
  { label: 'Data & Privacy', href: '/settings', stroke: '#9C27B0', bg: '#f3e8fd', d: 'M9 2.25v13.5M2.25 9h13.5M3.75 3.75h10.5a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5z' },
  { label: 'Sharing', href: '/settings', stroke: '#EA4335', bg: '#fce8e6', d: 'M12 6.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM12 15.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM6 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM7.95 10.2l2.1 1.8M10.05 5.7l-2.1 1.8' },
  { label: 'Payments', href: '/settings', stroke: '#FBBC04', bg: '#fef7e0', d: 'M2.25 6.75h13.5M2.25 5.25a1.5 1.5 0 011.5-1.5h10.5a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-7.5z' },
]

/* ─── Grouped menu items ─── */
const menuItems = [
  { label: 'Settings', href: '/settings', stroke: '#4285F4', bg: '#e8f0fe', d: 'M8 10a2 2 0 100-4 2 2 0 000 4zM12.7 10.1a1 1 0 00.2 1.1l.03.03a1.22 1.22 0 11-1.72 1.72l-.03-.03a1 1 0 00-1.1-.2 1 1 0 00-.61.92v.09a1.22 1.22 0 11-2.44 0v-.05a1 1 0 00-.65-.91 1 1 0 00-1.1.2l-.03.03a1.22 1.22 0 11-1.72-1.72l.03-.03a1 1 0 00.2-1.1 1 1 0 00-.92-.61h-.09a1.22 1.22 0 110-2.44h.05a1 1 0 00.91-.65 1 1 0 00-.2-1.1l-.03-.03A1.22 1.22 0 114.97 3.5l.03.03a1 1 0 001.1.2h.05a1 1 0 00.61-.92v-.09a1.22 1.22 0 112.44 0v.05a1 1 0 00.65.91 1 1 0 001.1-.2l.03-.03a1.22 1.22 0 111.72 1.72l-.03.03a1 1 0 00-.2 1.1v.05a1 1 0 00.92.61h.09a1.22 1.22 0 010 2.44h-.05a1 1 0 00-.91.65z' },
  { label: 'Manage account', href: 'https://accounts.oxy.so', external: true, stroke: '#34A853', bg: '#e6f4ea', d: 'M12 14v-1.33A2.67 2.67 0 009.33 10H6.67A2.67 2.67 0 004 12.67V14M8 7.33A2.67 2.67 0 108 2a2.67 2.67 0 000 5.33z' },
]

export default function AccountPanel() {
  const { isOpen, close } = useAccountPanel()
  const { user, signOut } = useAuth()
  const location = useLocation()

  useEffect(() => { close() }, [location.pathname, close])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close])

  const displayName = [user?.name?.first, user?.name?.last].filter(Boolean).join(' ') || user?.username || ''

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 z-[61] h-full w-[400px] max-w-[calc(100vw-48px)] border-l border-border bg-background/80 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-full flex-col overflow-y-auto">

          {/* Close */}
          <div className="flex justify-end px-4 pt-4">
            <button onClick={close} className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground" aria-label="Close panel">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m12.5 5.5-7 7m7 0-7-7" />
              </svg>
            </button>
          </div>

          {/* ─── Profile header with animated background ─── */}
          <div className="relative flex flex-col items-center pb-5 pt-1">
            {/* Animated gradient — full width, ambient */}
            <div className="relative flex h-[100px] w-full items-center justify-center overflow-hidden">
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #4285F4, #34A853, #FBBC04, #EA4335, #9C27B0, #4285F4)',
                  backgroundSize: '300% 300%',
                  animation: 'avatar-bg 8s ease infinite',
                }}
              />
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(circle at 50% 100%, var(--color-background) 0%, transparent 70%)',
              }} />
              <div className="relative z-10">
                <Avatar source={user?.avatar} size={64} placeholderColor={user?.color} />
              </div>
            </div>
            <div className="mt-3 text-center">
              <div className="text-xl font-semibold text-foreground">{displayName}</div>
              {user?.username && <div className="mt-0.5 text-sm text-muted-foreground">@{user.username}</div>}
              <div className="mt-1 text-[13px] text-muted-foreground">Manage your Oxy account</div>
            </div>
          </div>

          {/* ─── Quick actions (horizontal scroll chips) ─── */}
          <div className="pb-4">
            <div className="flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-none">
              {quickActions.map((a) => (
                <Link key={a.label} to={a.href} className={chipClass}>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: a.bg }}>
                    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke={a.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={a.d} /></svg>
                  </div>
                  <span className="whitespace-nowrap">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ─── Account info grid ─── */}
          <div className="grid grid-cols-2 gap-3 px-4 pb-4">
            <div className="rounded-2xl border border-border p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: '#e6f4ea' }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 15.75v-1.5a3 3 0 00-3-3h-3a3 3 0 00-3 3v1.5M9 8.25a3 3 0 100-6 3 3 0 000 6z" /></svg>
              </div>
              <div className="mt-4">
                <div className="text-[11px] font-medium text-muted-foreground">Full name</div>
                <div className="mt-0.5 text-base font-bold text-foreground">{displayName || '—'}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: '#e8f0fe' }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v12M2 8h12" /><circle cx="8" cy="8" r="6" /></svg>
              </div>
              <div className="mt-4">
                <div className="text-[11px] font-medium text-muted-foreground">Username</div>
                <div className="mt-0.5 text-base font-bold text-foreground">{user?.username ? `@${user.username}` : '—'}</div>
              </div>
            </div>
          </div>

          {/* ─── Grouped menu section ─── */}
          <div className="flex flex-1 flex-col px-4 pb-4">
            <div className="text-sm font-semibold text-foreground mb-2">Account</div>
            <div className="rounded-2xl border border-border overflow-hidden">
              {menuItems.map((item) =>
                item.external ? (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={groupItemClass}>
                    <IconCircle bg={item.bg}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={item.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={item.d} /></svg>
                    </IconCircle>
                    <span>{item.label}</span>
                    <Chevron />
                  </a>
                ) : (
                  <Link key={item.label} to={item.href} className={groupItemClass}>
                    <IconCircle bg={item.bg}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={item.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={item.d} /></svg>
                    </IconCircle>
                    <span>{item.label}</span>
                    <Chevron />
                  </Link>
                )
              )}
              {ADMIN_USERNAMES.includes(user?.username ?? '') && (
                <Link to="/admin" className={groupItemClass}>
                  <IconCircle bg="#fef7e0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#FBBC04" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4.5h12M2 8h12M2 11.5h8" /></svg>
                  </IconCircle>
                  <span>Admin</span>
                  <Chevron />
                </Link>
              )}
            </div>
          </div>

          {/* ─── Sign out ─── */}
          <div className="border-t border-border p-4">
            <button onClick={() => { signOut(); close() }} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 14H3.33A1.33 1.33 0 012 12.67V3.33A1.33 1.33 0 013.33 2H6M10.67 11.33L14 8l-3.33-3.33M14 8H6" /></svg>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes avatar-bg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  )
}
