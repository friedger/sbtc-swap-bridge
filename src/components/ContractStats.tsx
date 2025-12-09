import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ContractBalance, TotalSupply } from '@/services/stacksApiService';
import { SbtcLogo } from '@/components/icons/SbtcLogo';
import { EXPLORER_CONTRACT_URL } from '@/lib/constants';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ContractStatsProps {
  contractBalances: ContractBalance | null;
  xbtcTotalSupply: TotalSupply | null;
  isLoading: boolean;
}

function calculateLiquidSupply(totalSupply: string | undefined, contractXbtcBalance: string | undefined): bigint {
  if (!totalSupply) return BigInt(0);
  const supply = BigInt(totalSupply);
  const contractXbtc = contractXbtcBalance ? BigInt(contractXbtcBalance) : BigInt(0);
  return supply - contractXbtc;
}

function calculatePercentage(sbtcBalance: string | undefined, liquidSupply: bigint): number {
  if (!sbtcBalance || liquidSupply === BigInt(0)) return 0;
  const sbtc = BigInt(sbtcBalance);
  // Calculate percentage with 4 decimal precision
  const percentage = Number((sbtc * BigInt(10000) / liquidSupply)) / 100;
  return percentage;
}

function formatPercentage(percentage: number): string {
  return percentage.toFixed(2);
}

function formatBigIntBalance(value: bigint, decimals: number = 8): string {
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  return `${whole}.${fraction.toString().padStart(decimals, '0')}`;
}

export function ContractStats({ contractBalances, xbtcTotalSupply, isLoading }: ContractStatsProps) {
  const liquidSupply = calculateLiquidSupply(
    xbtcTotalSupply?.totalSupply,
    contractBalances?.xbtc.balance
  );
  const percentage = calculatePercentage(
    contractBalances?.sbtc.balance,
    liquidSupply
  );
  const liquidSupplyFormatted = formatBigIntBalance(liquidSupply);
  const isOverCoverage = percentage > 100;

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Contract Liquidity</CardTitle>
        <CardDescription>
          Available tokens in the swap contract{' '}
          <a 
            href={EXPLORER_CONTRACT_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* sBTC Balance */}
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-3">
            <SbtcLogo className="h-8 w-8" />
            <div>
              <p className="font-medium text-primary">sBTC</p>
              <p className="text-xs text-muted-foreground">Stacks Bitcoin</p>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <span className="font-mono text-lg text-primary">
              {contractBalances?.sbtc.formatted || '0.00000000'}
            </span>
          )}
        </div>

        {/* Coverage Percentage */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="text-primary">sBTC</span> Coverage of Liquid <span className="text-muted-foreground/70">xBTC</span> Supply
            </p>
            {isLoading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <span className={`font-mono font-medium ${isOverCoverage ? 'text-green-500' : 'text-primary'}`}>
                {isOverCoverage ? (
                  <Link to="/manage" className="hover:underline flex items-center gap-1">
                    {formatPercentage(percentage)}%
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  `${formatPercentage(percentage)}%`
                )}
              </span>
            )}
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-muted-foreground">
              Total xBTC supply: {xbtcTotalSupply?.formatted || '0.00000000'}
            </p>
            <p className="text-xs text-muted-foreground">
              Contract xBTC balance: {contractBalances?.xbtc.formatted || '0.00000000'}
            </p>
            <p className="text-xs text-muted-foreground">
              Liquid xBTC supply: {liquidSupplyFormatted}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
