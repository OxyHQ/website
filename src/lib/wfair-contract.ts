/**
 * WFAIR (wrapped FairCoin) contract on Base.
 *
 * Address verified at https://basescan.org/address/0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3.
 *
 * Only the surface used by the redemption flow is exposed: ERC-20 metadata
 * (decimals/symbol/balanceOf) for showing the user's balance, and `bridgeBurn`
 * for the redemption call itself.
 */
import type { Abi } from 'viem'

export const WFAIR_ADDRESS = '0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3' as const

export const WFAIR_ABI = [
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'paused',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'bridgeBurn',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'faircoinAddress', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'event',
    name: 'BridgeBurn',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'faircoinAddress', type: 'bytes', indexed: false },
    ],
    anonymous: false,
  },
] as const satisfies Abi

/** WFAIR uses 18 decimals (matches the contract literal). */
export const WFAIR_DECIMALS = 18 as const

/** Bridge contract enforces 26–35 byte faircoin address payloads. */
export const FAIRCOIN_ADDRESS_BYTES = { min: 26, max: 35 } as const
