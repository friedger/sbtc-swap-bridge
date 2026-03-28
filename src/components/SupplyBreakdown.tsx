import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractBalance, TotalSupply } from "@/services/stacksApiService";
import { BitcoinLogo } from "@/components/icons/BitcoinLogo";
import { SbtcLogo } from "@/components/icons/SbtcLogo";

interface SupplyBreakdownProps {
  contractBalances: ContractBalance | null;
  swxbtcSupply: TotalSupply | null;
  isLoading: boolean;
}

export function SupplyBreakdown({
  contractBalances,
  swxbtcSupply,
  isLoading,
}: SupplyBreakdownProps) {
  if (isLoading || !contractBalances || !swxbtcSupply) {
    return (
      <Card className="w-full border-border/50 bg-card/80 backdrop-blur mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Swap Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  const swxbtcTotal = BigInt(swxbtcSupply.totalSupply);
  const contractXbtc = BigInt(contractBalances.xbtc.balance);
  const contractSbtc = BigInt(contractBalances.sbtc.balance);

  // "In unwrapping" = swxBTC supply - xBTC in contract - sBTC in contract
  const accounted = contractXbtc + contractSbtc;
  const inUnwrapping = swxbtcTotal > accounted ? swxbtcTotal - accounted : 0n;
  const excessSbtc = accounted > swxbtcTotal ? contractSbtc - (swxbtcTotal - contractXbtc) : 0n;

  const fmt = (v: bigint) => {
    const whole = v / 100000000n;
    const frac = v % 100000000n;
    return `${whole}.${frac.toString().padStart(8, "0")}`;
  };

  // Bar widths (percentage of swxBTC supply or total if excess)
  const total = swxbtcTotal > 0n ? swxbtcTotal : 1n;
  const barTotal = excessSbtc > 0n ? accounted : total;
  const xbtcPct = Number((contractXbtc * 1000n) / barTotal) / 10;
  const sbtcPct = Number(((contractSbtc - excessSbtc) * 1000n) / barTotal) / 10;
  const unwrapPct = Number((inUnwrapping * 1000n) / barTotal) / 10;
  const excessPct = excessSbtc > 0n ? Number((excessSbtc * 1000n) / barTotal) / 10 : 0;

  return (
    <Card className="w-full border-border/50 bg-card/80 backdrop-blur mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Swap Status</CardTitle>
        <p className="text-xs text-muted-foreground">
          swxBTC receipt tokens vs contract holdings
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stacked bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>swxBTC Supply: {swxbtcSupply.formatted}</span>
          </div>
          <div className="flex h-8 w-full overflow-hidden rounded-md border border-border/50">
            {xbtcPct > 0 && (
              <div
                className="flex items-center justify-center bg-muted-foreground/30 text-[10px] font-medium"
                style={{ width: `${xbtcPct}%` }}
                title={`xBTC: ${fmt(contractXbtc)}`}
              >
                {xbtcPct > 8 && "xBTC"}
              </div>
            )}
            {sbtcPct > 0 && (
              <div
                className="flex items-center justify-center text-[10px] font-medium text-white"
                style={{
                  width: `${sbtcPct}%`,
                  backgroundColor: "#FF5512",
                }}
                title={`sBTC: ${fmt(contractSbtc - excessSbtc)}`}
              >
                {sbtcPct > 8 && "sBTC"}
              </div>
            )}
            {unwrapPct > 0 && (
              <div
                className="flex items-center justify-center bg-primary/20 text-[10px] font-medium text-primary border-l border-dashed border-primary/40"
                style={{ width: `${unwrapPct}%` }}
                title={`In unwrapping: ${fmt(inUnwrapping)}`}
              >
                {unwrapPct > 12 && "unwrapping"}
              </div>
            )}
            {excessPct > 0 && (
              <div
                className="flex items-center justify-center text-[10px] font-medium text-white border-l border-dashed"
                style={{
                  width: `${excessPct}%`,
                  backgroundColor: "#FF5512",
                  opacity: 0.5,
                }}
                title={`Excess sBTC: ${fmt(excessSbtc)}`}
              >
                {excessPct > 8 && "excess"}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <BitcoinLogo className="h-3.5 w-3.5 shrink-0 grayscale opacity-60" />
              <span className="text-muted-foreground whitespace-nowrap">xBTC in contract:</span>
            </div>
            <span className="font-mono shrink-0">{contractBalances.xbtc.formatted}</span>
          </div>
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <SbtcLogo className="h-3.5 w-3.5 shrink-0" />
              <span className="text-muted-foreground whitespace-nowrap">sBTC in contract:</span>
            </div>
            <span className="font-mono shrink-0">{contractBalances.sbtc.formatted}</span>
          </div>
          {inUnwrapping > 0n && (
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="h-3.5 w-3.5 shrink-0 rounded-sm bg-primary/20 border border-dashed border-primary/40" />
                <span className="text-muted-foreground whitespace-nowrap">In unwrapping:</span>
              </div>
              <span className="font-mono shrink-0">{fmt(inUnwrapping)}</span>
            </div>
          )}
          {excessSbtc > 0n && (
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="h-3.5 w-3.5 shrink-0 rounded-sm" style={{ backgroundColor: "#FF5512", opacity: 0.5 }} />
                <span className="text-muted-foreground whitespace-nowrap">Excess sBTC:</span>
              </div>
              <span className="font-mono shrink-0">{fmt(excessSbtc)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
