import { useState } from 'react';
import { Menu } from 'lucide-react';
import { WalletButton } from './WalletButton';
import { ThemeToggle } from './ThemeToggle';
import { BitcoinLogo } from '@/components/icons/BitcoinLogo';
import { SbtcLogo } from '@/components/icons/SbtcLogo';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

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
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 sm:h-16 max-w-screen-xl items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <BitcoinLogo className="h-6 w-6 sm:h-8 sm:w-8 grayscale opacity-60" />
          <span className="text-sm sm:text-lg font-semibold">→</span>
          <SbtcLogo className="h-6 w-6 sm:h-8 sm:w-8" />
        </div>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-4">
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          <WalletButton
            isConnected={isConnected}
            stxAddress={stxAddress}
            isLoading={isLoading}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
          />
        </div>

        {/* Mobile hamburger */}
        <div className="sm:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-10">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex flex-col gap-4">
                <ThemeToggle theme={theme} onToggle={onThemeToggle} />
                <WalletButton
                  isConnected={isConnected}
                  stxAddress={stxAddress}
                  isLoading={isLoading}
                  onConnect={onConnect}
                  onDisconnect={onDisconnect}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
