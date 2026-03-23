import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ContractBalance, UserBalances } from '@/services/stacksApiService';
import { SbtcLogo } from '@/components/icons/SbtcLogo';
import { BitcoinLogo } from '@/components/icons/BitcoinLogo';
import { EXPLORER_CONTRACT_URL } from '@/lib/constants';
import { ExternalLink } from 'lucide-react';

interface ContractStatsProps {
  contractBalances: ContractBalance | null;
  userBalances: UserBalances | null;
  isConnected: boolean;
  isLoading: boolean;
}

export function ContractStats({ contractBalances, userBalances, isConnected, isLoading }: ContractStatsProps) {
  return (
    <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Balances</CardTitle>
        <CardDescription>
          Contract &amp; wallet balances{' '}
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
        {/* Contract Balances */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Contract</p>
          <div className="space-y-2">
            <BalanceRow
              icon={<BitcoinLogo className="h-5 w-5 grayscale opacity-60" />}
              label="xBTC"
              value={contractBalances?.xbtc.formatted || '0.00000000'}
              isLoading={isLoading}
            />
            <BalanceRow
              icon={<SbtcLogo className="h-5 w-5" />}
              label="sBTC"
              value={contractBalances?.sbtc.formatted || '0.00000000'}
              isLoading={isLoading}
              highlight
            />
          </div>
        </div>

        {/* User Balances */}
        {isConnected && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Your Wallet</p>
            <div className="space-y-2">
              <BalanceRow
                icon={<BitcoinLogo className="h-5 w-5 grayscale opacity-60" />}
                label="xBTC"
                value={userBalances?.xbtc.formatted || '0.00000000'}
                isLoading={isLoading}
              />
              <BalanceRow
                icon={<SbtcLogo className="h-5 w-5" />}
                label="sBTC"
                value={userBalances?.sbtc.formatted || '0.00000000'}
                isLoading={isLoading}
                highlight
              />
              <BalanceRow
                icon={<BitcoinLogo className="h-5 w-5 grayscale opacity-40" />}
                label="swxBTC"
                sublabel="swap receipt"
                value={userBalances?.swxbtc.formatted || '0.00000000'}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BalanceRow({ icon, label, sublabel, value, isLoading, highlight }: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  value: string;
  isLoading: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between rounded-lg border p-2.5 ${highlight ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-background/50'}`}>
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <span className={`text-sm font-medium ${highlight ? 'text-primary' : 'text-foreground'}`}>{label}</span>
          {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-5 w-20" />
      ) : (
        <span className={`font-mono text-sm ${highlight ? 'text-primary' : ''}`}>{value}</span>
      )}
    </div>
  );
}
