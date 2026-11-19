import { botao } from "@/components/Botao";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { alternarBanner, salvarBanner } from "./actions";
import { FormularioLoja, type LojaForm } from "./FormularioLoja";
import { ListaProblemas } from "@/components/Diagnostico";
import { problemasDaLoja, type LojaDiag } from "@/lib/diagnostico";

const CAMPO =
  "min-h-11 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-gelo";
const ROTULO = "flex flex-col gap-1 text-sm font-semibold";
const BOTAO = "min-h-11 rounded-lg bg-azul px-5 font-semibold text-white";

type P = LojaForm & {
  id: string;
  nome: string;
  ativo: boolean;
  slug: string | null;
};

export default async function PainelParceiros({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string; salvo?: string }>;
}) {
  const { editar, salvo } = await searchParams;
  const db = criarClienteAdmin();
  const trintaDias = new Date(Date.now() - 30 * 864e5).toISOString();
  const [{ data: parceiros }, { data: banners }, { data: cliques }] =
    await Promise.all([
      db
        .from("parceiros")
        .select("*, credito:lojas_credito(*)")
        .order("ordem")
        .order("nome"),
      db
        .from("banners")
        .select(
          "id, parceiro_id, titulo, posicoes, inicio, fim, ativo, imagem_url",
        )
        .order("criado_em", { ascending: false }),
      db
        .from("cliques")
        .select("parceiro_id, banner_id, origem")
        .gte("criado_em", trintaDias),
    ]);
  const lista = (parceiros as P[] | null) ?? [];
  const atual = lista.find((p) => p.id === editar);
  const problemas = new Map(
    lista.map((p) => [p.id, problemasDaLoja(p as unknown as LojaDiag)]),
  );
  const todos = [...problemas.values()].flat();
  const cont = (
    f: (c: {
      parceiro_id: string;
      banner_id: string | null;
      origem: string;
    }) => boolean,
  ) => (cliques ?? []).filter(f).length;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="titulo text-5xl">Lojas e parceiros</h1>
        <p className="text-sm text-texto2">
          Um cadastro só para patrocinadores, sedes de eventos presenciais,
          lojas que recebem resgate de prêmios e lojas que vendem cartas.
          Cliques dos últimos 30 dias.
        </p>
        {salvo && (
          <p className="rounded-md border border-ciano/50 bg-ciano/10 p-3 text-sm font-semibold text-ciano">
            Loja salva.
            {atual && problemas.get(atual.id)?.length
              ? " Ainda falta completar o que aparece abaixo."
              : ""}
          </p>
        )}
      </div>

      <ListaProblemas problemas={todos} />

      <div className="overflow-x-auto rounded-xl border border-borda">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-cinza">
            <tr>
              <th className="p-3">Loja</th>
              <th className="p-3">Papéis</th>
              <th className="p-3">Logo</th>
              <th className="p-3">Banner</th>
              <th className="p-3">Deck</th>
              <th className="p-3">Situação</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="border-t border-borda p-3 text-texto2"
                >
                  Nenhum parceiro cadastrado.
                </td>
              </tr>
            )}
            {lista.map((p) => (
              <tr key={p.id} className="border-t border-borda">
                <td className="p-3">
                  <span className="flex flex-col">
                    <span className="flex items-center gap-2 font-semibold">
                      {p.nome}
                      {problemas.get(p.id)?.some((x) => x.nivel === "erro") && (
                        <span
                          title="Cadastro incompleto"
                          className="h-2 w-2 rounded-full bg-erro"
                        />
                      )}
                    </span>
                    <span className="text-xs text-cinza">
                      {[p.cidade, p.uf].filter(Boolean).join("/") || "Online"}
                    </span>
                  </span>
                </td>
                <td className="p-3">
                  <span className="flex flex-wrap gap-1">
                    {[
                      [p.mostrar_logo, "Parceiro"],
                      [p.sede_eventos, "Sede"],
                      [
                        p.aceita_credito,
                        p.credito?.pix_chave && p.credito?.email_pedidos
                          ? "Resgate"
                          : "Resgate (incompleto)",
                      ],
                      [p.compra_deck, "Vende cartas"],
                    ]
                      .filter(([v]) => v)
                      .map(([, r]) => (
                        <span
                          key={r as string}
                          className={`rounded px-1.5 py-0.5 text-xs font-semibold ring-1 ${String(r).includes("incompleto") ? "text-alerta ring-alerta/50" : "text-texto2 ring-borda"}`}
                        >
                          {r as string}
                        </span>
                      ))}
                  </span>
                </td>
                <td className="p-3">
                  {cont((c) => c.parceiro_id === p.id && c.origem === "logo")}
                </td>
                <td className="p-3">
                  {cont((c) => c.parceiro_id === p.id && c.origem === "banner")}
                </td>
                <td className="p-3">
                  {cont((c) => c.parceiro_id === p.id && c.origem === "deck")}
                </td>
                <td className="p-3">{p.ativo ? "Ativo" : "Inativo"}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  {p.slug && (
                    <a
                      href={`/parceiros/${p.slug}`}
                      target="_blank"
                      className="mr-3 text-cinza"
                    >
                      Ver
                    </a>
                  )}
                  <a href={`/painel/parceiros?editar=${p.id}#form`}>Editar</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormularioLoja key={atual?.id ?? "nova"} atual={atual ?? null} />

      <section className="flex flex-col gap-4">
        <h2 className="titulo text-3xl">Banners</h2>
        <ul className="flex flex-col border-t border-borda text-sm">
          {(banners ?? []).length === 0 && (
            <li className="py-3 text-texto2">Nenhum banner ainda.</li>
          )}
          {(banners ?? []).map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-borda py-3"
            >
              <span className="flex flex-col">
                <span className="font-semibold">{b.titulo}</span>
                <span className="text-cinza">
                  {lista.find((p) => p.id === b.parceiro_id)?.nome} ·{" "}
                  {(b.posicoes as string[]).join(", ")}
                  {b.inicio || b.fim
                    ? ` · ${b.inicio ?? "…"} a ${b.fim ?? "…"}`
                    : ""}{" "}
                  · {cont((c) => c.banner_id === b.id)} cliques
                </span>
              </span>
              <form action={alternarBanner}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="ativo" value={String(b.ativo)} />
                <BotaoEnviar className={botao("secundario")}>
                  {b.ativo ? "Pausar banner" : "Reativar banner"}
                </BotaoEnviar>
              </form>
            </li>
          ))}
        </ul>

        {lista.length > 0 && (
          <form
            action={salvarBanner}
            className="grid gap-4 rounded-xl border border-borda p-6 sm:grid-cols-2"
          >
            <h3 className="text-lg font-semibold sm:col-span-2">Novo banner</h3>
            <label className={ROTULO}>
              Parceiro
              <select name="parceiro_id" className={CAMPO}>
                {lista.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className={ROTULO}>
              Título
              <input name="titulo" required maxLength={80} className={CAMPO} />
            </label>
            <label className={`${ROTULO} sm:col-span-2`}>
              Texto (opcional)
              <input name="texto" maxLength={140} className={CAMPO} />
            </label>
            <label className={`${ROTULO} sm:col-span-2`}>
              Link de destino (com https://)
              <input
                name="destino_url"
                required
                placeholder="https://"
                className={CAMPO}
              />
            </label>
            <label className={ROTULO}>
              Imagem (opcional, 1200×200 ou similar)
              <input
                type="file"
                name="imagem"
                accept="image/png,image/webp,image/jpeg"
                className="text-sm"
              />
            </label>
            <fieldset className="flex flex-col gap-1 text-sm">
              <legend className="font-semibold">Onde aparece</legend>
              {[
                ["home", "Página inicial"],
                ["evento", "Páginas de evento"],
                ["deck", "Listas de deck"],
              ].map(([v, r]) => (
                <label key={v} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name={`pos_${v}`}
                    defaultChecked={v === "home"}
                  />{" "}
                  {r}
                </label>
              ))}
            </fieldset>
            <label className={ROTULO}>
              Início
              <input type="date" name="inicio" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Fim
              <input type="date" name="fim" className={CAMPO} />
            </label>
            <BotaoEnviar
              className={`${BOTAO} justify-self-start sm:col-span-2`}
            >
              Criar banner
            </BotaoEnviar>
          </form>
        )}
      </section>
    </div>
  );
}
