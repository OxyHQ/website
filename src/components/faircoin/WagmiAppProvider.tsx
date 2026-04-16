import type { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { FAIRCOIN_WAGMI_CONFIG } from '../../lib/wagmi-config'

/**
 * Mounts the wagmi provider for FairCoin pages that need wallet access.
 *
 * Wagmi v2 requires a `QueryClientProvider` ancestor — the app already has one
 * at the root (`App.tsx`), so this component only adds the wagmi layer. It is
 * kept in its own module so the wagmi/walletconnect bundles only load on the
 * pages that import it (the redemption flow), not the marketing pages.
 */
export default function WagmiAppProvider({ children }: { children: ReactNode }) {
  return <WagmiProvider config={FAIRCOIN_WAGMI_CONFIG}>{children}</WagmiProvider>
}
