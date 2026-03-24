import { Header } from "@/components/Header";
import { SwapCard } from "@/components/SwapCard";
import { ContractStats } from "@/components/ContractStats";
import { TransactionStatusDialog } from "@/components/TransactionStatusDialog";
import { useWallet } from "@/hooks/useWallet";
import { useTheme } from "@/hooks/useTheme";
import {
  EXPLORER_CONTRACT_URL,
  EXPLORER_XBTC_URL,
  EXPLORER_SWXBTC_URL,
  EXPLORER_SBTC_URL,
  GITHUB_REPO_URL,
} from "@/lib/constants";

const Index = () => {
  const {
    wallet,
    userBalances,
    contractBalances,
    isLoading,
    isSwapping,
    txStatus,
    txid,
    isDialogOpen,
    connect,
    disconnect,
    depositXbtc,
    claimSbtc,
    withdrawXbtc,
    refreshBalances,
    closeDialog,
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
            Swap <span className="text-muted-foreground">xBTC</span> to{" "}
            <span style={{ color: "#FF5512" }}>sBTC</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Convert your Wrapped Bitcoin (xBTC) to Stacks Bitcoin (sBTC) in two
            steps: deposit xBTC, then claim sBTC after processing.
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
            onDeposit={depositXbtc}
            onClaim={claimSbtc}
            onWithdraw={withdrawXbtc}
            onRefresh={refreshBalances}
            onConnect={connect}
            isLoading={isLoading}
          />

          <ContractStats
            contractBalances={contractBalances}
            userBalances={userBalances}
            userAddress={wallet.stxAddress}
            isConnected={wallet.isConnected}
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
                <p>Deposit your xBTC into the swap contract</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  2
                </div>
                <p>Wait for the custodian to process the unwrap</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  3
                </div>
                <p>Claim your sBTC</p>
              </div>
            </div>
            {/* Links to contracts */}
            <hr className="mt-12" />
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
              Verify the contract code on-chain:
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
              <a
                href={EXPLORER_XBTC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                xBTC token
              </a>
              <span className="text-border">•</span>
              <a
                href={EXPLORER_SWXBTC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                swapping xbtc receipt token (swxBTC)
              </a>
              <span className="text-border">•</span>
              <a
                href={EXPLORER_SBTC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                sBTC token
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6">
        <div className="container max-w-screen-xl text-center text-sm text-muted-foreground">
          <p>Built on the Stacks blockchain. Two-step swap process.</p>
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

      <TransactionStatusDialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
        txid={txid}
        status={txStatus || "pending"}
      />
    </div>
  );
};

export default Index;
