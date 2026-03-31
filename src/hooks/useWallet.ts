import {
  ContractBalance,
  stacksApiService,
  TotalSupply,
  UserBalances,
} from "@/services/stacksApiService";
import {
  transactionWebSocketService,
  TxStatus,
} from "@/services/transactionWebSocketService";
import { walletService, WalletState } from "@/services/walletService";
import { useCallback, useEffect, useState } from "react";

interface UseWalletReturn {
  wallet: WalletState;
  userBalances: UserBalances | null;
  contractBalances: ContractBalance | null;
  swxbtcSupply: TotalSupply | null;
  isLoading: boolean;
  isSwapping: boolean;
  txStatus: TxStatus | null;
  txid: string | null;
  isDialogOpen: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  depositXbtc: () => Promise<void>;
  claimSbtc: () => Promise<void>;
  withdrawXbtc: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  closeDialog: () => void;
}

export function useWallet(): UseWalletReturn {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    stxAddress: null,
    btcAddress: null,
  });

  const [userBalances, setUserBalances] = useState<UserBalances | null>(null);
  const [contractBalances, setContractBalances] =
    useState<ContractBalance | null>(null);
  const [swxbtcSupply, setSwxbtcSupply] = useState<TotalSupply | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus | null>(null);
  const [txid, setTxid] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const stored = walletService.getStoredWallet();
    if (stored.isConnected) {
      setWallet(stored);
    }
  }, []);

  useEffect(() => {
    if (wallet.stxAddress) {
      refreshBalances();
    }
  }, [wallet.stxAddress]);

  useEffect(() => {
    fetchContractBalances();
  }, []);

  const fetchContractBalances = async () => {
    try {
      const balances = await stacksApiService.getSwapContractBalance();
      setContractBalances(balances);
      const swxbtcSupply = await stacksApiService.getSwxbtcTotalSupply();
      setSwxbtcSupply(swxbtcSupply);
    } catch (error) {
      console.error("Failed to fetch contract balances:", error);
    }
  };

  const refreshBalances = useCallback(async () => {
    if (!wallet.stxAddress) return;

    setIsLoading(true);
    try {
      const [user, contract, swxbtcSupply] = await Promise.all([
        stacksApiService.getUserBalances(wallet.stxAddress),
        stacksApiService.getSwapContractBalance(),
        stacksApiService.getSwxbtcTotalSupply(),
      ]);
      setUserBalances(user);
      setContractBalances(contract);
      setSwxbtcSupply(swxbtcSupply);
    } catch (error) {
      console.error("Failed to refresh balances:", error);
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
      console.error("Failed to connect:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    walletService.disconnect();
    setWallet({ isConnected: false, stxAddress: null, btcAddress: null });
    setUserBalances(null);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    if (txStatus === "success" || txStatus === "failed") {
      setTxStatus(null);
      setTxid(null);
    }
  };

  const handleTx = async (txCall: () => Promise<{ txid: string }>) => {
    setIsSwapping(true);
    setTxStatus("pending");
    setIsDialogOpen(true);

    try {
      const { txid: newTxid } = await txCall();
      setTxid(newTxid);

      transactionWebSocketService.subscribeToTransaction(newTxid, (status) => {
        setTxStatus(status);
        if (status === "success" || status === "failed") {
          setIsSwapping(false);
          if (status === "success") refreshBalances();
        }
      });
    } catch (error) {
      console.error("Transaction failed:", error);
      setTxStatus("failed");
      setIsSwapping(false);
    }
  };

  const depositXbtc = async () => {
    if (!wallet.stxAddress || !userBalances) return;
    const amount = Number(BigInt(userBalances.xbtc.balance));
    if (amount <= 0) return;
    await handleTx(() => walletService.depositXbtc(amount, wallet.stxAddress!));
  };

  const claimSbtc = async () => {
    if (!wallet.stxAddress || !userBalances || !contractBalances) return;
    const userSwxbtc = BigInt(userBalances.swxbtc.balance);
    const contractSbtc = BigInt(contractBalances.sbtc.balance);
    const amount = Number(
      userSwxbtc < contractSbtc ? userSwxbtc : contractSbtc,
    );
    if (amount <= 0) return;
    await handleTx(() => walletService.claimSbtc(amount, wallet.stxAddress!));
  };

  const withdrawXbtc = async () => {
    if (!wallet.stxAddress || !userBalances || !contractBalances) return;
    const userSwxbtc = BigInt(userBalances.swxbtc.balance);
    const contractXbtc = BigInt(contractBalances.xbtc.balance);
    const amount = Number(
      userSwxbtc < contractXbtc ? userSwxbtc : contractXbtc,
    );
    if (amount <= 0) return;
    await handleTx(() =>
      walletService.withdrawXbtc(amount, wallet.stxAddress!),
    );
  };

  return {
    wallet,
    userBalances,
    contractBalances,
    swxbtcSupply,
    isLoading,
    isSwapping,
    txStatus,
    txid,
    isDialogOpen,
    connect,
    disconnect,
    depositXbtc,
    claimSbtc,
    withdrawXbtc,
    refreshBalances,
    closeDialog,
  };
}
