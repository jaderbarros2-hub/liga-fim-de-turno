/**
 * Ingresso da liga: arte do evento à esquerda, dados à direita e o canhoto picotado com o código.
 * Desenho próprio (sem logos oficiais).
 */
export function Ingresso({
  arte,
  foco = "50% 30%",
  titulo,
  formato,
  data,
  hora,
  jogador,
  deck,
  codigo,
  valido = true,
}: {
  arte: string;
  foco?: string;
  titulo: string;
  formato: string;
  data: string;
  hora: string;
  jogador: string;
  deck?: string | null;
  codigo: string;
  valido?: boolean;
}) {
  return (
    <div
      className={`relative flex w-full max-w-2xl overflow-hidden rounded-xl bg-grafite shadow-2xl shadow-preto ring-1 ${valido ? "ring-vermelho/60" : "ring-borda opacity-70"}`}
    >
      {/* Arte */}
      <div className="relative hidden w-40 shrink-0 sm:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={arte}
          alt=""
          style={{ objectPosition: foco }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-grafite" />
      </div>
      {/* Corpo */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brasa">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5 4h14v16H5zM9 8v8l7-4z" />
          </svg>
          Ingresso · First Strike
        </span>
        <span className="titulo truncate text-2xl leading-none">{titulo}</span>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-cinza">
              Data
            </dt>
            <dd className="font-semibold">{data}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-cinza">
              Horário
            </dt>
            <dd className="font-semibold">{hora}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-cinza">
              Jogador
            </dt>
            <dd className="truncate font-semibold">{jogador}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-cinza">
              {deck ? "Deck" : "Formato"}
            </dt>
            <dd className="truncate font-semibold">{deck ?? formato}</dd>
          </div>
        </dl>
      </div>
      {/* Canhoto picotado */}
      <div className="relative flex w-24 shrink-0 flex-col items-center justify-center gap-2 border-l-2 border-dashed border-borda-forte bg-fundo2 px-2 sm:w-28">
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-preto" />
        <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-preto" />
        <span className="text-[10px] uppercase tracking-wider text-cinza">
          Código
        </span>
        <span className="font-mono text-sm font-bold tracking-wider text-marfim [writing-mode:vertical-rl] sm:[writing-mode:horizontal-tb]">
          {codigo}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${valido ? "bg-brasa/20 text-brasa" : "bg-borda text-cinza"}`}
        >
          {valido ? "Válido" : "Cancelado"}
        </span>
      </div>
    </div>
  );
}

export const codigoIngresso = (inscricaoId: string) =>
  inscricaoId.replace(/-/g, "").slice(0, 8).toUpperCase();
