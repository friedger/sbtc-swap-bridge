import {
  DUAL_STACKING_CONTRACT_ID,
  NETWORK,
  SBTC_ASSET_NAME,
  SBTC_CONTRACT_ID,
  SWAP_CONTRACT_ADDRESS,
  SWAP_CONTRACT_ID,
  SWAP_CONTRACT_NAME,
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
import {
  Cl,
  fetchCallReadOnlyFunction,
  Pc,
  UIntCV,
} from "@stacks/transactions";
import { stacksApiService } from "./stacksApiService";
export interface WalletState {
  isConnected: boolean;
  stxAddress: string | null;
  btcAddress: string | null;
}

export const walletService = {
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

      return { isConnected: true, stxAddress, btcAddress };
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  },

  disconnect(): void {
    disconnect();
  },

  isConnected(): boolean {
    return isConnected();
  },

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
   * Step 1: Deposit xBTC into the swap contract. User receives swxBTC receipt token.
   */
  async depositXbtc(
    amount: number,
    userAddress: string,
  ): Promise<{ txid: string }> {
    try {
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
      console.error("Deposit xBTC failed:", error);
      throw error;
    }
  },

  /**
   * Step 2: Claim sBTC by burning swxBTC receipt token.
   */
  async claimSbtc(
    amount: number,
    userAddress: string,
  ): Promise<{ txid: string }> {
    try {
      const contractSendsSbtc = Pc.principal(SWAP_CONTRACT_ID)
        .willSendGte(amount)
        .ft(SBTC_CONTRACT_ID, SBTC_ASSET_NAME);
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
      console.error("Claim sBTC failed:", error);
      throw error;
    }
  },

  /**
   * Withdraw xBTC (cancel swap) by burning swxBTC receipt token.
   */
  async withdrawXbtc(
    amount: number,
    userAddress: string,
  ): Promise<{ txid: string }> {
    try {
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
      console.error("Withdraw xBTC failed:", error);
      throw error;
    }
  },

  /**
   * Custodian: init-unwrap (no args per ABI)
   */
  async initUnwrap(): Promise<{ txid: string }> {
    try {
      const response = await request("stx_callContract", {
        contract: SWAP_CONTRACT_ID,
        functionName: "init-unwrap",
        functionArgs: [],
        network: NETWORK,
        postConditionMode: "allow",
      } as any);

      return { txid: response.txid };
    } catch (error) {
      console.error("Init unwrap failed:", error);
      throw error;
    }
  },

  /**
   * Enroll the swap contract into dual stacking
   */
  async enrollDualStacking(): Promise<{ txid: string }> {
    try {
      const response = await request("stx_callContract", {
        contract: SWAP_CONTRACT_ID,
        functionName: "enroll",
        functionArgs: [Cl.principal(DUAL_STACKING_CONTRACT_ID), Cl.none()],
        network: NETWORK,
      } as any);

      return { txid: response.txid };
    } catch (error) {
      console.error("Enroll transaction failed:", error);
      throw error;
    }
  },

  /**
   * Withdraw excess sBTC from the swap contract (anyone can call)
   */
  async withdrawExcessSbtc(): Promise<{ txid: string }> {
    try {
      //
      const contractSbtcBalance = (await fetchCallReadOnlyFunction({
        contractAddress: SWAP_CONTRACT_ADDRESS,
        contractName: SWAP_CONTRACT_NAME,
        functionName: "get-sbtc-balance",
        functionArgs: [Cl.principal(SWAP_CONTRACT_ID)],
        network: NETWORK,
        senderAddress: SWAP_CONTRACT_ID,
      })) as UIntCV;

      const sxbtcSupply = await stacksApiService.getSwxbtcTotalSupply();

      const amount =
        BigInt(contractSbtcBalance.value) - BigInt(sxbtcSupply.totalSupply);
      if (amount <= 0n) {
        throw new Error("No excess sBTC to withdraw");
      }
      const contractSendsSbtc = Pc.principal(SWAP_CONTRACT_ID)
        .willSendEq(amount)
        .ft(SBTC_CONTRACT_ID, SBTC_ASSET_NAME);
      const response = await request("stx_callContract", {
        contract: SWAP_CONTRACT_ID,
        functionName: "withdraw-excess-sbtc",
        functionArgs: [],
        postConditionMode: "deny",
        postConditions: [contractSendsSbtc],
        network: NETWORK,
      });

      return { txid: response.txid };
    } catch (error) {
      console.error("Withdraw excess sBTC failed:", error);
      throw error;
    }
  },
};
