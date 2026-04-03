import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

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

  return (
    <AccountPanelContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </AccountPanelContext.Provider>
  )
}

export function useAccountPanel() {
  return useContext(AccountPanelContext)
}
