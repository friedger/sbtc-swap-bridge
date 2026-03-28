import {
  NETWORK,
  SBTC_CONTRACT_ADDRESS,
  SBTC_CONTRACT_NAME,
  STACKS_API_URL,
  SWAP_CONTRACT_ADDRESS,
  SWAP_CONTRACT_ID,
  SWAP_CONTRACT_NAME,
  SWXBTC_CONTRACT_ADDRESS,
  SWXBTC_CONTRACT_NAME,
  XBTC_CONTRACT_ADDRESS,
  XBTC_CONTRACT_NAME
} from "@/lib/constants";
import { createClient } from "@stacks/blockchain-api-client";
import {
  fetchCallReadOnlyFunction,
  ResponseOkCV,
  UIntCV,
} from "@stacks/transactions";

// Create API client
const client = createClient({
  baseUrl: STACKS_API_URL,
});

export interface TokenBalance {
  balance: string;
  decimals: number;
  formatted: string;
}

export interface UserBalances {
  xbtc: TokenBalance;
  sbtc: TokenBalance;
  swxbtc: TokenBalance;
}

export interface ContractBalance {
  xbtc: TokenBalance;
  sbtc: TokenBalance;
}

export interface TotalSupply {
  totalSupply: string;
  formatted: string;
}

export interface ContractCallTx {
  tx_id: string;
  sender_address: string;
  contract_call: {
    contract_id: string;
    function_name: string;
    function_args: Array<{ repr: string; name: string; type: string }>;
  };
  tx_status: string;
  burn_block_time_iso: string;
  block_height: number;
  events?: Array<{
    event_type: string;
    asset?: {
      asset_event_type: string;
      asset_id: string;
      sender: string;
      recipient: string;
      amount: string;
    };
  }>;
}

export interface FtEvent {
  tx_id: string;
  asset: {
    asset_event_type: string;
    asset_id: string;
    sender: string;
    recipient: string;
    amount: string;
  };
  event_type: string;
}

export const stacksApiService = {
  /**
   * Get token balances for an address (contract: xBTC + sBTC only)
   */
  async getAddressBalances(address: string): Promise<ContractBalance> {
    try {
      const { data } = await client.GET(
        "/extended/v1/address/{principal}/balances",
        {
          params: {
            path: { principal: address },
          },
        }
      );

      const xbtcKey = `${XBTC_CONTRACT_ADDRESS}.${XBTC_CONTRACT_NAME}::wrapped-bitcoin`;
      const sbtcKey = `${SBTC_CONTRACT_ADDRESS}.${SBTC_CONTRACT_NAME}::sbtc-token`;

      const xbtcBalance = data?.fungible_tokens?.[xbtcKey]?.balance || "0";
      const sbtcBalance = data?.fungible_tokens?.[sbtcKey]?.balance || "0";

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
      console.error("Failed to fetch address balances:", error);
      return {
        xbtc: { balance: "0", decimals: 8, formatted: "0.00000000" },
        sbtc: { balance: "0", decimals: 8, formatted: "0.00000000" },
      };
    }
  },

  /**
   * Get user balances including swxBTC
   */
  async getUserBalances(address: string): Promise<UserBalances> {
    try {
      const { data } = await client.GET(
        "/extended/v1/address/{principal}/balances",
        {
          params: {
            path: { principal: address },
          },
        }
      );

      const xbtcKey = `${XBTC_CONTRACT_ADDRESS}.${XBTC_CONTRACT_NAME}::wrapped-bitcoin`;
      const sbtcKey = `${SBTC_CONTRACT_ADDRESS}.${SBTC_CONTRACT_NAME}::sbtc-token`;
      const swxbtcKey = `${SWXBTC_CONTRACT_ADDRESS}.${SWXBTC_CONTRACT_NAME}::${SWXBTC_CONTRACT_NAME}`;

      const xbtcBalance = data?.fungible_tokens?.[xbtcKey]?.balance || "0";
      const sbtcBalance = data?.fungible_tokens?.[sbtcKey]?.balance || "0";
      const swxbtcBalance = data?.fungible_tokens?.[swxbtcKey]?.balance || "0";

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
        swxbtc: {
          balance: swxbtcBalance,
          decimals: 8,
          formatted: formatBalance(swxbtcBalance, 8),
        },
      };
    } catch (error) {
      console.error("Failed to fetch user balances:", error);
      return {
        xbtc: { balance: "0", decimals: 8, formatted: "0.00000000" },
        sbtc: { balance: "0", decimals: 8, formatted: "0.00000000" },
        swxbtc: { balance: "0", decimals: 8, formatted: "0.00000000" },
      };
    }
  },

  /**
   * Get the swap contract's token balances
   */
  async getSwapContractBalance(): Promise<ContractBalance> {
    return this.getAddressBalances(SWAP_CONTRACT_ID);
  },

  /**
   * Get transaction by txid
   */
  async getTransaction(txid: string) {
    const { data } = await client.GET("/extended/v1/tx/{tx_id}", {
      params: {
        path: { tx_id: txid },
      },
    });
    return data;
  },

  /**
   * Get transaction status
   */
  async getTransactionStatus(txid: string): Promise<string> {
    try {
      const data = await this.getTransaction(txid);
      return data?.tx_status || "pending";
    } catch (error) {
      console.error("Failed to fetch transaction status:", error);
      return "unknown";
    }
  },

  /**
   * Poll transaction until confirmed or failed
   */
  async waitForTransaction(txid: string, maxAttempts = 60): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getTransactionStatus(txid);

      if (
        status === "success" ||
        status === "abort_by_response" ||
        status === "abort_by_post_condition"
      ) {
        return status;
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    return "timeout";
  },

  /**
   * Get xBTC total supply
   */
  async getXbtcTotalSupply(): Promise<TotalSupply> {
    try {
      const response = (await fetchCallReadOnlyFunction({
        contractAddress: XBTC_CONTRACT_ADDRESS,
        contractName: XBTC_CONTRACT_NAME,
        functionName: "get-total-supply",
        functionArgs: [],
        network: NETWORK,
        senderAddress: XBTC_CONTRACT_ADDRESS,
      })) as ResponseOkCV<UIntCV>;

      const totalSupply = response.value.value.toString();
      return {
        totalSupply,
        formatted: formatBalance(totalSupply, 8),
      };
    } catch (error) {
      console.error("Failed to fetch xBTC total supply:", error);
      return { totalSupply: "0", formatted: "0.00000000" };
    }
  },

  /**
   * Get swxBTC total supply
   */
  async getSwxbtcTotalSupply(): Promise<TotalSupply> {
    try {
      const response = (await fetchCallReadOnlyFunction({
        contractAddress: SWXBTC_CONTRACT_ADDRESS,
        contractName: SWXBTC_CONTRACT_NAME,
        functionName: "get-total-supply",
        functionArgs: [],
        network: NETWORK,
        senderAddress: SWXBTC_CONTRACT_ADDRESS,
      })) as ResponseOkCV<UIntCV>;

      const totalSupply = response.value.value.toString();
      return {
        totalSupply,
        formatted: formatBalance(totalSupply, 8),
      };
    } catch (error) {
      console.error("Failed to fetch swxBTC total supply:", error);
      return { totalSupply: "0", formatted: "0.00000000" };
    }
  },

  /**
   * Get recent transactions for the swap contract, filtered by function name
   */
  async getContractTransactions(functionName?: string, limit = 20): Promise<ContractCallTx[]> {
    try {
      const response = await fetch(
        `${STACKS_API_URL}/extended/v1/address/${SWAP_CONTRACT_ID}/transactions?limit=${limit}`
      );
      if (!response.ok) return [];
      const data = await response.json();
      
      let txs = (data.results || []).filter(
        (tx: any) => tx.tx_type === "contract_call" && tx.tx_status === "success"
      );
      
      if (functionName) {
        txs = txs.filter(
          (tx: any) => tx.contract_call?.function_name === functionName
        );
      }
      
      return txs;
    } catch (error) {
      console.error("Failed to fetch contract transactions:", error);
      return [];
    }
  },

  /**
   * Get recent FT events (sBTC transfers) for the swap contract
   */
  async getSwapContractFtEvents(limit = 50): Promise<FtEvent[]> {
    try {
      const response = await fetch(
        `${STACKS_API_URL}/extended/v1/address/${SWAP_CONTRACT_ID}/assets?limit=${limit}`
      );
      if (!response.ok) return [];
      const data = await response.json();
      
      const sbtcAssetId = `${SBTC_CONTRACT_ADDRESS}.${SBTC_CONTRACT_NAME}::sbtc-token`;
      
      return (data.results || []).filter(
        (event: any) =>
          event.event_type === "fungible_token_asset" &&
          event.asset?.asset_id === sbtcAssetId &&
          event.asset?.recipient === SWAP_CONTRACT_ID
      );
    } catch (error) {
      console.error("Failed to fetch FT events:", error);
      return [];
    }
  },

  /**
   * Get BTC peg wallet address from sBTC registry
   */
  async getSbtcPegAddress(): Promise<string | null> {
    try {
      const response = await fetch(
        `${STACKS_API_URL}/v2/contracts/call-read/${SBTC_CONTRACT_ADDRESS}/sbtc-registry/get-current-signer-data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: SWAP_CONTRACT_ADDRESS,
            arguments: [],
          }),
        }
      );
      if (!response.ok) return null;
      const data = await response.json();
      // The response contains the signer data including the BTC address
      // This is a best-effort extraction
      return data?.result || null;
    } catch (error) {
      console.error("Failed to fetch sBTC peg address:", error);
      return null;
    }
  },

  /**
   * Get transaction events (FT transfers within a tx)
   */
  async getTransactionEvents(txid: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${STACKS_API_URL}/extended/v1/tx/events?tx_id=${txid}`
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error("Failed to fetch tx events:", error);
      return [];
    }
  },
};

function formatBalance(balance: string, decimals: number): string {
  const num = BigInt(balance);
  const divisor = BigInt(10 ** decimals);
  const whole = num / divisor;
  const fraction = num % divisor;
  const fractionStr = fraction.toString().padStart(decimals, "0");

  return `${whole}.${fractionStr}`;
}
