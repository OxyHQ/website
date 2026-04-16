/**
 * Wagmi v2 + viem v2 configuration for the FairCoin web app.
 *
 * Wallet connection is only used by the WFAIR redemption flow (`/unwrap`) so
 * the config is intentionally minimal: Base mainnet (chainId 8453) only,
 * three connectors (injected/MetaMask, WalletConnect, Coinbase Wallet), and
 * the public Base RPC endpoint.
 *
 * The WalletConnect Project ID is read from `VITE_WALLETCONNECT_PROJECT_ID`
 * with a fall-through dev placeholder so previews still load. Production
 * deployments should provision a real Project ID at https://cloud.reown.com.
 */
import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

const PUBLIC_BASE_RPC = 'https://mainnet.base.org'

const WALLETCONNECT_PROJECT_ID =
  (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ??
  // Public dev placeholder used by Reown's example apps. Limited rate budget,
  // visible to anyone with devtools — only acceptable for local previews.
  '3fbb6bba6f1de962d911bb5b5c3dba68'

export const FAIRCOIN_WAGMI_CONFIG = createConfig({
  chains: [base],
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
      metadata: {
        name: 'FairCoin',
        description: 'Redeem WFAIR for native FAIR via the FairCoin bridge.',
        url: 'https://fairco.in',
        icons: ['https://fairco.in/logo.jpg'],
      },
    }),
    coinbaseWallet({
      appName: 'FairCoin',
      appLogoUrl: 'https://fairco.in/logo.jpg',
    }),
  ],
  transports: {
    [base.id]: http(PUBLIC_BASE_RPC),
  },
  ssr: false,
})

declare module 'wagmi' {
  interface Register {
    config: typeof FAIRCOIN_WAGMI_CONFIG
  }
}
