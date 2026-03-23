import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { walletService } from '@/services/walletService';
import { stacksApiService, ContractBalance } from '@/services/stacksApiService';
import { useWallet } from '@/hooks/useWallet';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { Loader2, Shield, ArrowDownToLine, Users, AlertTriangle } from 'lucide-react';
import { CUSTODIAN_ADDRESS } from '@/lib/constants';
import { BitcoinLogo } from '@/components/icons/BitcoinLogo';
import { SbtcLogo } from '@/components/icons/SbtcLogo';

export default function Custodian() {
  const { wallet, connect, disconnect, isLoading, contractBalances } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [isUnwrapping, setIsUnwrapping] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const isCustodian = wallet.stxAddress === CUSTODIAN_ADDRESS;
  const contractXbtc = contractBalances ? BigInt(contractBalances.xbtc.balance) : 0n;
  const canInitUnwrap = contractXbtc > 0n;

  const handleInitUnwrap = async () => {
    if (!wallet.isConnected || !isCustodian) return;

    setIsUnwrapping(true);
    try {
      const { txid } = await walletService.initUnwrap();
      toast.success('Init unwrap transaction submitted', {
        description: `TX: ${txid.slice(0, 10)}...`,
      });
    } catch (error) {
      console.error('Init unwrap failed:', error);
      toast.error('Init unwrap failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
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
      toast.success('Withdraw excess sBTC submitted', {
        description: `TX: ${txid.slice(0, 10)}...`,
      });
    } catch (error) {
      console.error('Withdrawal failed:', error);
      toast.error('Withdrawal failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleEnroll = async () => {
    if (!wallet.isConnected) return;

    setIsEnrolling(true);
    try {
      const { txid } = await walletService.enrollDualStacking();
      toast.success('Enrollment transaction submitted', {
        description: `TX: ${txid.slice(0, 10)}...`,
      });
    } catch (error) {
      console.error('Enrollment failed:', error);
      toast.error('Enrollment failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

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
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Custodian Panel</h1>
            <p className="text-muted-foreground">
              Manage the swap contract as custodian
            </p>
          </div>

          {wallet.isConnected && !isCustodian && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p>Your wallet is not the custodian. Only the custodian can call init-unwrap.</p>
            </div>
          )}

          {/* Contract balances summary */}
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contract Balances</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="flex items-center gap-2">
                <BitcoinLogo className="h-4 w-4 grayscale opacity-60" />
                <span className="font-mono text-sm">{contractBalances?.xbtc.formatted || '0.00000000'} xBTC</span>
              </div>
              <div className="flex items-center gap-2">
                <SbtcLogo className="h-4 w-4" />
                <span className="font-mono text-sm">{contractBalances?.sbtc.formatted || '0.00000000'} sBTC</span>
              </div>
            </CardContent>
          </Card>

          {/* Init Unwrap Card - Custodian only */}
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Init Unwrap
              </CardTitle>
              <CardDescription>
                Initiate the xBTC unwrap process. Available when the contract holds xBTC.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleInitUnwrap} 
                disabled={isUnwrapping || !wallet.isConnected || !isCustodian || !canInitUnwrap}
                className="w-full"
              >
                {isUnwrapping ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                ) : !canInitUnwrap ? 'No xBTC in Contract' : 'Init Unwrap'}
              </Button>
            </CardContent>
          </Card>

          {/* Enroll Card */}
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Enroll in Dual Stacking
              </CardTitle>
              <CardDescription>
                Register the swap contract for dual stacking rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleEnroll} 
                disabled={isEnrolling || !wallet.isConnected}
                variant="secondary"
                className="w-full"
              >
                {isEnrolling ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enrolling...</>
                ) : 'Enroll Contract'}
              </Button>
            </CardContent>
          </Card>

          {/* Withdraw Excess Card - Anyone */}
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
              <Button 
                onClick={handleWithdrawExcess} 
                disabled={isWithdrawing || !wallet.isConnected}
                variant="secondary"
                className="w-full"
              >
                {isWithdrawing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Withdrawing...</>
                ) : 'Withdraw Excess sBTC'}
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
