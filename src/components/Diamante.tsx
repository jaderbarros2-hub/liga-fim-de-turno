/** Losango do apoiador (mesmo traço do botão "Apoie" no cabeçalho). */
export function Diamante({ tamanho = 14, className = "" }: { tamanho?: number; className?: string }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M8 1.5 14.5 8 8 14.5 1.5 8 8 1.5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 5.5 10.5 8 8 10.5 5.5 8 8 5.5Z" fill="currentColor" />
    </svg>
  );
}
