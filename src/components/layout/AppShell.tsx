import type { ReactNode } from 'react'
import { useAccountPanel } from '../../contexts/AccountPanelContext'
import AccountPanel from './AccountPanel'

export default function AppShell({ children }: { children: ReactNode }) {
  const { isOpen } = useAccountPanel()

  return (
    <div className="relative flex min-h-screen">
      <div
        className="min-w-0 flex-1 transition-[margin] duration-300 ease-out"
        style={{ marginRight: isOpen ? 400 : 0 }}
      >
        {children}
      </div>
      <AccountPanel />
    </div>
  )
}
