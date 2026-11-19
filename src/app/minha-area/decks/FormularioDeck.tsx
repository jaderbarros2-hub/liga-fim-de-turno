"use client";

import { startTransition, useActionState, useState } from "react";
import { salvarDeck, type EstadoDeck } from "./actions";

const campo =
  "min-h-11 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-gelo focus:border-ciano focus:outline-none";

export function FormularioDeck({
  arquetipos,
  valores,
}: {
  arquetipos: { id: number; nome: string }[];
  valores?: {
    id: string;
    nome: string;
    arquetipo_id: number | null;
    lista: string;
  };
}) {
  const [estado, acao, enviando] = useActionState<EstadoDeck, FormData>(
    salvarDeck,
    {},
  );
  const [lista, setLista] = useState(valores?.lista ?? "");
  const [nome, setNome] = useState(valores?.nome ?? "");

  async function lerArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setLista(await arquivo.text());
    if (!nome) setNome(arquivo.name.replace(/\.txt$/i, ""));
  }

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    startTransition(() => acao(dados));
  }

  return (
    <form onSubmit={enviar} className="grid gap-5 md:grid-cols-2">
      {valores?.id && <input type="hidden" name="id" value={valores.id} />}
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Nome do deck
        <input
          name="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          placeholder="Ex.: Faeries do Jader"
          className={campo}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        Arquétipo
        <select
          name="arquetipo_id"
          defaultValue={valores?.arquetipo_id ?? ""}
          required
          className={campo}
        >
          <option value="">Escolha…</option>
          {arquetipos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-col gap-2 md:col-span-2">
        <span className="text-sm font-semibold">Lista</span>
        <p className="text-sm text-cinza">
          No Endstep, abra o deck →{" "}
          <strong className="text-texto2">Import / Export → Export</strong> →{" "}
          <strong className="text-texto2">Copy</strong> e cole aqui, ou clique
          em <strong className="text-texto2">Download</strong> e envie o arquivo
          .txt.
        </p>
        <textarea
          name="lista"
          value={lista}
          onChange={(e) => setLista(e.target.value)}
          rows={16}
          required
          placeholder={
            "4 Ninja of the Deep Hours\n4 Spellstutter Sprite\n...\n\nSideboard\n4 Hydroblast\n..."
          }
          className={`${campo} py-2 font-mono text-sm`}
        />
        <label className="inline-flex min-h-11 cursor-pointer items-center self-start rounded-lg border border-borda-forte px-5 text-sm font-semibold hover:border-ciano">
          Enviar arquivo .txt
          <input
            type="file"
            accept=".txt,text/plain"
            onChange={lerArquivo}
            className="sr-only"
          />
        </label>
      </div>
      <div className="flex flex-col gap-3 md:col-span-2">
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex min-h-11 items-center self-start rounded-lg bg-azul px-6 font-semibold uppercase tracking-wide text-white disabled:opacity-60"
        >
          {enviando ? "Conferindo cartas…" : "Salvar deck"}
        </button>
        {estado.erro && (
          <p
            role="alert"
            className="rounded-lg border border-erro px-4 py-3 text-sm font-semibold text-erro"
          >
            {estado.erro}
          </p>
        )}
      </div>
    </form>
  );
}
