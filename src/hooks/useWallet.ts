import { useState, useEffect, useCallback } from 'react';
import { walletService, WalletState } from '@/services/walletService';
import { stacksApiService, ContractBalance, TotalSupply } from '@/services/stacksApiService';
import { transactionWebSocketService, TxStatus } from '@/services/transactionWebSocketService';

interface UseWalletReturn {
  wallet: WalletState;
  userBalances: ContractBalance | null;
  contractBalances: ContractBalance | null;
  xbtcTotalSupply: TotalSupply | null;
  isLoading: boolean;
  isSwapping: boolean;
  txStatus: TxStatus | null;
  txid: string | null;
  isDialogOpen: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  swap: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  closeDialog: () => void;
}

export function useWallet(): UseWalletReturn {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    stxAddress: null,
    btcAddress: null,
  });
  const [userBalances, setUserBalances] = useState<ContractBalance | null>(null);
  const [contractBalances, setContractBalances] = useState<ContractBalance | null>(null);
  const [xbtcTotalSupply, setXbtcTotalSupply] = useState<TotalSupply | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus | null>(null);
  const [txid, setTxid] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  // Fetch contract balances and xBTC total supply on mount
  useEffect(() => {
    fetchContractBalancesAndSupply();
  }, []);

  const fetchContractBalancesAndSupply = async () => {
    try {
      const [balances, supply] = await Promise.all([
        stacksApiService.getSwapContractBalance(),
        stacksApiService.getXbtcTotalSupply(),
      ]);
      setContractBalances(balances);
      setXbtcTotalSupply(supply);
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

  const closeDialog = () => {
    setIsDialogOpen(false);
    // Reset tx state after closing
    if (txStatus === 'success' || txStatus === 'failed') {
      setTxStatus(null);
      setTxid(null);
    }
  };

  const swap = async () => {
    if (!wallet.stxAddress || !userBalances || !contractBalances) return;
    
    const userXbtc = BigInt(userBalances.xbtc.balance);
    const contractSbtc = BigInt(contractBalances.sbtc.balance);
    const swapAmount = userXbtc < contractSbtc ? userXbtc : contractSbtc;
    
    if (swapAmount <= 0n) return;
    
    setIsSwapping(true);
    setTxStatus('pending');
    setIsDialogOpen(true);
    
    try {
      const { txid: newTxid } = await walletService.depositXbtc(Number(swapAmount), wallet.stxAddress);
      setTxid(newTxid);
      
      // Subscribe to transaction updates via WebSocket
      transactionWebSocketService.subscribeToTransaction(newTxid, (status, data) => {
        setTxStatus(status);
        
        if (status === 'success') {
          setIsSwapping(false);
          refreshBalances();
        } else if (status === 'failed') {
          setIsSwapping(false);
        }
      });
    } catch (error) {
      console.error('Swap failed:', error);
      setTxStatus('failed');
      setIsSwapping(false);
    }
  };

  return {
    wallet,
    userBalances,
    contractBalances,
    xbtcTotalSupply,
    isLoading,
    isSwapping,
    txStatus,
    txid,
    isDialogOpen,
    connect,
    disconnect,
    swap,
    refreshBalances,
    closeDialog,
  };
}
