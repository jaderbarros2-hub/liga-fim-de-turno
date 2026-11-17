export function Simbolo({ tamanho = 40 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 72 72" aria-hidden="true">
      <rect width="72" height="72" rx="16" fill="#2E6BFF" />
      <path d="M22 20 L46 36 L22 52 Z" fill="#EEF2F8" />
      <rect x="48" y="20" width="6" height="32" rx="2" fill="#EEF2F8" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <Simbolo />
      <span className="titulo text-2xl text-gelo">Liga Fim de Turno</span>
    </span>
  );
}
