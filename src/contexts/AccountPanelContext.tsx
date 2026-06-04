import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'

interface AccountPanelContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const AccountPanelContext = createContext<AccountPanelContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
})

export function AccountPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((o) => !o), [])

  const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle])

  return (
    <AccountPanelContext.Provider value={value}>
      {children}
    </AccountPanelContext.Provider>
  )
}

// Co-located hook + provider — splitting them would require updating
// every callsite for a fast-refresh edge case that doesn't apply here
// (this provider isn't edited live during product development).
// eslint-disable-next-line react-refresh/only-export-components
export function useAccountPanel() {
  return useContext(AccountPanelContext)
}
