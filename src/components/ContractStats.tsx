import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ContractBalance, TotalSupply } from '@/services/stacksApiService';
import { BitcoinLogo } from '@/components/icons/BitcoinLogo';
import { SbtcLogo } from '@/components/icons/SbtcLogo';

interface ContractStatsProps {
  contractBalances: ContractBalance | null;
  xbtcTotalSupply: TotalSupply | null;
  isLoading: boolean;
}

function calculatePercentage(sbtcBalance: string | undefined, totalSupply: string | undefined): string {
  if (!sbtcBalance || !totalSupply || totalSupply === '0') return '0.00';
  const sbtc = BigInt(sbtcBalance);
  const supply = BigInt(totalSupply);
  if (supply === BigInt(0)) return '0.00';
  // Calculate percentage with 4 decimal precision
  const percentage = (sbtc * BigInt(10000) / supply);
  const whole = percentage / BigInt(100);
  const decimal = percentage % BigInt(100);
  return `${whole}.${decimal.toString().padStart(2, '0')}`;
}

export function ContractStats({ contractBalances, xbtcTotalSupply, isLoading }: ContractStatsProps) {
  const percentage = calculatePercentage(
    contractBalances?.sbtc.balance,
    xbtcTotalSupply?.totalSupply
  );

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

        {/* Coverage Percentage */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              sBTC Coverage of xBTC Supply
            </p>
            {isLoading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <span className="font-mono font-medium text-primary">
                {percentage}%
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Total xBTC supply: {xbtcTotalSupply?.formatted || '0.00000000'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
