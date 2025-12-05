import { Header } from '@/components/Header';
import { SwapCard } from '@/components/SwapCard';
import { ContractStats } from '@/components/ContractStats';
import { useWallet } from '@/hooks/useWallet';
import { useTheme } from '@/hooks/useTheme';
import { EXPLORER_CONTRACT_URL, GITHUB_REPO_URL } from '@/lib/constants';

const Index = () => {
  const {
    wallet,
    userBalances,
    contractBalances,
    xbtcTotalSupply,
    isLoading,
    isSwapping,
    txStatus,
    connect,
    disconnect,
    swap,
    refreshBalances,
  } = useWallet();

  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <Header
        isConnected={wallet.isConnected}
        stxAddress={wallet.stxAddress}
        isLoading={isLoading}
        onConnect={connect}
        onDisconnect={disconnect}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
      
      <main className="container max-w-screen-xl py-8 md:py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Swap <span className="text-chart-3">xBTC</span> to{' '}
            <span className="text-primary">sBTC</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Seamlessly convert your Wrapped Bitcoin (xBTC) to Stacks Bitcoin (sBTC)
            on the Stacks blockchain. One-way swap with 1:1 ratio.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
          <SwapCard
            userBalances={userBalances}
            contractBalances={contractBalances}
            isConnected={wallet.isConnected}
            isSwapping={isSwapping}
            txStatus={txStatus}
            onSwap={swap}
            onRefresh={refreshBalances}
            isLoading={isLoading}
          />
          
          <ContractStats
            contractBalances={contractBalances}
            xbtcTotalSupply={xbtcTotalSupply}
            isLoading={isLoading && !contractBalances}
          />
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center">
          <div className="mx-auto max-w-2xl rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur">
            <h2 className="text-lg font-semibold">How it works</h2>
            <div className="mt-4 grid gap-4 text-sm text-muted-foreground md:grid-cols-3">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  1
                </div>
                <p>Connect your Stacks wallet</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  2
                </div>
                <p>Click "Swap All xBTC" to initiate</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  3
                </div>
                <p>Confirm the transaction in your wallet</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6">
        <div className="container max-w-screen-xl text-center text-sm text-muted-foreground">
          <p>Built on the Stacks blockchain. One-way swap only.</p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <a
              href={EXPLORER_CONTRACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Smart contract code
            </a>
            <span className="text-border">•</span>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Web app source code
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
