import { Header } from "@/components/Header";
import { BitcoinLogo } from "@/components/icons/BitcoinLogo";
import { SbtcLogo } from "@/components/icons/SbtcLogo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/hooks/useTheme";
import { useWallet } from "@/hooks/useWallet";
import {
  CUSTODIAN_ADDRESS,
  DEPLOYER_ADDRESS,
  EXPLORER_TX_BASE_URL,
  KNOWN_PEG_ADDRESS,
  STACKS_API_URL,
  SWAP_CONTRACT_ID,
  XBTC_ASSET_NAME,
  XBTC_CONTRACT_ADDRESS,
  XBTC_CONTRACT_NAME,
} from "@/lib/constants";
import {
  ContractCallTx,
  FtEvent,
  stacksApiService,
} from "@/services/stacksApiService";
import { walletService } from "@/services/walletService";
import {
  AlertTriangle,
  ArrowDownToLine,
  BaggageClaim,
  ExternalLink,
  Loader2,
  Shield,
  Sprout,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MatchedUnwrap {
  unwrapTx: ContractCallTx;
  amount: string;
  matchedSbtcEvent?: FtEvent;
  matchedAmount?: string;
}

export default function Custodian() {
  const { wallet, connect, disconnect, isLoading, contractBalances, swxbtcSupply } =
    useWallet();
  const { theme, toggleTheme } = useTheme();
  const [isUnwrapping, setIsUnwrapping] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [unwrapTxs, setUnwrapTxs] = useState<MatchedUnwrap[]>([]);
  const [sbtcEvents, setSbtcEvents] = useState<FtEvent[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(true);
  const [pegAddress, setPegAddress] = useState<string | null>(null);

  const isCustodian = wallet.stxAddress === CUSTODIAN_ADDRESS;
  const isDeployer = wallet.stxAddress === DEPLOYER_ADDRESS;
  const contractXbtc = contractBalances
    ? BigInt(contractBalances.xbtc.balance)
    : 0n;
  const canInitUnwrap = contractXbtc > 0n;
  const canFinalizeUnwrap = KNOWN_PEG_ADDRESS === pegAddress;
  const noExcessSbtc = contractBalances
    ? BigInt(contractBalances.sbtc.balance) <= BigInt(swxbtcSupply?.totalSupply || 0n)
    : true;


  // Fetch transaction history and FT events
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingTxs(true);
      try {
        const [initUnwrapTxs, ftEvents, address] = await Promise.all([
          stacksApiService.getContractTransactions("init-unwrap", 20),
          stacksApiService.getSwapContractFtEvents(50),
          stacksApiService.getSbtcPegAddress(),
        ]);

        setSbtcEvents(ftEvents);
        setPegAddress(address);

        // Fetch events for each init-unwrap tx to derive xBTC amount
        const matched: MatchedUnwrap[] = await Promise.all(
          initUnwrapTxs.map(async (tx) => {
            // Fetch individual tx to get events
            let amount = "0";
            try {
              const txResponse = await fetch(
                `${STACKS_API_URL}/extended/v1/tx/${tx.tx_id}`,
              );
              if (txResponse.ok) {
                const txData = await txResponse.json();
                const xbtcAssetId = `${XBTC_CONTRACT_ADDRESS}.${XBTC_CONTRACT_NAME}::${XBTC_ASSET_NAME}`;
                const xbtcEvent = (txData.events || []).find(
                  (e: any) =>
                    e.event_type === "fungible_token_asset" &&
                    e.asset?.asset_id === xbtcAssetId,
                );
                if (xbtcEvent?.asset?.amount) {
                  amount = xbtcEvent.asset.amount;
                }
              }
            } catch (e) {
              console.error("Failed to fetch tx events:", e);
            }

            // Try to find a matching incoming sBTC event with the same amount
            const matchedEvent = ftEvents.find(
              (e) =>
                e.asset?.amount === amount &&
                e.asset?.recipient === SWAP_CONTRACT_ID,
            );

            return {
              unwrapTx: tx,
              amount,
              matchedSbtcEvent: matchedEvent,
              matchedAmount: matchedEvent?.asset?.amount,
            };
          }),
        );

        setUnwrapTxs(matched);
      } catch (error) {
        console.error("Failed to fetch custodian data:", error);
      } finally {
        setIsLoadingTxs(false);
      }
    };

    fetchData();
  }, []);

  const fmt = (v: string) => {
    const num = BigInt(v);
    const whole = num / 100000000n;
    const frac = num % 100000000n;
    return `${whole}.${frac.toString().padStart(8, "0")}`;
  };

  const shortTxid = (txid: string) => `${txid.slice(0, 6)}…${txid.slice(-4)}`;

  const handleInitUnwrap = async () => {
    if (!wallet.isConnected || !isCustodian) return;
    setIsUnwrapping(true);
    try {
      const { txid } = await walletService.initUnwrap();
      toast.success("Init unwrap transaction submitted", {
        description: `TX: ${txid.slice(0, 10)}...`,
      });
    } catch (error) {
      console.error("Init unwrap failed:", error);
      toast.error("Init unwrap failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsUnwrapping(false);
    }
  };

  const handleWithdrawExcess = async () => {
    if (!wallet.isConnected) return;
    setIsWithdrawing(true);
    try {
      const { txid } = await walletService.withdrawExcessSbtc();
      toast.success("Withdraw excess sBTC submitted", {
        description: `TX: ${txid.slice(0, 10)}...`,
      });
    } catch (error) {
      console.error("Withdrawal failed:", error);
      toast.error("Withdrawal failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleEnroll = async () => {
    if (!wallet.isConnected || !isDeployer) return;
    setIsEnrolling(true);
    try {
      const { txid } = await walletService.enrollDualStacking();
      toast.success("Enrollment transaction submitted", {
        description: `TX: ${txid.slice(0, 10)}...`,
      });
    } catch (error) {
      console.error("Enrollment failed:", error);
      toast.error("Enrollment failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  // Unmatched sBTC incoming events (not matched to any unwrap)
  const matchedTxIds = new Set(
    unwrapTxs
      .filter((m) => m.matchedSbtcEvent)
      .map((m) => m.matchedSbtcEvent!.tx_id),
  );
  const unmatchedSbtcEvents = sbtcEvents.filter(
    (e) => !matchedTxIds.has(e.tx_id),
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        isConnected={wallet.isConnected}
        stxAddress={wallet.stxAddress}
        isLoading={isLoading}
        onConnect={connect}
        onDisconnect={disconnect}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage the swap contract as custodian or deployer.
            </p>
          </div>

          {/* Contract balances summary */}
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Contract Balances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <BitcoinLogo className="h-4 w-4 grayscale opacity-60" />
                  <span className="font-mono text-sm">
                    {contractBalances?.xbtc.formatted || "0.00000000"} xBTC
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <SbtcLogo className="h-4 w-4" />
                  <span className="font-mono text-sm">
                    {contractBalances?.sbtc.formatted || "0.00000000"} sBTC
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Init Unwrap Card */}
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Init Unwrap
              </CardTitle>
              <CardDescription>
                Initiate the xBTC unwrap process. Available when the contract
                holds xBTC.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wallet.isConnected && !isCustodian && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive my-4">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p>Only the custodian can call init-unwrap.</p>
                </div>
              )}
              <Button
                onClick={handleInitUnwrap}
                disabled={
                  isUnwrapping ||
                  !wallet.isConnected ||
                  !isCustodian ||
                  !canInitUnwrap
                }
                className="w-full"
              >
                {isUnwrapping ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : !canInitUnwrap ? (
                  "No xBTC in Contract"
                ) : (
                  "Init Unwrap"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Finalize Unwrap */}
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BaggageClaim className="h-5 w-5 text-primary" />
                Finalize Unwrap
              </CardTitle>
              <CardDescription>
                Init-unwrap calls and matched incoming sBTC transfers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pegAddress && (
                <div className="flex items-start gap-2 mb-4 rounded-lg border border-border/50 bg-muted/40 p-3 text-sm">
                  {canFinalizeUnwrap ? (
                    <span className="text-orange-500 font-bold shrink-0">
                      ✓
                    </span>
                  ) : (
                    <span className="text-red-500 font-bold shrink-0">✗</span>
                  )}
                  <div className="min-w-0">
                    <span className="text-muted-foreground">
                      sBTC Peg Wallet:{" "}
                    </span>
                    <code className="text-[10px] break-all">{pegAddress}</code>
                  </div>
                </div>
              )}
              {isLoadingTxs ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : unwrapTxs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent unwrap transactions found
                </p>
              ) : (
                <div className="space-y-2">
                  {unwrapTxs.map((match) => (
                    <div
                      key={match.unwrapTx.tx_id}
                      className={`rounded-lg border p-3 text-sm ${
                        match.matchedSbtcEvent
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-yellow-500/30 bg-yellow-500/5"
                      }`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="font-medium">init-unwrap</span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {fmt(match.amount)} xBTC
                            </span>
                          </div>
                          <a
                            href={`${EXPLORER_TX_BASE_URL}/${match.unwrapTx.tx_id}?chain=mainnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {shortTxid(match.unwrapTx.tx_id)}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                        <div className="sm:text-right shrink-0">
                          {match.matchedSbtcEvent ? (
                            <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                ✓ sBTC received
                              </span>
                              <a
                                href={`${EXPLORER_TX_BASE_URL}/${match.matchedSbtcEvent.tx_id}?chain=mainnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
                              >
                                {shortTxid(match.matchedSbtcEvent.tx_id)}
                                <ExternalLink className="h-2 w-2" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                              ⏳ Awaiting sBTC
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Unmatched incoming sBTC */}
              {unmatchedSbtcEvents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Other incoming sBTC transfers (unmatched)
                  </p>
                  <div className="space-y-1.5">
                    {unmatchedSbtcEvents.map((event, i) => (
                      <div
                        key={`${event.tx_id}-${i}`}
                        className="flex items-center justify-between rounded border border-border/50 p-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <SbtcLogo className="h-3 w-3" />
                          <span className="font-mono">
                            {fmt(event.asset.amount)} sBTC
                          </span>
                        </div>
                        <a
                          href={`${EXPLORER_TX_BASE_URL}/${event.tx_id}?chain=mainnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          {shortTxid(event.tx_id)}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enroll Card */}
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-primary" />
                Enroll in Dual Stacking
              </CardTitle>
              <CardDescription>
                Register the swap contract for dual stacking rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wallet.isConnected && !isDeployer && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive my-4">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p>Only the deployer can enroll.</p>
                </div>
              )}
              <Button
                onClick={handleEnroll}
                disabled={isEnrolling || !wallet.isConnected || !isDeployer}
                variant="secondary"
                className="w-full"
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  "Enroll Contract"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Withdraw Excess Card */}
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownToLine className="h-5 w-5 text-primary" />
                Withdraw Excess sBTC
              </CardTitle>
              <CardDescription>
                Anyone can withdraw excess sBTC from the swap contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              {noExcessSbtc && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600 my-4">
                  <span className="font-bold shrink-0">✗</span>
                  <p>No excess sBTC to withdraw.</p>
                </div>
              )}
              <Button
                onClick={handleWithdrawExcess}
                disabled={isWithdrawing || !wallet.isConnected || noExcessSbtc}
                variant="secondary"
                className="w-full"
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  "Withdraw Excess sBTC"
                )}
              </Button>
            </CardContent>
          </Card>

          {!wallet.isConnected && (
            <p className="text-center text-sm text-muted-foreground">
              Connect your wallet to perform these actions
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
