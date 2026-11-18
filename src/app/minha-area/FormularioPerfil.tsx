"use client";

import { startTransition, useActionState, useState } from "react";
import { REDES, type Redes } from "@/lib/perfil";
import { salvarPerfil } from "./perfil";

const campo =
  "w-full rounded-md border border-borda bg-fundo2 px-3 py-2 text-gelo outline-none focus:border-azul";

type Inicial = {
  bio: string;
  redes: Redes;
  mostrarResultados: boolean;
  mostrarDecks: boolean;
  mostrarArtigos: boolean;
  autor: boolean;
};

export function FormularioPerfil({
  inicial,
  link,
}: {
  inicial: Inicial;
  link: string;
}) {
  const [estado, acao, enviando] = useActionState(salvarPerfil, {});
  const [bio, setBio] = useState(inicial.bio);

  const chaves = [
    {
      nome: "mostrar_resultados",
      rotulo: "Resultados",
      texto: "Etapas que você jogou, colocação e campanha.",
      valor: inicial.mostrarResultados,
    },
    {
      nome: "mostrar_decks",
      rotulo: "Decks",
      texto:
        "Listas do top 8 (já públicas na página do evento) reunidas no seu perfil.",
      valor: inicial.mostrarDecks,
    },
    ...(inicial.autor
      ? [
          {
            nome: "mostrar_artigos",
            rotulo: "Artigos",
            texto: "Os artigos que você publicou no blog.",
            valor: inicial.mostrarArtigos,
          },
        ]
      : []),
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const dados = new FormData(e.currentTarget);
        startTransition(() => acao(dados)); // mantém o formulário preenchido depois de salvar
      }}
      className="flex flex-col gap-6"
    >
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Bio
        <textarea
          name="bio"
          rows={3}
          maxLength={400}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Ex.: Jogo Pauper desde 2019, fã de Affinity e de draft de Dominária."
          className={campo}
        />
        <span className="self-end text-xs font-normal text-cinza">
          {bio.length}/400
        </span>
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-semibold">Redes sociais</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {REDES.map((r) => (
            <label
              key={r.id}
              className="flex flex-col gap-1 text-xs text-cinza"
            >
              {r.nome}
              <input
                name={`rede_${r.id}`}
                defaultValue={inicial.redes[r.id] ?? ""}
                placeholder="@usuario ou link"
                className={campo}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-semibold">
          O que aparece no perfil
        </legend>
        {chaves.map((c) => (
          <label
            key={c.nome}
            className="flex cursor-pointer items-start gap-3 rounded-md bg-grafite p-3 ring-1 ring-borda"
          >
            <input
              type="checkbox"
              name={c.nome}
              defaultChecked={c.valor}
              className="mt-1 h-4 w-4 accent-azul"
            />
            <span className="flex flex-col">
              <span className="font-semibold">{c.rotulo}</span>
              <span className="text-sm text-texto2">{c.texto}</span>
            </span>
          </label>
        ))}
        <p className="text-xs text-cinza">
          Nick, foto e insígnias aparecem sempre. Seus dados pessoais e a chave
          Pix nunca aparecem.
        </p>
      </fieldset>

      {estado.erro && (
        <p className="rounded-md border border-erro/50 bg-erro/10 p-3 text-sm text-erro">
          {estado.erro}
        </p>
      )}
      {estado.ok && (
        <p className="rounded-md border border-ciano/50 bg-ciano/10 p-3 text-sm font-semibold text-ciano">
          Perfil salvo.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          disabled={enviando}
          className="rounded-md bg-azul px-5 py-2.5 font-semibold text-white hover:bg-azul-escuro disabled:opacity-60"
        >
          {enviando ? "Salvando…" : "Salvar perfil"}
        </button>
        <a href={link} target="_blank" className="text-sm font-semibold">
          Ver meu perfil público →
        </a>
      </div>
    </form>
  );
}
