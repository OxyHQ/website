import type { ReactNode } from 'react'
import AccountPanel from './AccountPanel'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AccountPanel />
    </>
  )
}
