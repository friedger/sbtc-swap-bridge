import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { walletService } from '@/services/walletService';
import { useWallet } from '@/hooks/useWallet';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { Loader2, Users, ArrowDownToLine } from 'lucide-react';

export default function Manage() {
  const { wallet, connect, disconnect, isLoading } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleEnroll = async () => {
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsEnrolling(true);
    try {
      const { txid } = await walletService.enrollDualStacking();
      toast.success('Enrollment transaction submitted', {
        description: `Transaction ID: ${txid.slice(0, 10)}...`,
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

  const handleWithdrawExcess = async () => {
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsWithdrawing(true);
    try {
      const { txid } = await walletService.withdrawExcessSbtc();
      toast.success('Withdrawal transaction submitted', {
        description: `Transaction ID: ${txid.slice(0, 10)}...`,
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
            <h1 className="text-3xl font-bold mb-2">Manage Contract</h1>
            <p className="text-muted-foreground">
              Enroll in dual stacking or withdraw excess sBTC from the swap contract
            </p>
          </div>

          {/* Enroll Card */}
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Enroll in Dual Stacking
              </CardTitle>
              <CardDescription>
                Register the swap contract for dual stacking rewards through the dual stacking protocol
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleEnroll} 
                disabled={isEnrolling || !wallet.isConnected}
                className="w-full"
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  'Enroll Contract'
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
                Withdraw excess sBTC from the swap contract when coverage exceeds 100%
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
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  'Withdraw Excess sBTC'
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
