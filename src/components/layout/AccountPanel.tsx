import { useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@oxyhq/services'
import { Avatar } from '@oxyhq/bloom/avatar'
import { SettingsListGroup } from '@oxyhq/bloom/settings-list'
import { useTheme } from '@oxyhq/bloom/theme'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useLottie } from 'lottie-react'
import { useAccountPanel } from '../../contexts/AccountPanelContext'
import { useAdminAccess } from '../../hooks/useAdminAccess'
import welcomeAnimation from '../../assets/lottie/welcomeheader_background.json'

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name']

/* Explicit Bloom fill/foreground pairs. Never derive a foreground by darkening
 * its fill: that loses contrast as soon as the active recipe changes. */
const ICON_COLORS = {
  home: { background: 'var(--info-subtle)', foreground: 'var(--info-text)' },
  personal: { background: 'var(--success-subtle)', foreground: 'var(--success-text)' },
  security: { background: 'var(--primary-subtle)', foreground: 'var(--primary-text)' },
  devices: { background: 'var(--secondary-subtle)', foreground: 'var(--secondary-text)' },
  data: { background: 'var(--tertiary-subtle)', foreground: 'var(--tertiary-text)' },
  sharing: { background: 'var(--error-subtle)', foreground: 'var(--error-text)' },
  payments: { background: 'var(--warning-subtle)', foreground: 'var(--warning-text)' },
} as const

type IconRole = keyof typeof ICON_COLORS

function AvatarWithAnimation({ avatarSource, avatarColor, size }: { avatarSource?: string; avatarColor?: string; size: number }) {
  const { View: LottieView } = useLottie(
    { animationData: welcomeAnimation, loop: true, autoplay: true },
    { width: '100%', height: '100%', position: 'absolute' as const, top: 0, left: 0 },
  )
  return (
    <div className="relative flex h-[100px] w-[600px] max-w-full items-center justify-center overflow-hidden">
      {LottieView}
      <div className="relative z-10">
        <Avatar source={avatarSource} size={size} placeholderColor={avatarColor} />
      </div>
    </div>
  )
}

/* ─── Shared styles ─── */
const chipClass = 'flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 py-1.5 text-link-sm text-foreground transition-colors hover:bg-surface'
const groupItemClass = 'flex w-full cursor-pointer items-center gap-3 p-4 text-left text-body-md text-foreground transition-colors hover:bg-surface'

/**
 * Solid-colour circular badge with a MaterialCommunityIcons glyph, matching the
 * Accounts app (chips/menu rows use 32px, info cards 36px; glyph is always 20px
 * in a darkened shade of the badge colour).
 */
function IconBadge({ name, role, size = 32 }: { name: IconName; role: IconRole; size?: number }) {
  const colors = ICON_COLORS[role]
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: colors.background }}
    >
      <MaterialCommunityIcons name={name} size={20} color={colors.foreground} />
    </div>
  )
}

function Chevron({ color }: { color: string }) {
  return (
    <span className="ml-auto flex shrink-0 items-center">
      <MaterialCommunityIcons name="chevron-right" size={18} color={color} />
    </span>
  )
}

/* ─── Quick‑action data ─── */
const quickActions: { label: string; href: string; icon: IconName; role: IconRole }[] = [
  { label: 'Personal Info', href: 'https://accounts.oxy.so/personal-info', icon: 'card-account-details-outline', role: 'personal' },
  { label: 'Security', href: 'https://accounts.oxy.so/security', icon: 'shield-check-outline', role: 'security' },
  { label: 'Devices', href: 'https://accounts.oxy.so/devices', icon: 'desktop-classic', role: 'devices' },
  { label: 'Data & Privacy', href: 'https://accounts.oxy.so/data', icon: 'toggle-switch-outline', role: 'data' },
  { label: 'Sharing', href: 'https://accounts.oxy.so/sharing', icon: 'account-group-outline', role: 'sharing' },
  { label: 'Payments', href: 'https://accounts.oxy.so/payments', icon: 'wallet-outline', role: 'payments' },
]

/* ─── Grouped menu items ─── */
const menuItems: { label: string; href: string; external: boolean; icon: IconName; role: IconRole }[] = [
  { label: 'Settings', href: '/settings', external: false, icon: 'cog-outline', role: 'home' },
  { label: 'Manage account', href: 'https://accounts.oxy.so', external: true, icon: 'account-cog-outline', role: 'personal' },
]

export default function AccountPanel() {
  const { isOpen, close } = useAccountPanel()
  const { user, signOut } = useAuth()
  const { isAdmin } = useAdminAccess()
  const location = useLocation()
  const { colors } = useTheme()

  // Derived-state pattern: close the panel on route change without useEffect.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    if (isOpen) close()
  }

  // Escape listener lives only while the panel is open — wired via a callback
  // ref on a conditionally-mounted sentinel element.
  const escapeSentinelRef = useCallback((node: HTMLSpanElement | null) => {
    if (!node) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [close])

  const displayName = user?.name.displayName ?? ''
  return (
    <>
      {isOpen && <span ref={escapeSentinelRef} aria-hidden hidden />}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        style={{ backgroundColor: colors.overlay }}
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 z-[61] h-full w-[400px] max-w-[calc(100vw-48px)] border-l border-border bg-background/80 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-full flex-col overflow-y-auto">

          {/* Close */}
          <div className="flex justify-end px-4 pt-4">
            <button onClick={close} className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground" aria-label="Close panel">
              <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
            </button>
          </div>

          {/* ─── Profile header with animated background ─── */}
          <div className="flex flex-col items-center pb-5 pt-1">
            {isOpen
              ? <AvatarWithAnimation avatarSource={user?.avatar ?? undefined} avatarColor={user?.color ?? undefined} size={100} />
              : <Avatar source={user?.avatar} size={100} placeholderColor={user?.color ?? undefined} />
            }
            <div className="mt-3 text-center">
              <div className="text-xl font-semibold text-foreground">{displayName}</div>
              {user?.username && <div className="mt-0.5 text-sm text-muted-foreground">@{user.username}</div>}
              <div className="mt-2 flex gap-2">
                {user?.username && (
                  <Link to={`/u/${user.username}`} className="inline-block rounded-full border border-border px-4 py-1.5 text-link-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground">View profile</Link>
                )}
                <a href="https://accounts.oxy.so" target="_blank" rel="noopener noreferrer" className="inline-block rounded-full border border-border px-4 py-1.5 text-link-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground">Manage account</a>
              </div>
            </div>
          </div>

          {/* ─── Quick actions (horizontal scroll chips) ─── */}
          <div className="pb-4">
            <div className="flex gap-1.5 overflow-x-auto px-4 pb-1 hide-scrollbar">
              {quickActions.map((a) => (
                <a key={a.label} href={a.href} target="_blank" rel="noopener noreferrer" className={chipClass}>
                  <IconBadge name={a.icon} role={a.role} />
                  <span className="whitespace-nowrap">{a.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* ─── Account info grid ─── */}
          <div className="grid grid-cols-2 gap-3 px-4 pb-4">
            <div className="rounded-2xl border border-border p-4">
              <IconBadge name="account-outline" role="personal" size={36} />
              <div className="mt-4">
                <div className="text-label-sm text-muted-foreground">Full name</div>
                <div className="mt-0.5 text-base font-bold text-foreground">{displayName || '—'}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <IconBadge name="at" role="personal" size={36} />
              <div className="mt-4">
                <div className="text-label-sm text-muted-foreground">Username</div>
                <div className="mt-0.5 text-base font-bold text-foreground">{user?.username ? `@${user.username}` : '—'}</div>
              </div>
            </div>
          </div>

          {/* ─── Grouped menu sections (Bloom chrome, real anchors as rows) ─── */}
          <div className="flex-1 pb-4">
            <SettingsListGroup title="Account">
              {menuItems.map((item) =>
                item.external ? (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={groupItemClass}>
                    <IconBadge name={item.icon} role={item.role} />
                    <span>{item.label}</span>
                    <Chevron color={colors.textTertiary} />
                  </a>
                ) : (
                  <Link key={item.label} to={item.href} className={groupItemClass}>
                    <IconBadge name={item.icon} role={item.role} />
                    <span>{item.label}</span>
                    <Chevron color={colors.textTertiary} />
                  </Link>
                )
              )}
              {isAdmin && (
                <Link to="/admin" className={groupItemClass}>
                  <IconBadge name="shield-account-outline" role="payments" />
                  <span>Admin</span>
                  <Chevron color={colors.textTertiary} />
                </Link>
              )}
            </SettingsListGroup>

            <SettingsListGroup>
              <button onClick={() => { signOut(); close() }} className={groupItemClass} style={{ color: colors.error }}>
                <IconBadge name="logout" role="sharing" />
                <span>Sign out</span>
              </button>
            </SettingsListGroup>
          </div>
        </div>
      </div>

    </>
  )
}
