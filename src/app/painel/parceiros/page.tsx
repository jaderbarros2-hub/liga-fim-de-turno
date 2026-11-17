import { criarClienteAdmin } from "@/lib/supabase/admin";
import { alternarBanner, salvarBanner, salvarParceiro } from "./actions";

const CAMPO = "min-h-11 w-full rounded-lg border border-borda-forte bg-fundo2 px-3 text-gelo";
const ROTULO = "flex flex-col gap-1 text-sm font-semibold";
const BOTAO = "min-h-11 rounded-lg bg-azul px-5 font-semibold text-white";

type P = {
  id: string;
  nome: string;
  descricao: string | null;
  logo_url: string | null;
  site_url: string;
  url_compra_lista: string | null;
  compra_deck: boolean;
  ativo: boolean;
  ordem: number;
};

export default async function PainelParceiros({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const { editar } = await searchParams;
  const db = criarClienteAdmin();
  const trintaDias = new Date(Date.now() - 30 * 864e5).toISOString();
  const [{ data: parceiros }, { data: banners }, { data: cliques }] = await Promise.all([
    db.from("parceiros").select("*").order("ordem").order("nome"),
    db.from("banners").select("id, parceiro_id, titulo, posicoes, inicio, fim, ativo, imagem_url").order("criado_em", { ascending: false }),
    db.from("cliques").select("parceiro_id, banner_id, origem").gte("criado_em", trintaDias),
  ]);
  const lista = (parceiros as P[] | null) ?? [];
  const atual = lista.find((p) => p.id === editar);
  const cont = (f: (c: { parceiro_id: string; banner_id: string | null; origem: string }) => boolean) =>
    (cliques ?? []).filter(f).length;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="titulo text-5xl">Parceiros</h1>
        <p className="text-sm text-texto2">
          Logos aparecem na página inicial e em /parceiros. Banners aparecem nas posições escolhidas. Cliques dos
          últimos 30 dias.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-borda">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-cinza">
            <tr>
              <th className="p-3">Parceiro</th>
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
                <td colSpan={6} className="border-t border-borda p-3 text-texto2">
                  Nenhum parceiro cadastrado.
                </td>
              </tr>
            )}
            {lista.map((p) => (
              <tr key={p.id} className="border-t border-borda">
                <td className="p-3 font-semibold">{p.nome}</td>
                <td className="p-3">{cont((c) => c.parceiro_id === p.id && c.origem === "logo")}</td>
                <td className="p-3">{cont((c) => c.parceiro_id === p.id && c.origem === "banner")}</td>
                <td className="p-3">{cont((c) => c.parceiro_id === p.id && c.origem === "deck")}</td>
                <td className="p-3">{p.ativo ? "Ativo" : "Inativo"}</td>
                <td className="p-3 text-right">
                  <a href={`/painel/parceiros?editar=${p.id}#form`}>Editar</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form id="form" action={salvarParceiro} className="grid scroll-mt-20 gap-4 rounded-xl border border-borda p-6 sm:grid-cols-2">
        <h2 className="titulo text-3xl sm:col-span-2">{atual ? `Editar ${atual.nome}` : "Novo parceiro"}</h2>
        {atual && <input type="hidden" name="id" value={atual.id} />}
        <label className={ROTULO}>
          Nome
          <input name="nome" required defaultValue={atual?.nome} className={CAMPO} />
        </label>
        <label className={ROTULO}>
          Site (com https://)
          <input name="site_url" required defaultValue={atual?.site_url} placeholder="https://" className={CAMPO} />
        </label>
        <label className={`${ROTULO} sm:col-span-2`}>
          Descrição curta
          <input name="descricao" defaultValue={atual?.descricao ?? ""} className={CAMPO} />
        </label>
        <label className={`${ROTULO} sm:col-span-2`}>
          Link de compra por lista (opcional)
          <input
            name="url_compra_lista"
            defaultValue={atual?.url_compra_lista ?? ""}
            placeholder="https://loja.com.br/lista?cards={lista}"
            className={CAMPO}
          />
          <span className="font-normal text-cinza">
            Use {"{lista}"} onde a loja recebe as cartas. Sem isso, o botão copia a lista e abre o site.
          </span>
        </label>
        <label className={ROTULO}>
          Logo (PNG, SVG ou WebP, até 3 MB)
          <input type="file" name="logo" accept="image/png,image/svg+xml,image/webp,image/jpeg" className="text-sm" />
          {atual?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={atual.logo_url} alt="" className="mt-2 h-10 w-auto self-start object-contain" />
          )}
        </label>
        <label className={ROTULO}>
          Ordem na faixa
          <input name="ordem" type="number" defaultValue={atual?.ordem ?? 0} className={CAMPO} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="compra_deck" defaultChecked={atual?.compra_deck} /> Mostrar no botão “Comprar este deck”
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="ativo" defaultChecked={atual?.ativo ?? true} /> Ativo
        </label>
        <div className="flex gap-4 sm:col-span-2">
          <button type="submit" className={BOTAO}>
            Salvar parceiro
          </button>
          {atual && <a href="/painel/parceiros" className="self-center text-sm">Cancelar</a>}
        </div>
      </form>

      <section className="flex flex-col gap-4">
        <h2 className="titulo text-3xl">Banners</h2>
        <ul className="flex flex-col border-t border-borda text-sm">
          {(banners ?? []).length === 0 && <li className="py-3 text-texto2">Nenhum banner ainda.</li>}
          {(banners ?? []).map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-borda py-3">
              <span className="flex flex-col">
                <span className="font-semibold">{b.titulo}</span>
                <span className="text-cinza">
                  {lista.find((p) => p.id === b.parceiro_id)?.nome} · {(b.posicoes as string[]).join(", ")}
                  {b.inicio || b.fim ? ` · ${b.inicio ?? "…"} a ${b.fim ?? "…"}` : ""} ·{" "}
                  {cont((c) => c.banner_id === b.id)} cliques
                </span>
              </span>
              <form action={alternarBanner}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="ativo" value={String(b.ativo)} />
                <button type="submit" className="font-semibold text-ciano">
                  {b.ativo ? "Pausar" : "Reativar"}
                </button>
              </form>
            </li>
          ))}
        </ul>

        {lista.length > 0 && (
          <form action={salvarBanner} className="grid gap-4 rounded-xl border border-borda p-6 sm:grid-cols-2">
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
              <input name="destino_url" required placeholder="https://" className={CAMPO} />
            </label>
            <label className={ROTULO}>
              Imagem (opcional, 1200×200 ou similar)
              <input type="file" name="imagem" accept="image/png,image/webp,image/jpeg" className="text-sm" />
            </label>
            <fieldset className="flex flex-col gap-1 text-sm">
              <legend className="font-semibold">Onde aparece</legend>
              {[
                ["home", "Página inicial"],
                ["evento", "Páginas de evento"],
                ["deck", "Listas de deck"],
              ].map(([v, r]) => (
                <label key={v} className="flex items-center gap-2">
                  <input type="checkbox" name={`pos_${v}`} defaultChecked={v === "home"} /> {r}
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
            <button type="submit" className={`${BOTAO} justify-self-start sm:col-span-2`}>
              Criar banner
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
