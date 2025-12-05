import { connect, disconnect, isConnected, getLocalStorage, request } from '@stacks/connect';
import { SWAP_CONTRACT_ID, NETWORK } from '@/lib/constants';

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
      
      const stxAddress = addresses.find(
        (addr: { address: string }) => addr.address.startsWith('SP') || addr.address.startsWith('ST')
      )?.address || null;
      
      const btcAddress = addresses.find(
        (addr: { address: string }) => addr.address.startsWith('bc1') || addr.address.startsWith('tb1')
      )?.address || null;

      return {
        isConnected: true,
        stxAddress,
        btcAddress,
      };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
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
   * Call the swap-all function on the swap contract
   */
  async swapAll(): Promise<{ txid: string }> {
    try {
      const response = await request('stx_callContract', {
        contract: SWAP_CONTRACT_ID,
        functionName: 'swap-all',
        functionArgs: [],
        network: NETWORK,
      });

      return { txid: response.txid };
    } catch (error) {
      console.error('Swap transaction failed:', error);
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
