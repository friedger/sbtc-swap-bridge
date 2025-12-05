import { WalletButton } from './WalletButton';
import { ThemeToggle } from './ThemeToggle';
import { BitcoinLogo } from '@/components/icons/BitcoinLogo';
import { SbtcLogo } from '@/components/icons/SbtcLogo';

interface HeaderProps {
  isConnected: boolean;
  stxAddress: string | null;
  isLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export function Header({
  isConnected,
  stxAddress,
  isLoading,
  onConnect,
  onDisconnect,
  theme,
  onThemeToggle,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-xl items-center justify-between">
        <div className="flex items-center gap-2">
          <BitcoinLogo className="h-8 w-8" />
          <span className="text-lg font-semibold">→</span>
          <SbtcLogo className="h-8 w-8" />
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          <WalletButton
            isConnected={isConnected}
            stxAddress={stxAddress}
            isLoading={isLoading}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
          />
        </div>
      </div>
    </header>
  );
}
