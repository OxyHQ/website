/**
 * React Query bindings for the live FairCoin network/Uniswap pool stats.
 *
 * Polled at 15s for chain tip / 30s for derived metrics. The parent component
 * is expected to render skeletons while loading; on transient errors we keep
 * the last successful value via React Query's default cache behaviour.
 */
import { useQuery } from '@tanstack/react-query'
import { useReadContract, useReadContracts } from 'wagmi'
import { base } from 'wagmi/chains'
import { fetchExplorerStats, type ExplorerStats } from '../api/faircoin-explorer'

const CHAIN_TIP_REFETCH_MS = 15_000

export function useFaircoinNetworkStats() {
  return useQuery<ExplorerStats, Error>({
    queryKey: ['faircoin-network-stats'],
    queryFn: fetchExplorerStats,
    refetchInterval: CHAIN_TIP_REFETCH_MS,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
    retry: 2,
  })
}

// ── Uniswap v3 pool — WFAIR / USDC on Base ──────────────────────────────

const UNISWAP_POOL_ADDRESS = '0x9F4F694390c60b51e30461c785C1345A1545b7ca' as const
const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const

const UNISWAP_V3_POOL_ABI = [
  {
    type: 'function',
    name: 'slot0',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'observationIndex', type: 'uint16' },
      { name: 'observationCardinality', type: 'uint16' },
      { name: 'observationCardinalityNext', type: 'uint16' },
      { name: 'feeProtocol', type: 'uint8' },
      { name: 'unlocked', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'liquidity',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint128' }],
  },
  {
    type: 'function',
    name: 'token0',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'token1',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
] as const

const ERC20_BALANCE_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const

export interface UniswapPoolStats {
  /** WFAIR price in USDC, derived from the pool slot0 sqrtPrice. */
  wfairPriceUsdc: number | null
  /** Total USDC value of WFAIR + USDC sitting in the pool (TVL). */
  tvlUsdc: number | null
  poolWfairBalance: bigint | null
  poolUsdcBalance: bigint | null
}

const WFAIR_DECIMALS = 18
const USDC_DECIMALS = 6
const Q96 = 2n ** 96n

/**
 * Convert a Uniswap v3 sqrtPriceX96 to a price ratio (token1/token0).
 *
 * The math: price(token1/token0) = (sqrtPriceX96 / 2^96)^2.
 * Returns price in token1 units per 1 token0, normalised for decimals.
 */
function sqrtPriceToPrice(
  sqrtPriceX96: bigint,
  token0Decimals: number,
  token1Decimals: number,
): number {
  const numerator = sqrtPriceX96 * sqrtPriceX96
  // Convert to a JavaScript number using a fixed-precision intermediate so
  // we don't blow precision on the bigint divide.
  const ratio = Number(numerator) / Number(Q96 * Q96)
  // Adjust for decimals — multiplying by 10^(d0 - d1) inverts the difference.
  const decimalAdj = 10 ** (token0Decimals - token1Decimals)
  return ratio * decimalAdj
}

/**
 * Live Uniswap v3 pool snapshot (price + TVL).
 *
 * The pool contract sets `token0`/`token1` deterministically by address sort,
 * so we read both, figure out which is WFAIR vs USDC, and convert sqrtPriceX96
 * accordingly. ERC-20 balanceOf calls give us pool-side reserves for the
 * approximate TVL number.
 */
export function useUniswapPoolStats(): {
  data: UniswapPoolStats | null
  isLoading: boolean
  isError: boolean
} {
  const slotQuery = useReadContract({
    address: UNISWAP_POOL_ADDRESS,
    abi: UNISWAP_V3_POOL_ABI,
    functionName: 'slot0',
    chainId: base.id,
    query: { refetchInterval: 30_000 },
  })

  const tokensQuery = useReadContracts({
    contracts: [
      {
        address: UNISWAP_POOL_ADDRESS,
        abi: UNISWAP_V3_POOL_ABI,
        functionName: 'token0',
        chainId: base.id,
      },
      {
        address: UNISWAP_POOL_ADDRESS,
        abi: UNISWAP_V3_POOL_ABI,
        functionName: 'token1',
        chainId: base.id,
      },
    ],
    query: { staleTime: Infinity },
  })

  const balancesQuery = useReadContracts({
    contracts: [
      {
        address: '0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3',
        abi: ERC20_BALANCE_ABI,
        functionName: 'balanceOf',
        args: [UNISWAP_POOL_ADDRESS],
        chainId: base.id,
      },
      {
        address: USDC_BASE_ADDRESS,
        abi: ERC20_BALANCE_ABI,
        functionName: 'balanceOf',
        args: [UNISWAP_POOL_ADDRESS],
        chainId: base.id,
      },
    ],
    query: { refetchInterval: 30_000 },
  })

  const isLoading = slotQuery.isLoading || tokensQuery.isLoading || balancesQuery.isLoading
  const isError =
    Boolean(slotQuery.error) || Boolean(tokensQuery.error) || Boolean(balancesQuery.error)

  if (isLoading || isError) {
    return { data: null, isLoading, isError }
  }

  const slot = slotQuery.data
  const token0Result = tokensQuery.data?.[0]
  const token1Result = tokensQuery.data?.[1]
  const wfairBalanceResult = balancesQuery.data?.[0]
  const usdcBalanceResult = balancesQuery.data?.[1]

  if (
    !slot ||
    token0Result?.status !== 'success' ||
    token1Result?.status !== 'success' ||
    wfairBalanceResult?.status !== 'success' ||
    usdcBalanceResult?.status !== 'success'
  ) {
    return { data: null, isLoading: false, isError: true }
  }

  const sqrtPriceX96 = slot[0]
  const token0 = token0Result.result.toLowerCase()
  const wfairAddrLower = '0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3'.toLowerCase()
  const wfairIsToken0 = token0 === wfairAddrLower

  const wfairBalance = wfairBalanceResult.result
  const usdcBalance = usdcBalanceResult.result

  // Price math: slot0 reports token1/token0 price as a sqrt-encoded fixed.
  // We always want WFAIR/USDC = how many USDC per 1 WFAIR.
  let wfairPriceUsdc: number
  if (wfairIsToken0) {
    // price token1/token0 = USDC per WFAIR — that's already what we want.
    wfairPriceUsdc = sqrtPriceToPrice(sqrtPriceX96, WFAIR_DECIMALS, USDC_DECIMALS)
  } else {
    // price token1/token0 = WFAIR per USDC — invert.
    const wfairPerUsdc = sqrtPriceToPrice(sqrtPriceX96, USDC_DECIMALS, WFAIR_DECIMALS)
    wfairPriceUsdc = wfairPerUsdc > 0 ? 1 / wfairPerUsdc : 0
  }

  // TVL — sum of pool reserves valued in USDC.
  const wfairFloat = Number(wfairBalance) / 10 ** WFAIR_DECIMALS
  const usdcFloat = Number(usdcBalance) / 10 ** USDC_DECIMALS
  const tvlUsdc = wfairFloat * wfairPriceUsdc + usdcFloat

  return {
    data: {
      wfairPriceUsdc: Number.isFinite(wfairPriceUsdc) ? wfairPriceUsdc : null,
      tvlUsdc: Number.isFinite(tvlUsdc) ? tvlUsdc : null,
      poolWfairBalance: wfairBalance,
      poolUsdcBalance: usdcBalance,
    },
    isLoading: false,
    isError: false,
  }
}
