type LignumMarkProps = {
  className?: string;
};

/**
 * Símbolo da marca Lignum — "L" geométrico com dobra diagonal.
 * Recriado em vetor a partir do brandbook (Azul #0D47FF). Escalável, sem dependência de PNG.
 */
export function LignumMark({ className }: LignumMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Lignum"
    >
      <polygon points="14,10 24,4 24,34 44,34 44,44 14,44" fill="#0D47FF" />
      <polygon points="24,4 28,6 28,34 24,34" fill="#0A2EA6" />
    </svg>
  );
}
