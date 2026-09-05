// Minimal EIP-3085 (wallet_addEthereumChain) helper for EVM chains.
// Shared by the EVM detail pages (Monad now; Arc keeps its own copy).

export type AddWalletResult = 'added' | 'rejected' | 'unsupported' | 'error'

export interface EvmChainParams {
  chainId: string
  chainName: string
  nativeCurrency: { name: string; symbol: string; decimals: number }
  rpcUrls: string[]
  blockExplorerUrls: string[]
}

interface WalletLike {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

function getWallet(): WalletLike | null {
  if (typeof window === 'undefined') return null
  const eth = (window as unknown as { ethereum?: WalletLike }).ethereum
  return eth && typeof eth.request === 'function' ? eth : null
}

/** Adds an EVM network to the connected wallet via EIP-3085. */
export async function addEvmChainToWallet(params: EvmChainParams): Promise<AddWalletResult> {
  const wallet = getWallet()
  if (!wallet) return 'unsupported'
  try {
    await wallet.request({
      method: 'wallet_addEthereumChain',
      params: [params],
    })
    return 'added'
  } catch (err) {
    const code = (err as { code?: unknown })?.code
    return code === 4001 ? 'rejected' : 'error'
  }
}
