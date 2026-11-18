"use client";

import { useState } from "react";
import { Mana } from "@/components/Mana";

export type ItemDeck = { qtd: number; nome: string; custo: string | null; imagem: string | null; tipo: string };
export type GrupoDeck = { titulo: string; total: number; itens: ItemDeck[] };

/**
 * Lista no estilo dos grandes sites de deck: colunas por tipo e, ao lado, a carta grande
 * da linha em foco. No celular, tocar na carta abre a imagem por cima da página.
 */
export function DeckCompleto({ grupos, inicial }: { grupos: GrupoDeck[]; inicial: string | null }) {
  const [foco, setFoco] = useState<string | null>(inicial);
  const [aberta, setAberta] = useState<ItemDeck | null>(null);

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="hidden lg:block">
        <div className="sticky top-24">
          {foco ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foco} alt="" className="w-full rounded-[4.75%/3.5%] shadow-2xl shadow-preto" />
          ) : (
            <div className="aspect-[5/7] rounded-xl bg-grafite ring-1 ring-borda" />
          )}
          <p className="mt-3 text-center text-xs text-cinza">Passe o mouse numa carta para ver</p>
        </div>
      </div>

      <div className="columns-1 gap-6 sm:columns-2 xl:columns-3">
        {grupos.map((g) => (
          <section key={g.titulo} className="mb-6 break-inside-avoid">
            <h3 className="mb-1 flex items-baseline justify-between border-b border-borda pb-1.5">
              <span className="text-sm font-bold uppercase tracking-wider text-gelo">{g.titulo}</span>
              <span className="text-sm text-cinza">{g.total}</span>
            </h3>
            <ul>
              {g.itens.map((i) => (
                <li key={i.nome}>
                  <button
                    type="button"
                    onMouseEnter={() => i.imagem && setFoco(i.imagem)}
                    onFocus={() => i.imagem && setFoco(i.imagem)}
                    onClick={() => {
                      if (i.imagem) setFoco(i.imagem);
                      if (window.matchMedia("(max-width: 1023px)").matches) setAberta(i);
                    }}
                    className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-sm hover:bg-grafite"
                  >
                    <span className="w-5 shrink-0 text-right font-semibold text-cinza">{i.qtd}</span>
                    <span className="min-w-0 flex-1 truncate text-gelo">{i.nome}</span>
                    <Mana custo={i.custo} tamanho={15} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {aberta?.imagem && (
        <button
          type="button"
          aria-label="Fechar carta"
          onClick={() => setAberta(null)}
          className="fixed inset-0 z-50 grid place-items-center bg-preto/85 p-8 backdrop-blur-sm lg:hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={aberta.imagem} alt={aberta.nome} className="w-full max-w-xs rounded-[4.75%/3.5%]" />
        </button>
      )}
    </div>
  );
}
