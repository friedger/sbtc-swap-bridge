import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ContractBalance } from '@/services/stacksApiService';
import { BitcoinLogo } from '@/components/icons/BitcoinLogo';
import { SbtcLogo } from '@/components/icons/SbtcLogo';

interface ContractStatsProps {
  contractBalances: ContractBalance | null;
  isLoading: boolean;
}

export function ContractStats({ contractBalances, isLoading }: ContractStatsProps) {
  return (
    <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Contract Liquidity</CardTitle>
        <CardDescription>Available tokens in the swap contract</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* xBTC Balance */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3">
          <div className="flex items-center gap-3">
            <BitcoinLogo className="h-8 w-8" />
            <div>
              <p className="font-medium">xBTC</p>
              <p className="text-xs text-muted-foreground">Wrapped Bitcoin</p>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <span className="font-mono text-lg">
              {contractBalances?.xbtc.formatted || '0.00000000'}
            </span>
          )}
        </div>

        {/* sBTC Balance */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3">
          <div className="flex items-center gap-3">
            <SbtcLogo className="h-8 w-8" />
            <div>
              <p className="font-medium">sBTC</p>
              <p className="text-xs text-muted-foreground">Stacks Bitcoin</p>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <span className="font-mono text-lg">
              {contractBalances?.sbtc.formatted || '0.00000000'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
