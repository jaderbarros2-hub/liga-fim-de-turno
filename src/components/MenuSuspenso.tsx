"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

export type ItemMenu = { href: string; rotulo: string; descricao?: string; separar?: boolean };

/** Menu suspenso acessível: abre no clique, fecha ao clicar fora, com Esc ou ao navegar. */
export function MenuSuspenso({
  gatilho,
  itens,
  alinhar = "esquerda",
  rodape,
  rotuloAcessivel,
  classeGatilho = "",
}: {
  gatilho: React.ReactNode;
  itens: ItemMenu[];
  alinhar?: "esquerda" | "direita";
  rodape?: React.ReactNode;
  rotuloAcessivel?: string;
  classeGatilho?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const id = useId();
  const caminho = usePathname();

  useEffect(() => setAberto(false), [caminho]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    };
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={id}
        aria-label={rotuloAcessivel}
        onClick={() => setAberto((a) => !a)}
        className={`flex items-center gap-1.5 ${classeGatilho}`}
      >
        {gatilho}
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={`transition ${aberto ? "rotate-180" : ""}`}>
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" />
        </svg>
      </button>
      {aberto && (
        <div
          id={id}
          className={`absolute top-full z-50 mt-2 min-w-56 overflow-hidden rounded-lg bg-grafite py-1.5 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.8)] ring-1 ring-borda-forte ${
            alinhar === "direita" ? "right-0" : "left-0"
          }`}
        >
          {itens.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={`block px-4 py-2 text-sm normal-case text-gelo no-underline hover:bg-fundo2 hover:text-ciano ${
                i.separar ? "mt-1.5 border-t border-borda pt-3" : ""
              }`}
            >
              <span className="font-semibold">{i.rotulo}</span>
              {i.descricao && <span className="block text-xs font-normal text-cinza">{i.descricao}</span>}
            </Link>
          ))}
          {rodape && <div className="mt-1.5 border-t border-borda px-4 pt-2">{rodape}</div>}
        </div>
      )}
    </div>
  );
}
