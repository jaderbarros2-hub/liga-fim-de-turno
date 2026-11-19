"use client";

import { botao } from "@/components/Botao";

import { useState } from "react";

/**
 * "Comprar este deck": abre a loja parceira com a lista (quando a loja aceita busca por lista)
 * ou copia a lista e abre a loja. O clique passa pelo link rastreado.
 */
export function ComprarDeck({
  loja,
  lista,
  pagina,
}: {
  loja: { id: string; nome: string; aceitaLista: boolean };
  lista: string;
  pagina: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function comprar() {
    try {
      await navigator.clipboard.writeText(lista);
      setCopiado(true);
    } catch {
      // sem permissão de área de transferência: segue só abrindo a loja
    }
    const q = new URLSearchParams({ o: "deck", p: pagina });
    if (loja.aceitaLista) q.set("lista", lista);
    window.open(`/ir/${loja.id}?${q}`, "_blank", "noopener");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={comprar}
        className="corte inline-flex min-h-11 items-center bg-azul px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-azul-escuro"
      >
        Comprar este deck na {loja.nome}
      </button>
      <span className="text-xs text-cinza">
        {copiado && !loja.aceitaLista
          ? "Lista copiada: cole na busca por lista da loja."
          : "Loja parceira · link patrocinado"}
      </span>
    </div>
  );
}

/** Botões de utilidade da lista: copiar e baixar .txt. */
export function AcoesLista({ lista, nome }: { lista: string; nome: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={botao("secundario")}
        onClick={async () => {
          await navigator.clipboard.writeText(lista);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        }}
      >
        {copiado ? "Lista copiada ✓" : "Copiar lista"}
      </button>
      <a
        className={botao("secundario")}
        download={`${nome.replace(/[^\w\- ]+/g, "")}.txt`}
        href={`data:text/plain;charset=utf-8,${encodeURIComponent(lista)}`}
      >
        Baixar .txt
      </a>
    </div>
  );
}
