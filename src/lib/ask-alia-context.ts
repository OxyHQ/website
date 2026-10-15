import { createContext, useContext } from 'react';

export interface AskAliaContextValue {
  /**
   * Opens Alia's chat sheet. Signed out, there is no session to call Alia with, so this opens
   * the Oxy sign-in dialog instead.
   */
  open: () => void;
}

export const AskAliaContext = createContext<AskAliaContextValue | null>(null);

export function useAskAlia(): AskAliaContextValue {
  const value = useContext(AskAliaContext);
  if (!value) throw new Error('useAskAlia must be used within an AskAliaProvider');
  return value;
}
