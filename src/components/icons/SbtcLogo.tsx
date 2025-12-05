import sbtcLogo from '@/assets/sbtc-logo.png';

export function SbtcLogo({ className }: { className?: string }) {
  return (
    <img
      src={sbtcLogo}
      alt="sBTC Logo"
      className={className}
    />
  );
}
