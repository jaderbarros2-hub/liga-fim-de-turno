"use client";

import { botao } from "@/components/Botao";

import { useState } from "react";

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
