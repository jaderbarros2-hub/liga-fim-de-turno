"use client";

import { useActionState } from "react";
import { gerarPix, type EstadoInscricao } from "./actions";

export function BotaoGerar({ slug, rotulo }: { slug: string; rotulo: string }) {
  const [estado, acao, enviando] = useActionState<EstadoInscricao, FormData>(
    gerarPix,
    {},
  );
  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        disabled={enviando}
        className="inline-flex min-h-11 items-center justify-center self-start rounded-lg bg-vermelho px-6 text-sm font-semibold uppercase tracking-wide text-white hover:bg-vermelho-escuro disabled:opacity-50"
      >
        {enviando ? "Gerando Pix…" : rotulo}
      </button>
      {estado.erro && (
        <p role="alert" className="text-sm text-erro">
          {estado.erro}
        </p>
      )}
    </form>
  );
}
