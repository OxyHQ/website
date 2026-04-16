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

// Only enable WalletConnect when the operator provisions a real project at
// https://cloud.reown.com. The placeholder ID returns 403 on getWallets and
// 3000 "Project not found" on the relayer socket, which spams the console.
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as
  | string
  | undefined

const connectors = [
  injected({ shimDisconnect: true }),
  coinbaseWallet({
    appName: 'FairCoin',
    appLogoUrl: 'https://fairco.in/logo.jpg',
  }),
  ...(WALLETCONNECT_PROJECT_ID
    ? [
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
      ]
    : []),
]

export const FAIRCOIN_WAGMI_CONFIG = createConfig({
  chains: [base],
  connectors,
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
