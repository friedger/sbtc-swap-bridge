import sbtcLogo from '@/assets/sbtc-logo.svg';

export function SbtcLogo({ className }: { className?: string }) {
  return (
    <img 
      src={sbtcLogo} 
      alt="sBTC" 
      className={className}
    />
  );
}
