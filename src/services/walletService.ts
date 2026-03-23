import {
  NETWORK,
  SBTC_ASSET_NAME,
  SBTC_CONTRACT_ID,
  SWAP_CONTRACT_ID,
  SWXBTC_ASSET_NAME,
  SWXBTC_CONTRACT_ID,
  XBTC_ASSET_NAME,
  XBTC_CONTRACT_ID,
} from "@/lib/constants";
import {
  connect,
  disconnect,
  getLocalStorage,
  isConnected,
  request,
} from "@stacks/connect";
import { Cl, Pc } from "@stacks/transactions";

export interface WalletState {
  isConnected: boolean;
  stxAddress: string | null;
  btcAddress: string | null;
}

export const walletService = {
  /**
   * Connect to a Stacks wallet
   */
  async connect(): Promise<WalletState> {
    try {
      const response = await connect();
      const addresses = response?.addresses || [];

      const stxAddress =
        addresses.find(
          (addr: { address: string }) =>
            addr.address.startsWith("SP") || addr.address.startsWith("ST"),
        )?.address || null;

      const btcAddress =
        addresses.find(
          (addr: { address: string }) =>
            addr.address.startsWith("bc1") || addr.address.startsWith("tb1"),
        )?.address || null;

      return {
        isConnected: true,
        stxAddress,
        btcAddress,
      };
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  },

  /**
   * Disconnect the wallet
   */
  disconnect(): void {
    disconnect();
  },

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return isConnected();
  },

  /**
   * Get stored wallet data from local storage
   */
  getStoredWallet(): WalletState {
    const data = getLocalStorage();

    if (!data?.addresses) {
      return { isConnected: false, stxAddress: null, btcAddress: null };
    }

    const stxAddresses = data.addresses.stx || [];
    const btcAddresses = data.addresses.btc || [];

    return {
      isConnected: stxAddresses.length > 0,
      stxAddress: stxAddresses[0]?.address || null,
      btcAddress: btcAddresses[0]?.address || null,
    };
  },

  /**
   * Call the deposit-xbtc function on the swap contract
   * @param amount - Amount of xBTC to swap in sats
   * @param userAddress - The user's STX address for post conditions
   */
  async depositXbtc(
    amount: number,
    userAddress: string,
  ): Promise<{ txid: string }> {
    try {
      // Post condition: User sends xBTC
      const userSendsXbtc = Pc.principal(userAddress)
        .willSendEq(amount)
        .ft(XBTC_CONTRACT_ID, XBTC_ASSET_NAME);

      const response = await request("stx_callContract", {
        contract: SWAP_CONTRACT_ID,
        functionName: "deposit-xbtc",
        functionArgs: [Cl.uint(amount)],
        network: NETWORK,
        postConditionMode: "deny",
        postConditions: [userSendsXbtc],
      } as any);

      return { txid: response.txid };
    } catch (error) {
      console.error("Swap transaction failed:", error);
      throw error;
    }
  },

  /**
   * Call the claim sbtc function on the swap contract
   * @param amount - Amount of sBTC to receive (minimum of swxbtc balance of user and sbtc balance of contract) in sats
   * @param userAddress - The user's STX address for post conditions
   */
  async claimSbtc(
    amount: number,
    userAddress: string,
  ): Promise<{ txid: string }> {
    try {
      // Post condition: contract sends sBTC
      const contractSendsSbtc = Pc.principal(SWAP_CONTRACT_ID)
        .willSendGte(amount)
        .ft(SBTC_CONTRACT_ID, SBTC_ASSET_NAME);
      // Post condition: user burns SWXBTC
      const userBurnsSwxbtc = Pc.principal(userAddress)
        .willSendLte(amount)
        .ft(SWXBTC_CONTRACT_ID, SWXBTC_ASSET_NAME);

      const response = await request("stx_callContract", {
        contract: SWAP_CONTRACT_ID,
        functionName: "claim-sbtc",
        functionArgs: [],
        network: NETWORK,
        postConditionMode: "deny",
        postConditions: [contractSendsSbtc, userBurnsSwxbtc],
      });

      return { txid: response.txid };
    } catch (error) {
      console.error("Swap transaction failed:", error);
      throw error;
    }
  },

  /**
   * Call withdraw-xbtc function on the swap contract
   * @param amount - Amount of xBTC to withdraw in sats
   * @param userAddress - The user's STX address for post conditions
   */
  async withdrawXbtc(
    amount: number,
    userAddress: string,
  ): Promise<{ txid: string }> {
    try {
      // Post condition: contract sends xBTC
      const contractSendsXbtc = Pc.principal(SWAP_CONTRACT_ID)
        .willSendEq(amount)
        .ft(XBTC_CONTRACT_ID, XBTC_ASSET_NAME);
      const userBurnsSwxbtc = Pc.principal(userAddress)
        .willSendEq(amount)
        .ft(SWXBTC_CONTRACT_ID, SWXBTC_ASSET_NAME);
      const response = await request("stx_callContract", {
        contract: SWAP_CONTRACT_ID,
        functionName: "withdraw-xbtc",
        functionArgs: [Cl.uint(amount)],
        network: NETWORK,
        postConditionMode: "deny",
        postConditions: [contractSendsXbtc, userBurnsSwxbtc],
      });

      return { txid: response.txid };
    } catch (error) {
      console.error("Swap transaction failed:", error);
      throw error;
    }
  },

  /**
   * Call init-unwrap function on the swap contract
   * @param amount - Amount of xBTC to withdraw in sats (balance of contract)
   */
  async initUnwrap(
    amount: number,
    userAddress: string,
  ): Promise<{ txid: string }> {
    try {
      // Post condition: contract sends xBTC
      const contractSendsXbtc = Pc.principal(SWAP_CONTRACT_ID)
        .willSendEq(amount)
        .ft(XBTC_CONTRACT_ID, XBTC_ASSET_NAME);

      const response = await request("stx_callContract", {
        contract: SWAP_CONTRACT_ID,
        functionName: "init-unwrap",
        functionArgs: [Cl.uint(amount)],
        network: NETWORK,
        postConditionMode: "deny",
        postConditions: [contractSendsXbtc],
      });

      return { txid: response.txid };
    } catch (error) {
      console.error("Swap transaction failed:", error);
      throw error;
    }
  },

  /**
   * Get the swap contract address
   */
  getSwapContractAddress(): string {
    return SWAP_CONTRACT_ID;
  },
};
