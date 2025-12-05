import {
  connect,
  disconnect,
  isConnected,
  getLocalStorage,
  request,
} from "@stacks/connect";
import { Cl, Pc } from "@stacks/transactions";
import {
  SWAP_CONTRACT_ID,
  SWAP_CONTRACT_ADDRESS,
  SWAP_CONTRACT_NAME,
  XBTC_CONTRACT_ADDRESS,
  XBTC_CONTRACT_NAME,
  SBTC_CONTRACT_ADDRESS,
  SBTC_CONTRACT_NAME,
  NETWORK,
  XBTC_ASSET_NAME,
  SBTC_CONTRACT_ID,
  XBTC_CONTRACT_ID,
} from "@/lib/constants";

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
            addr.address.startsWith("SP") || addr.address.startsWith("ST")
        )?.address || null;

      const btcAddress =
        addresses.find(
          (addr: { address: string }) =>
            addr.address.startsWith("bc1") || addr.address.startsWith("tb1")
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
   * Call the xbtc-to-sbtc-swap function on the swap contract
   * @param amount - Amount of xBTC to swap in sats
   * @param userAddress - The user's STX address for post conditions
   */
  async swap(amount: number, userAddress: string): Promise<{ txid: string }> {
    try {
      // Post condition: User sends xBTC
      const userSendsXbtc = Pc.principal(userAddress)
        .willSendEq(amount)
        .ft(XBTC_CONTRACT_ID, XBTC_ASSET_NAME);

      // Post condition: Contract sends sBTC
      const contractSendsSbtc = Pc.principal(SWAP_CONTRACT_ID)
        .willSendEq(amount)
        .ft(SBTC_CONTRACT_ID, XBTC_ASSET_NAME);

      const response = await request("stx_callContract", {
        contract: SWAP_CONTRACT_ID,
        functionName: "xbtc-to-sbtc-swap",
        functionArgs: [Cl.uint(amount)],
        network: NETWORK,
        postConditionMode: "deny",
        postConditions: [userSendsXbtc, contractSendsSbtc],
      } as any);

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
