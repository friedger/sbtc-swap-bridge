import { ArrowDown, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContractBalance } from '@/services/stacksApiService';
import { UserBalances } from '@/services/stacksApiService';
import { BitcoinLogo } from '@/components/icons/BitcoinLogo';
import { SbtcLogo } from '@/components/icons/SbtcLogo';
import { TxStatus } from '@/services/transactionWebSocketService';

interface SwapCardProps {
  userBalances: UserBalances | null;
  contractBalances: ContractBalance | null;
  isConnected: boolean;
  isSwapping: boolean;
  txStatus: TxStatus | null;
  onDeposit: () => void;
  onClaim: () => void;
  onWithdraw: () => void;
  onRefresh: () => void;
  onConnect: () => void;
  isLoading: boolean;
}

export function SwapCard({
  userBalances,
  contractBalances,
  isConnected,
  isSwapping,
  txStatus,
  onDeposit,
  onClaim,
  onWithdraw,
  onRefresh,
  onConnect,
  isLoading,
}: SwapCardProps) {
  const userXbtc = userBalances ? BigInt(userBalances.xbtc.balance) : 0n;
  const userSwxbtc = userBalances ? BigInt(userBalances.swxbtc.balance) : 0n;
  const contractSbtc = contractBalances ? BigInt(contractBalances.sbtc.balance) : 0n;
  const contractXbtc = contractBalances ? BigInt(contractBalances.xbtc.balance) : 0n;

  const canDeposit = userXbtc > 0n;
  const canClaim = userSwxbtc > 0n && contractSbtc > 0n;
  const canWithdraw = userSwxbtc > 0n && contractXbtc > 0n;

  const fmt = (v: bigint) => (Number(v) / 1e8).toFixed(8);

  // Determine which step the user is on
  const hasSwxbtc = userSwxbtc > 0n;

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Swap xBTC → <span style={{ color: '#FF5512' }}>sBTC</span></CardTitle>
            <CardDescription>Two-step swap on Stacks</CardDescription>
          </div>
          {isConnected && (
            <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Deposit xBTC */}
        <div className={`rounded-lg border p-4 ${!hasSwxbtc ? 'border-primary/50 bg-primary/5' : 'border-border bg-background/50 opacity-60'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${!hasSwxbtc ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</div>
            <span className="text-sm font-medium">Deposit xBTC</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BitcoinLogo className="h-5 w-5 grayscale opacity-60" />
              <span className="text-sm text-muted-foreground">Your xBTC</span>
            </div>
            <span className="font-mono text-sm">{isConnected ? userBalances?.xbtc.formatted || '0.00000000' : '—'}</span>
          </div>
          <Button
            className="w-full"
            size="sm"
            onClick={onDeposit}
            disabled={!isConnected || !canDeposit || isSwapping}
          >
            {isSwapping && !hasSwxbtc ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Depositing...</>
            ) : !isConnected ? 'Connect Wallet' : !canDeposit ? 'No xBTC' : (
              `Deposit ${fmt(userXbtc)} xBTC`
            )}
          </Button>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Wait for custodian</span>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Step 2: Claim sBTC */}
        <div className={`rounded-lg border p-4 ${hasSwxbtc ? 'border-primary/50 bg-primary/5' : 'border-border bg-background/50 opacity-60'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${hasSwxbtc ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
            <span className="text-sm font-medium">Claim sBTC</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SbtcLogo className="h-5 w-5" />
              <span className="text-sm text-muted-foreground">Your swxBTC (receipt)</span>
            </div>
            <span className="font-mono text-sm">{isConnected ? userBalances?.swxbtc.formatted || '0.00000000' : '—'}</span>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              size="sm"
              onClick={onClaim}
              disabled={!isConnected || !canClaim || isSwapping}
            >
              {isSwapping && hasSwxbtc ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Claiming...</>
              ) : !canClaim ? 'Claim sBTC' : (
                `Claim ${fmt(userSwxbtc < contractSbtc ? userSwxbtc : contractSbtc)} sBTC`
              )}
            </Button>
            {canWithdraw && (
              <Button
                variant="outline"
                size="sm"
                onClick={onWithdraw}
                disabled={isSwapping}
                title="Withdraw xBTC instead (if contract still has xBTC)"
              >
                Withdraw xBTC
              </Button>
            )}
          </div>
        </div>

        {/* Status Message */}
        {txStatus && (
          <div className={`rounded-lg p-3 text-sm text-center ${
            txStatus === 'success' 
              ? 'bg-green-500/10 text-green-500' 
              : txStatus === 'failed'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary'
          }`}>
            {txStatus === 'pending' && 'Waiting for wallet confirmation...'}
            {txStatus === 'submitted' && 'Transaction submitted...'}
            {txStatus === 'in_mempool' && 'In mempool, waiting for confirmation...'}
            {txStatus === 'success' && 'Transaction completed successfully!'}
            {txStatus === 'failed' && 'Transaction failed. Please try again.'}
          </div>
        )}

        {/* Rate Info */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rate</span>
            <span>1 xBTC = 1 sBTC</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
