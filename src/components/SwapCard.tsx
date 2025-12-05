import { ArrowDown, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContractBalance } from '@/services/stacksApiService';
import { BitcoinLogo } from '@/components/icons/BitcoinLogo';
import { SbtcLogo } from '@/components/icons/SbtcLogo';

interface SwapCardProps {
  userBalances: ContractBalance | null;
  contractBalances: ContractBalance | null;
  isConnected: boolean;
  isSwapping: boolean;
  txStatus: string | null;
  onSwap: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function SwapCard({
  userBalances,
  contractBalances,
  isConnected,
  isSwapping,
  txStatus,
  onSwap,
  onRefresh,
  isLoading,
}: SwapCardProps) {
  const xbtcBalance = userBalances?.xbtc.formatted || '0.00000000';
  const userXbtc = userBalances ? BigInt(userBalances.xbtc.balance) : 0n;
  const contractSbtc = contractBalances ? BigInt(contractBalances.sbtc.balance) : 0n;
  const swapAmount = userXbtc < contractSbtc ? userXbtc : contractSbtc;
  const swapAmountFormatted = (Number(swapAmount) / 100_000_000).toFixed(8);
  const canSwap = swapAmount > 0n;

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Swap xBTC → sBTC</CardTitle>
            <CardDescription>One-way swap on Stacks</CardDescription>
          </div>
          {isConnected && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="rounded-lg border border-border bg-background/50 p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>From</span>
            {isConnected && (
              <span>Balance: {xbtcBalance}</span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-semibold">
              {isConnected ? swapAmountFormatted : '—'}
            </span>
            <div className="flex items-center gap-2 rounded-full bg-accent px-3 py-1">
              <BitcoinLogo className="h-6 w-6" />
              <span className="font-medium text-accent-foreground">xBTC</span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="rounded-full border border-border bg-card p-2">
            <ArrowDown className="h-4 w-4 text-primary" />
          </div>
        </div>

        {/* To Token */}
        <div className="rounded-lg border border-border bg-background/50 p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>To</span>
            {isConnected && userBalances && (
              <span>Balance: {userBalances.sbtc.formatted}</span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-semibold">
              {isConnected ? swapAmountFormatted : '—'}
            </span>
            <div className="flex items-center gap-2 rounded-full bg-accent px-3 py-1">
              <SbtcLogo className="h-6 w-6" />
              <span className="font-medium text-accent-foreground">sBTC</span>
            </div>
          </div>
        </div>

        {/* Swap Info */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rate</span>
            <span>1 xBTC = 1 sBTC</span>
          </div>
        </div>

        {/* Status Message */}
        {txStatus && (
          <div className={`rounded-lg p-3 text-sm text-center ${
            txStatus === 'success' 
              ? 'bg-green-500/10 text-green-500' 
              : txStatus === 'failed' || txStatus.startsWith('abort')
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary'
          }`}>
            {txStatus === 'pending' && 'Waiting for wallet confirmation...'}
            {txStatus === 'submitted' && 'Transaction submitted. Waiting for confirmation...'}
            {txStatus === 'success' && 'Swap completed successfully!'}
            {txStatus === 'failed' && 'Transaction failed. Please try again.'}
            {txStatus === 'timeout' && 'Transaction is taking longer than expected.'}
            {txStatus.startsWith('abort') && 'Transaction was aborted.'}
          </div>
        )}

        {/* Swap Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={onSwap}
          disabled={!isConnected || !canSwap || isSwapping}
        >
          {isSwapping ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Swapping...
            </>
          ) : !isConnected ? (
            'Connect Wallet to Swap'
          ) : !canSwap ? (
            userXbtc === 0n ? 'No xBTC to Swap' : 'Insufficient Contract sBTC'
          ) : (
            'Swap All xBTC'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
