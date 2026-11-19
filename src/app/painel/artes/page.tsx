import Link from "next/link";
import { botao } from "@/components/Botao";
import { BANCO, creditoArte, srcArte, type GrupoArte } from "@/lib/artes";

export const dynamic = "force-dynamic";

const GRUPOS: { v: GrupoArte; r: string; dica: string }[] = [
  {
    v: "pauper",
    r: "Pauper",
    dica: "Cartas legais no Pauper, das mais jogadas para as menos.",
  },
  {
    v: "premodern",
    r: "Premodern",
    dica: "Cartas legais no Premodern. Marque abaixo para ficar só com as ilustrações da época (até 2003).",
  },
  {
    v: "limited",
    r: "Limited",
    dica: "Raras, míticas e incomuns das últimas coleções. Deixe as coleções em branco para usar as 4 mais recentes.",
  },
  {
    v: "geral",
    r: "Geral",
    dica: "Reserva usada nos banners do site. Não tem lista própria.",
  },
];

const campo =
  "rounded-lg border border-borda-forte bg-preto px-3 py-2 text-sm text-gelo outline-none focus:border-azul";

export default async function Artes({
  searchParams,
}: {
  searchParams: Promise<{ grupo?: string }>;
}) {
  const pedido = (await searchParams).grupo;
  const grupo = GRUPOS.find((g) => g.v === pedido)?.v ?? "pauper";
  const info = GRUPOS.find((g) => g.v === grupo)!;
  const artes = BANCO.filter((a) => a.grupo === grupo);
  const grandes = artes.filter((a) => a.largura >= 1800).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="titulo text-5xl">Artes</h1>
        <p className="mt-2 max-w-2xl text-sm text-texto2">
          Banco de ilustrações em alta resolução usado nas páginas e nos
          e-mails. Cada liga usa o seu grupo; com menos de 8 artes, ela completa
          com o grupo Geral.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {GRUPOS.map((g) => {
          const lista = BANCO.filter((a) => a.grupo === g.v);
          return (
            <Link
              key={g.v}
              href={`/painel/artes?grupo=${g.v}`}
              className={`rounded-xl border p-4 transition hover:border-azul ${
                g.v === grupo
                  ? "border-azul bg-azul/10"
                  : "border-borda bg-fundo2"
              }`}
            >
              <div className="text-xs uppercase tracking-wider text-texto2">
                {g.r}
              </div>
              <div className="mt-1 text-3xl font-semibold text-gelo">
                {lista.length}
              </div>
              <div className="text-xs text-cinza">
                {lista.filter((a) => a.largura >= 1800).length} em tela cheia
              </div>
            </Link>
          );
        })}
      </div>

      {grupo !== "geral" && (
        <section className="rounded-2xl border border-borda bg-fundo2 p-6">
          <h2 className="text-lg font-semibold text-gelo">
            1. Gerar a lista de {info.r}
          </h2>
          <p className="mt-1 text-sm text-texto2">
            {info.dica} Cartas que já estão no banco ficam de fora.
          </p>
          <form
            action="/painel/artes/lista"
            method="get"
            className="mt-5 flex flex-col gap-4"
          >
            <input type="hidden" name="grupo" value={grupo} />
            <div className="flex flex-wrap gap-4">
              <label className="flex flex-col gap-1 text-sm text-texto2">
                Quantidade de cartas
                <input
                  name="quantidade"
                  type="number"
                  min={10}
                  max={500}
                  defaultValue={150}
                  className={`${campo} w-36`}
                />
              </label>
              {grupo === "limited" && (
                <label className="flex flex-col gap-1 text-sm text-texto2">
                  Coleções (códigos, opcional)
                  <input
                    name="colecoes"
                    placeholder="eoe, fin, tdm"
                    className={`${campo} w-56`}
                  />
                </label>
              )}
              <label className="flex flex-1 flex-col gap-1 text-sm text-texto2">
                Filtro extra do Scryfall (opcional)
                <input
                  name="extra"
                  placeholder="ex.: c:u  ou  t:creature"
                  className={`${campo} min-w-52`}
                />
              </label>
            </div>
            {grupo === "premodern" && (
              <label className="flex items-center gap-2 text-sm text-texto2">
                <input
                  type="checkbox"
                  name="epoca"
                  value="1"
                  className="accent-azul"
                />
                Só ilustrações publicadas até 2003
              </label>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                name="tipo"
                value="txt"
                className={botao("primario")}
              >
                Baixar cards.txt
              </button>
              <button
                type="submit"
                name="tipo"
                value="json"
                className={botao("secundario")}
              >
                Baixar lista-{grupo}.json (créditos)
              </button>
            </div>
            <p className="text-xs text-cinza">
              Baixe os dois arquivos com os mesmos filtros. A busca leva alguns
              segundos.
            </p>
          </form>
        </section>
      )}

      {grupo !== "geral" && (
        <section className="rounded-2xl border border-borda bg-fundo2 p-6">
          <h2 className="text-lg font-semibold text-gelo">
            2. Baixar as imagens e importar
          </h2>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm text-texto2">
            <li>
              Abra a pasta do MTG Art Downloader e substitua o{" "}
              <code className="text-ciano">cards.txt</code> pelo que você
              baixou.
            </li>
            <li>
              Rode a ferramenta. As imagens saem na pasta de downloads dela.
            </li>
            <li>
              Mova as imagens e o{" "}
              <code className="text-ciano">lista-{grupo}.json</code> para{" "}
              <code className="text-ciano">
                liga-fim-de-turno/artes-originais/{grupo}/
              </code>
              .
            </li>
            <li>
              Avise o Claude: ele importa, descarta as pequenas (menos de 1600
              px de largura) e revisa o recorte.
            </li>
          </ol>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-gelo">
            No banco: {info.r}
          </h2>
          <span className="text-xs text-cinza">
            {artes.length} artes · {grandes} com 1800 px ou mais
          </span>
        </div>
        {artes.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {artes.map((a) => (
              <figure
                key={a.arquivo}
                className="overflow-hidden rounded-xl border border-borda bg-preto"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={srcArte(a)}
                  alt={a.carta ?? ""}
                  loading="lazy"
                  className="aspect-[16/9] w-full object-cover"
                  style={{ objectPosition: a.foco }}
                />
                <figcaption className="p-2 text-xs text-texto2">
                  <span className="line-clamp-1 text-gelo">
                    {a.carta ?? "Sem nome"}
                  </span>
                  <span className="line-clamp-1" title={creditoArte(a)}>
                    {a.artista} · {a.largura}×{a.altura}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-borda p-6 text-sm text-texto2">
            Nenhuma arte neste grupo ainda. Enquanto isso, a liga usa as artes
            do grupo Geral.
          </p>
        )}
      </section>
    </div>
  );
}
