"use client";

import { useMemo, useState } from "react";

export type CartaGaleria = { nome: string; imagem: string | null; cor: string; raridade?: string; tipo?: string; cmc?: number };

const CORES = [
  { id: "White", nome: "Branco", cor: "#f3eccb" },
  { id: "Blue", nome: "Azul", cor: "#4f9fd8" },
  { id: "Black", nome: "Preto", cor: "#8e8481" },
  { id: "Red", nome: "Vermelho", cor: "#e0704c" },
  { id: "Green", nome: "Verde", cor: "#5fae6c" },
  { id: "Multicolored", nome: "Multicolor", cor: "linear-gradient(135deg,#e7c66b,#c26fd6)" },
  { id: "Colorless", nome: "Incolor", cor: "#b8bec9" },
  { id: "Lands", nome: "Terrenos", cor: "#8a6e4b" },
];

/** Grade de cartas com filtro por cor e busca por nome (lista de cubo ou raras da coleção). */
export function GaleriaCartas({ cartas }: { cartas: CartaGaleria[] }) {
  const [cor, setCor] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const contagem = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cartas) m.set(c.cor, (m.get(c.cor) ?? 0) + 1);
    return m;
  }, [cartas]);
  const visiveis = cartas
    .filter((c) => (!cor || c.cor === cor) && (!busca || c.nome.toLowerCase().includes(busca.toLowerCase())))
    .sort((a, b) => (a.cmc ?? 0) - (b.cmc ?? 0) || a.nome.localeCompare(b.nome));
  const chip = (ativo: boolean) =>
    `flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${ativo ? "bg-azul text-white" : "text-texto2 ring-1 ring-borda hover:text-gelo hover:ring-ciano"}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setCor(null)} className={chip(!cor)}>
          Todas <span className="opacity-70">{cartas.length}</span>
        </button>
        {CORES.filter((c) => contagem.get(c.id)).map((c) => (
          <button key={c.id} type="button" onClick={() => setCor(cor === c.id ? null : c.id)} className={chip(cor === c.id)}>
            <span className="h-3 w-3 rounded-full" style={{ background: c.cor }} />
            {c.nome} <span className="opacity-70">{contagem.get(c.id)}</span>
          </button>
        ))}
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar carta"
          aria-label="Buscar carta"
          className="ml-auto min-h-9 w-full rounded-full border border-borda-forte bg-fundo2 px-4 text-sm text-gelo sm:w-56"
        />
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visiveis.map((c, i) => (
          <li key={`${c.nome}-${i}`} title={c.nome}>
            {c.imagem ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imagem} alt={c.nome} loading="lazy" className="w-full rounded-[4.75%/3.5%] transition hover:scale-[1.04]" />
            ) : (
              <span className="flex aspect-[5/7] items-center justify-center rounded-lg bg-grafite p-2 text-center text-sm ring-1 ring-borda">{c.nome}</span>
            )}
          </li>
        ))}
      </ul>
      {visiveis.length === 0 && <p className="text-texto2">Nenhuma carta encontrada.</p>}
    </div>
  );
}
