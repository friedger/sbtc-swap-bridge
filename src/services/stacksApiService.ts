import { createClient } from '@stacks/blockchain-api-client';
import { Cl, fetchCallReadOnlyFunction } from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';

// Contract addresses - update with actual addresses
const XBTC_CONTRACT_ADDRESS = 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR';
const XBTC_CONTRACT_NAME = 'Wrapped-Bitcoin';
const SBTC_CONTRACT_ADDRESS = 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4';
const SBTC_CONTRACT_NAME = 'sbtc-token';
const SWAP_CONTRACT_ADDRESS = 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9';
const SWAP_CONTRACT_NAME = 'xbtc-to-sbtc-swap';

// Create API client
const client = createClient({
  baseUrl: 'https://api.mainnet.hiro.so',
});

export interface TokenBalance {
  balance: string;
  decimals: number;
  formatted: string;
}

export interface ContractBalance {
  xbtc: TokenBalance;
  sbtc: TokenBalance;
}

export const stacksApiService = {
  /**
   * Get xBTC balance for an address
   */
  async getXbtcBalance(address: string): Promise<TokenBalance> {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: XBTC_CONTRACT_ADDRESS,
        contractName: XBTC_CONTRACT_NAME,
        functionName: 'get-balance',
        functionArgs: [Cl.principal(address)],
        network: STACKS_MAINNET,
        senderAddress: address,
      });

      const balance = result.type === 'ok' && result.value.type === 'uint' 
        ? result.value.value 
        : '0';
      
      const decimals = 8;
      const formatted = formatBalance(balance.toString(), decimals);

      return { balance: balance.toString(), decimals, formatted };
    } catch (error) {
      console.error('Failed to fetch xBTC balance:', error);
      return { balance: '0', decimals: 8, formatted: '0.00000000' };
    }
  },

  /**
   * Get sBTC balance for an address
   */
  async getSbtcBalance(address: string): Promise<TokenBalance> {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: SBTC_CONTRACT_ADDRESS,
        contractName: SBTC_CONTRACT_NAME,
        functionName: 'get-balance',
        functionArgs: [Cl.principal(address)],
        network: STACKS_MAINNET,
        senderAddress: address,
      });

      const balance = result.type === 'ok' && result.value.type === 'uint' 
        ? result.value.value 
        : '0';
      
      const decimals = 8;
      const formatted = formatBalance(balance.toString(), decimals);

      return { balance: balance.toString(), decimals, formatted };
    } catch (error) {
      console.error('Failed to fetch sBTC balance:', error);
      return { balance: '0', decimals: 8, formatted: '0.00000000' };
    }
  },

  /**
   * Get the swap contract's token balances
   */
  async getSwapContractBalance(): Promise<ContractBalance> {
    const contractAddress = `${SWAP_CONTRACT_ADDRESS}.${SWAP_CONTRACT_NAME}`;
    
    const [xbtc, sbtc] = await Promise.all([
      this.getXbtcBalance(SWAP_CONTRACT_ADDRESS),
      this.getSbtcBalance(SWAP_CONTRACT_ADDRESS),
    ]);

    return { xbtc, sbtc };
  },

  /**
   * Get user balances for both tokens
   */
  async getUserBalances(address: string): Promise<ContractBalance> {
    const [xbtc, sbtc] = await Promise.all([
      this.getXbtcBalance(address),
      this.getSbtcBalance(address),
    ]);

    return { xbtc, sbtc };
  },

  /**
   * Get transaction status
   */
  async getTransactionStatus(txid: string): Promise<string> {
    try {
      const { data } = await client.GET('/extended/v1/tx/{tx_id}', {
        params: {
          path: { tx_id: txid },
        },
      });

      return data?.tx_status || 'pending';
    } catch (error) {
      console.error('Failed to fetch transaction status:', error);
      return 'unknown';
    }
  },

  /**
   * Poll transaction until confirmed or failed
   */
  async waitForTransaction(txid: string, maxAttempts = 60): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getTransactionStatus(txid);
      
      if (status === 'success' || status === 'abort_by_response' || status === 'abort_by_post_condition') {
        return status;
      }
      
      // Wait 5 seconds between checks
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    return 'timeout';
  },
};

/**
 * Format balance with decimals
 */
function formatBalance(balance: string, decimals: number): string {
  const num = BigInt(balance);
  const divisor = BigInt(10 ** decimals);
  const whole = num / divisor;
  const fraction = num % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0');
  
  return `${whole}.${fractionStr}`;
}
