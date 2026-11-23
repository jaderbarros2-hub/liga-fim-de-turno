import type { Insignia as TipoInsignia } from "@/lib/jogador";

const CORES: Record<
  TipoInsignia["nivel"],
  { fundo: string; borda: string; icone: string }
> = {
  ouro: {
    fundo: "from-[#5c4410] to-[#2a1f07]",
    borda: "#e7b84a",
    icone: "#ffd978",
  },
  prata: {
    fundo: "from-[#45433f] to-[#1e1d1b]",
    borda: "#cfc9bf",
    icone: "#f4efe6",
  },
  bronze: {
    fundo: "from-[#4a2c17] to-[#22140a]",
    borda: "#c98a55",
    icone: "#f0b98a",
  },
  brasa: {
    fundo: "from-[#5a1a12] to-[#240905]",
    borda: "#ff5a47",
    icone: "#ff9a8c",
  },
};

const ICONES: Record<TipoInsignia["icone"], string> = {
  trofeu:
    "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM17 6h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3",
  coroa: "M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8Z",
  estrela:
    "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3Z",
  escudo: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3Z",
  pena: "M20 4c-7 0-12 5-13 12l-3 4M9 15h5M7 11c4 0 7-2 9-5",
  chama:
    "M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9Z",
  diamante: "M6 3h12l4 6-10 12L2 9l4-6ZM2 9h20M9 3l3 18M15 3l-3 18",
  alvo: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z",
};

/** Insígnia em forma de brasão hexagonal, com nível (ouro, prata, bronze, brasa). */
export function Insignia({
  insignia,
  compacta = false,
}: {
  insignia: TipoInsignia;
  compacta?: boolean;
}) {
  const c = CORES[insignia.nivel];
  const tamanho = compacta ? 44 : 64;
  const selo = (
    <span
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: tamanho, height: tamanho * 1.1 }}
      title={compacta ? `${insignia.titulo} · ${insignia.texto}` : undefined}
    >
      <span
        className={`absolute inset-0 bg-gradient-to-b ${c.fundo}`}
        style={{
          clipPath:
            "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
          boxShadow: `inset 0 0 0 2px ${c.borda}`,
        }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-[3px]"
        style={{
          clipPath:
            "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
          outline: `2px solid ${c.borda}`,
          outlineOffset: -2,
          opacity: 0.6,
        }}
      />
      <svg
        width={tamanho * 0.45}
        height={tamanho * 0.45}
        viewBox="0 0 24 24"
        fill="none"
        stroke={c.icone}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="relative"
        aria-hidden="true"
      >
        <path d={ICONES[insignia.icone]} />
      </svg>
      {insignia.vezes && insignia.vezes > 1 ? (
        <span
          className="absolute -bottom-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-preto px-1 text-[10px] font-bold text-marfim ring-1"
          style={{ borderColor: c.borda, boxShadow: `0 0 0 1px ${c.borda}` }}
        >
          {insignia.vezes}×
        </span>
      ) : null}
    </span>
  );
  if (compacta) return selo;
  return (
    <div className="flex items-center gap-3 rounded-md bg-grafite p-3 ring-1 ring-borda">
      {selo}
      <span className="flex min-w-0 flex-col">
        <span className="font-semibold leading-tight">{insignia.titulo}</span>
        <span className="text-xs text-texto2">{insignia.texto}</span>
      </span>
    </div>
  );
}
