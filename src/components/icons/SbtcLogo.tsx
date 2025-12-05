export function SbtcLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="200" height="200" rx="40" fill="#F7931A" />
      <g fill="#FFFFFF">
        {/* s letter */}
        <path d="M30 95 L30 75 L65 75 L65 95 L45 95 L45 100 L65 100 L65 135 L30 135 L30 115 L50 115 L50 110 L30 110 Z M45 85 L45 90 L50 90 L50 85 Z M50 120 L50 125 L55 125 L55 120 Z" />
        {/* B letter with Bitcoin lines */}
        <path d="M75 55 L75 145 L130 145 C150 145 160 130 160 115 C160 100 150 92 140 90 C148 88 155 80 155 68 C155 52 142 55 130 55 Z M95 70 L95 87 L125 87 C132 87 137 82 137 78 C137 74 132 70 125 70 Z M95 102 L95 130 L128 130 C138 130 143 123 143 115 C143 107 138 102 128 102 Z" />
        {/* Bitcoin vertical lines */}
        <rect x="105" y="45" width="8" height="15" />
        <rect x="120" y="45" width="8" height="15" />
        <rect x="105" y="140" width="8" height="15" />
        <rect x="120" y="140" width="8" height="15" />
      </g>
    </svg>
  );
}
