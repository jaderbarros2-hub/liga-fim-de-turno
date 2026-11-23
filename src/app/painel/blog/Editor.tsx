"use client";

import { botao } from "@/components/Botao";

import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";
import { Markdown } from "@/components/Markdown";
import { CATEGORIAS, TIPOS, type Artigo, type Autor } from "@/lib/blogComum";
import { enviarImagem, salvarArtigo } from "./actions";

const CAMPO =
  "min-h-11 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-marfim";
const ROTULO = "flex flex-col gap-1 text-sm font-semibold";

/** Converte a data salva para o campo datetime-local no horário de Brasília. */
const paraCampo = (iso: string | null) =>
  iso
    ? new Date(new Date(iso).getTime() - 3 * 3600e3).toISOString().slice(0, 16)
    : "";

export function Editor({
  artigo,
  autores,
}: {
  artigo?: Artigo;
  autores: Autor[];
}) {
  const [estado, executar, salvando] = useActionState(salvarArtigo, null);
  const [texto, setTexto] = useState(artigo?.conteudo ?? "");
  const [aba, setAba] = useState<"escrever" | "ver">("escrever");
  const [enviando, setEnviando] = useState(false);
  const [erroImg, setErroImg] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);

  function inserir(trecho: string) {
    const el = area.current;
    const ini = el?.selectionStart ?? texto.length;
    const fim = el?.selectionEnd ?? texto.length;
    setTexto(texto.slice(0, ini) + trecho + texto.slice(fim));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(ini + trecho.length, ini + trecho.length);
    });
  }

  function envolver(antes: string, depois = antes, exemplo = "texto") {
    const el = area.current;
    const ini = el?.selectionStart ?? 0;
    const fim = el?.selectionEnd ?? 0;
    const sel = texto.slice(ini, fim) || exemplo;
    setTexto(texto.slice(0, ini) + antes + sel + depois + texto.slice(fim));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(
        ini + antes.length,
        ini + antes.length + sel.length,
      );
    });
  }

  async function subirImagem(arquivo: File) {
    setEnviando(true);
    setErroImg("");
    const fd = new FormData();
    fd.set("imagem", arquivo);
    const r = await enviarImagem(fd);
    setEnviando(false);
    if (r.url)
      inserir(`\n![${arquivo.name.replace(/\.[^.]+$/, "")}](${r.url})\n`);
    else setErroImg(r.erro ?? "Falha ao enviar.");
  }

  const publicado = artigo?.status === "publicado";
  const ferramentas: [string, () => void][] = [
    ["Título", () => inserir("\n## ")],
    ["Subtítulo", () => inserir("\n### ")],
    ["Negrito", () => envolver("**")],
    ["Itálico", () => envolver("_")],
    ["Link", () => envolver("[", "](https://)", "texto do link")],
    ["Lista", () => inserir("\n- ")],
    ["Citação", () => inserir("\n> ")],
    ["Carta", () => envolver("[[", "]]", "Lightning Bolt")],
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(
          e.currentTarget,
          (e.nativeEvent as SubmitEvent).submitter,
        );
        fd.set("conteudo", texto);
        startTransition(() => executar(fd));
      }}
      className="flex flex-col gap-6"
    >
      {artigo && <input type="hidden" name="id" value={artigo.id} />}

      <label className={ROTULO}>
        Título
        <input
          name="titulo"
          required
          defaultValue={artigo?.titulo}
          className={`${CAMPO} text-lg`}
        />
      </label>
      <label className={ROTULO}>
        Resumo (aparece nos cartões e no Google)
        <textarea
          name="resumo"
          rows={2}
          maxLength={280}
          defaultValue={artigo?.resumo ?? ""}
          className={`${CAMPO} py-2`}
        />
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borda">
          <div className="flex gap-5 text-sm font-semibold">
            {(["escrever", "ver"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAba(a)}
                className={`py-3 ${aba === a ? "border-b-2 border-vermelho text-marfim" : "text-cinza"}`}
              >
                {a === "escrever" ? "Escrever" : "Pré-visualizar"}
              </button>
            ))}
          </div>
          {aba === "escrever" && (
            <div className="flex flex-wrap gap-1 pb-2 text-xs">
              {ferramentas.map(([r, f]) => (
                <button
                  key={r}
                  type="button"
                  onClick={f}
                  className="rounded px-2 py-1.5 text-texto2 ring-1 ring-borda hover:text-marfim hover:ring-brasa"
                >
                  {r}
                </button>
              ))}
              <label className="cursor-pointer rounded px-2 py-1.5 text-texto2 ring-1 ring-borda hover:text-marfim hover:ring-brasa">
                {enviando ? "Enviando…" : "Imagem"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) subirImagem(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          )}
        </div>
        {aba === "escrever" ? (
          <textarea
            ref={area}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={24}
            placeholder="Escreva aqui. Use [[Nome da Carta]] para mostrar a carta ao passar o mouse."
            className="w-full rounded-lg border border-borda-forte bg-fundo2 p-4 font-mono text-sm leading-relaxed text-marfim"
          />
        ) : (
          <div className="min-h-96 rounded-lg border border-borda p-6">
            {texto.trim() ? (
              <Markdown texto={texto} />
            ) : (
              <p className="text-cinza">Nada escrito ainda.</p>
            )}
          </div>
        )}
        {erroImg && <p className="text-sm text-red-400">{erroImg}</p>}
        <p className="text-xs text-cinza">
          ## título · **negrito** · _itálico_ · [link](https://…) · - lista ·
          &gt; citação · [[Nome da Carta]] mostra a carta
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={ROTULO}>
          Categoria
          <select
            name="categoria"
            defaultValue={artigo?.categoria ?? "pauper"}
            className={CAMPO}
          >
            {Object.entries(CATEGORIAS).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className={ROTULO}>
          Tipo (aparece acima do título)
          <input
            name="tipo"
            list="tipos-artigo"
            defaultValue={artigo?.tipo ?? "Artigo"}
            maxLength={30}
            className={CAMPO}
          />
          <datalist id="tipos-artigo">
            {TIPOS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
        <label className={ROTULO}>
          Autor
          <select
            name="autor_id"
            required
            defaultValue={artigo?.autor_id ?? autores[0]?.id}
            className={CAMPO}
          >
            {autores.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          <Link href="/painel/blog/autores" className="font-normal">
            Cadastrar ou editar autores
          </Link>
        </label>
        <label className={ROTULO}>
          Endereço (slug)
          <input
            name="slug"
            defaultValue={artigo?.slug}
            placeholder="gerado pelo título"
            className={CAMPO}
          />
        </label>
        <label className={ROTULO}>
          Data de publicação (opcional, para agendar)
          <input
            type="datetime-local"
            name="publicado_em"
            defaultValue={paraCampo(artigo?.publicado_em ?? null)}
            className={CAMPO}
          />
        </label>
        <label className={`${ROTULO} sm:col-span-2`}>
          Capa (opcional; sem capa, usa uma arte do banco da liga)
          <input
            type="file"
            name="capa"
            accept="image/png,image/jpeg,image/webp"
            className="text-sm font-normal"
          />
          {artigo?.capa_url && (
            <span className="flex items-center gap-3 font-normal">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artigo.capa_url}
                alt=""
                className="h-16 w-28 rounded object-cover"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="remover_capa" /> Remover capa
              </label>
            </span>
          )}
        </label>
      </div>

      {estado?.erro && (
        <p className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 font-semibold text-red-300">
          {estado.erro}
        </p>
      )}
      {estado?.ok && (
        <p className="rounded-lg border border-brasa/50 bg-brasa/10 p-4 font-semibold text-brasa">
          {estado.ok}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-borda pt-6">
        <button
          type="submit"
          name="acao"
          value="publicar"
          disabled={salvando}
          className="corte min-h-12 bg-vermelho px-8 font-semibold uppercase tracking-wide text-white disabled:opacity-60"
        >
          {publicado ? "Atualizar publicação" : "Publicar"}
        </button>
        <button
          type="submit"
          name="acao"
          value="rascunho"
          disabled={salvando}
          className="min-h-12 rounded-lg px-5 font-semibold ring-1 ring-borda-forte hover:ring-brasa disabled:opacity-60"
        >
          {publicado ? "Salvar sem mudar a data" : "Salvar rascunho"}
        </button>
        {publicado && (
          <button
            type="submit"
            name="acao"
            value="despublicar"
            disabled={salvando}
            className={botao("perigo", "md")}
          >
            Tirar do ar
          </button>
        )}
        {artigo && (
          <a
            href={`/blog/${artigo.slug}`}
            target="_blank"
            className="ml-auto text-sm font-semibold"
          >
            Ver no site →
          </a>
        )}
        {salvando && <span className="text-sm text-cinza">Salvando…</span>}
      </div>
    </form>
  );
}
