"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type Destaque = {
  id: string;
  imagem: string;
  credito: string;
  posicaoImagem?: string;
  etiqueta?: React.ReactNode;
  titulo: React.ReactNode;
  texto: string;
  acao: { href: string; rotulo: string };
  acaoSecundaria?: { href: string; rotulo: string };
  rodape?: string;
};

const INTERVALO = 8000;

/**
 * Hero com destaques rotativos. O primeiro é sempre o próximo evento.
 * Pausa ao passar o mouse ou focar, e não gira sozinho com movimento reduzido.
 */
export function HeroRotativo({ destaques }: { destaques: Destaque[] }) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const reduzido = useRef(false);
  const total = destaques.length;

  const ir = useCallback((i: number) => setAtual((i + total) % total), [total]);

  useEffect(() => {
    reduzido.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    if (pausado || total < 2 || reduzido.current) return;
    const t = setTimeout(() => ir(atual + 1), INTERVALO);
    return () => clearTimeout(t);
  }, [atual, pausado, total, ir]);

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques da liga"
      className="relative isolate overflow-hidden border-b border-borda"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      {destaques.map((d, i) => (
        <div
          key={d.id}
          role="group"
          aria-roledescription="destaque"
          aria-label={`${i + 1} de ${total}`}
          aria-hidden={i !== atual}
          className={`transition-opacity duration-700 ${i === atual ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={d.imagem}
            alt=""
            className={`absolute inset-0 -z-20 h-full w-full object-cover opacity-75 ${i === atual ? "hero-zoom" : ""}`}
            style={{ objectPosition: d.posicaoImagem ?? "70% 30%" }}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-preto via-preto/80 to-preto/10" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-preto to-transparent" />

          <div className="mx-auto flex min-h-[540px] max-w-6xl flex-col justify-center gap-6 px-6 pb-24 pt-16">
            {d.etiqueta && (
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-texto2">
                {d.etiqueta}
              </div>
            )}
            <h1 className="titulo max-w-3xl text-6xl sm:text-7xl">
              {d.titulo}
            </h1>
            <p className="max-w-xl text-lg text-texto2">{d.texto}</p>
            <div className="flex flex-wrap items-center gap-6">
              <Link
                href={d.acao.href}
                tabIndex={i === atual ? 0 : -1}
                className="corte inline-flex min-h-12 items-center bg-vermelho px-8 font-semibold uppercase tracking-wide text-white no-underline hover:bg-vermelho-escuro hover:text-white"
              >
                {d.acao.rotulo}
              </Link>
              {d.acaoSecundaria && (
                <Link
                  href={d.acaoSecundaria.href}
                  tabIndex={i === atual ? 0 : -1}
                  className="text-sm font-semibold"
                >
                  {d.acaoSecundaria.rotulo} →
                </Link>
              )}
              {d.rodape && (
                <span className="text-sm text-cinza">{d.rodape}</span>
              )}
            </div>
          </div>
          <span className="absolute bottom-4 right-4 hidden text-[11px] text-white/50 sm:block">
            {d.credito}
          </span>
        </div>
      ))}

      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 flex w-full max-w-6xl -translate-x-1/2 items-center gap-4 px-6">
          <div className="flex gap-2">
            {destaques.map((d, i) => (
              <button
                key={d.id}
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ir para o destaque ${i + 1}`}
                aria-current={i === atual}
                className="group h-8 py-3.5"
              >
                <span
                  className={`block h-1 rounded-full transition-all duration-500 ${
                    i === atual
                      ? "w-10 bg-brasa"
                      : "w-5 bg-white/30 group-hover:bg-white/60"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="ml-2 flex gap-1">
            <button
              type="button"
              onClick={() => ir(atual - 1)}
              aria-label="Destaque anterior"
              className="grid h-8 w-8 place-items-center rounded-full text-white/70 ring-1 ring-white/20 hover:text-white hover:ring-brasa"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <path
                  d="M8 2L4 6l4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  fill="none"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => ir(atual + 1)}
              aria-label="Próximo destaque"
              className="grid h-8 w-8 place-items-center rounded-full text-white/70 ring-1 ring-white/20 hover:text-white hover:ring-brasa"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <path
                  d="M4 2l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  fill="none"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
