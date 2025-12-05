import { createClient } from '@stacks/blockchain-api-client';

// Contract addresses - update with actual addresses
const XBTC_CONTRACT_ADDRESS = 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR';
const XBTC_CONTRACT_NAME = 'Wrapped-Bitcoin';
const SBTC_CONTRACT_ADDRESS = 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4';
const SBTC_CONTRACT_NAME = 'sbtc-token';
const SWAP_CONTRACT_ADDRESS = 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9';
const SWAP_CONTRACT_NAME = 'xbtc-sbtc-swap';

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
   * Get token balances for an address using address balances API
   */
  async getAddressBalances(address: string): Promise<ContractBalance> {
    try {
      const { data } = await client.GET('/extended/v1/address/{principal}/balances', {
        params: {
          path: { principal: address },
        },
      });

      const xbtcKey = `${XBTC_CONTRACT_ADDRESS}.${XBTC_CONTRACT_NAME}::wrapped-bitcoin`;
      const sbtcKey = `${SBTC_CONTRACT_ADDRESS}.${SBTC_CONTRACT_NAME}::sbtc-token`;

      const xbtcBalance = data?.fungible_tokens?.[xbtcKey]?.balance || '0';
      const sbtcBalance = data?.fungible_tokens?.[sbtcKey]?.balance || '0';

      return {
        xbtc: {
          balance: xbtcBalance,
          decimals: 8,
          formatted: formatBalance(xbtcBalance, 8),
        },
        sbtc: {
          balance: sbtcBalance,
          decimals: 8,
          formatted: formatBalance(sbtcBalance, 8),
        },
      };
    } catch (error) {
      console.error('Failed to fetch address balances:', error);
      return {
        xbtc: { balance: '0', decimals: 8, formatted: '0.00000000' },
        sbtc: { balance: '0', decimals: 8, formatted: '0.00000000' },
      };
    }
  },

  /**
   * Get the swap contract's token balances
   */
  async getSwapContractBalance(): Promise<ContractBalance> {
    return this.getAddressBalances(SWAP_CONTRACT_ADDRESS);
  },

  /**
   * Get user balances for both tokens
   */
  async getUserBalances(address: string): Promise<ContractBalance> {
    return this.getAddressBalances(address);
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
