import { useState, useEffect, useCallback } from 'react';
import { walletService, WalletState } from '@/services/walletService';
import { stacksApiService, ContractBalance } from '@/services/stacksApiService';

interface UseWalletReturn {
  wallet: WalletState;
  userBalances: ContractBalance | null;
  contractBalances: ContractBalance | null;
  isLoading: boolean;
  isSwapping: boolean;
  txStatus: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  swap: () => Promise<void>;
  refreshBalances: () => Promise<void>;
}

export function useWallet(): UseWalletReturn {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    stxAddress: null,
    btcAddress: null,
  });
  const [userBalances, setUserBalances] = useState<ContractBalance | null>(null);
  const [contractBalances, setContractBalances] = useState<ContractBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Load stored wallet on mount
  useEffect(() => {
    const stored = walletService.getStoredWallet();
    if (stored.isConnected) {
      setWallet(stored);
    }
  }, []);

  // Fetch balances when wallet connects
  useEffect(() => {
    if (wallet.stxAddress) {
      refreshBalances();
    }
  }, [wallet.stxAddress]);

  // Fetch contract balances on mount
  useEffect(() => {
    fetchContractBalances();
  }, []);

  const fetchContractBalances = async () => {
    try {
      const balances = await stacksApiService.getSwapContractBalance();
      setContractBalances(balances);
    } catch (error) {
      console.error('Failed to fetch contract balances:', error);
    }
  };

  const refreshBalances = useCallback(async () => {
    if (!wallet.stxAddress) return;
    
    setIsLoading(true);
    try {
      const [user, contract] = await Promise.all([
        stacksApiService.getUserBalances(wallet.stxAddress),
        stacksApiService.getSwapContractBalance(),
      ]);
      setUserBalances(user);
      setContractBalances(contract);
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    } finally {
      setIsLoading(false);
    }
  }, [wallet.stxAddress]);

  const connect = async () => {
    setIsLoading(true);
    try {
      const result = await walletService.connect();
      setWallet(result);
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    walletService.disconnect();
    setWallet({
      isConnected: false,
      stxAddress: null,
      btcAddress: null,
    });
    setUserBalances(null);
  };

  const swap = async () => {
    if (!wallet.stxAddress || !userBalances) return;
    
    const xbtcAmount = parseInt(userBalances.xbtc.balance, 10);
    if (xbtcAmount <= 0) return;
    
    setIsSwapping(true);
    setTxStatus('pending');
    
    try {
      const { txid } = await walletService.swap(xbtcAmount, wallet.stxAddress);
      setTxStatus('submitted');
      
      // Wait for transaction confirmation
      const finalStatus = await stacksApiService.waitForTransaction(txid);
      setTxStatus(finalStatus);
      
      if (finalStatus === 'success') {
        // Refresh balances after successful swap
        await refreshBalances();
      }
    } catch (error) {
      console.error('Swap failed:', error);
      setTxStatus('failed');
    } finally {
      setIsSwapping(false);
    }
  };

  return {
    wallet,
    userBalances,
    contractBalances,
    isLoading,
    isSwapping,
    txStatus,
    connect,
    disconnect,
    swap,
    refreshBalances,
  };
}
