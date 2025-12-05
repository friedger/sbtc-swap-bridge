import { WalletButton } from './WalletButton';

interface HeaderProps {
  isConnected: boolean;
  stxAddress: string | null;
  isLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function Header({
  isConnected,
  stxAddress,
  isLoading,
  onConnect,
  onDisconnect,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">₿</span>
          </div>
          <span className="text-lg font-semibold">xBTC → sBTC</span>
        </div>
        
        <WalletButton
          isConnected={isConnected}
          stxAddress={stxAddress}
          isLoading={isLoading}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      </div>
    </header>
  );
}
